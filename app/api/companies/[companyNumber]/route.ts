/**
 * Company Details API Endpoint
 * 
 * Fetches detailed company information including officers and PSCs
 * from local database or Companies House API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createCompaniesHouseService, CompaniesHouseError, isValidCompanyNumber } from '@/lib/services/companies-house';
import { getUser, getSubscription, logSearchQuery } from '@/utils/supabase/queries';
import type { Database } from '@/types_db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ParamsSchema = z.object({
  companyNumber: z.string().min(1, 'Company number is required'),
});

const QueryParamsSchema = z.object({
  source: z.enum(['local', 'companies_house', 'both']).default('both'),
  includeOfficers: z.coerce.boolean().default(true),
  includePSCs: z.coerce.boolean().default(true),
  refresh: z.coerce.boolean().default(false), // Force refresh from Companies House
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get company from local database
 */
async function getLocalCompany(supabase: any, companyNumber: string) {
  const startTime = Date.now();
  
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_officers (
          *,
          persons (*)
        ),
        parent_relationships:company_relationships!from_company_id (
          *,
          to_company:companies!to_company_id (*)
        ),
        child_relationships:company_relationships!to_company_id (
          *,
          from_company:companies!from_company_id (*)
        )
      `)
      .eq('company_number', companyNumber.toUpperCase())
      .single();

    const executionTime = Date.now() - startTime;

    if (error) {
      if (error.code === 'PGRST116') {
        return { company: null, executionTime, notFound: true };
      }
      throw error;
    }

    return { company, executionTime, source: 'local' as const };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Local company fetch error:', error);
    return { company: null, executionTime, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get company from Companies House API and cache it
 */
async function getCompaniesHouseCompany(
  supabase: any, 
  companyNumber: string, 
  includeOfficers: boolean = true,
  includePSCs: boolean = true
) {
  const startTime = Date.now();
  
  try {
    const companiesHouseService = createCompaniesHouseService();
    const profile = await companiesHouseService.getCompleteProfile(companyNumber);
    
    const executionTime = Date.now() - startTime;

    if (!profile.company) {
      return { 
        company: null, 
        executionTime, 
        notFound: true,
        errors: profile.errors 
      };
    }

    // Cache the company data
    const cachedCompany = await cacheCompanyData(supabase, profile);

    return {
      company: cachedCompany,
      executionTime,
      source: 'companies_house' as const,
      errors: profile.errors
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    if (error instanceof CompaniesHouseError) {
      if (error.statusCode === 404) {
        return { 
          company: null, 
          executionTime, 
          notFound: true,
          error: 'Company not found' 
        };
      }
      return { 
        company: null, 
        executionTime, 
        error: error.message,
        statusCode: error.statusCode 
      };
    }
    
    console.error('Companies House fetch error:', error);
    return { 
      company: null, 
      executionTime, 
      error: 'Failed to fetch from Companies House API' 
    };
  }
}

/**
 * Cache company data from Companies House in local database
 */
async function cacheCompanyData(supabase: any, profile: any) {
  try {
    const { company: chCompany, officers, pscs } = profile;
    
    // Map Companies House company data to our schema
    const companyData = {
      company_number: chCompany.company_number,
      name: chCompany.company_name,
      status: mapCompaniesHouseStatus(chCompany.company_status),
      company_type: mapCompaniesHouseType(chCompany.company_type),
      incorporation_date: chCompany.date_of_creation ? 
        new Date(chCompany.date_of_creation).toISOString().split('T')[0] : null,
      dissolution_date: chCompany.date_of_dissolution ? 
        new Date(chCompany.date_of_dissolution).toISOString().split('T')[0] : null,
      jurisdiction: chCompany.jurisdiction || 'GB',
      registered_address: chCompany.registered_office_address ? 
        formatAddress(chCompany.registered_office_address) : null,
      postal_code: chCompany.registered_office_address?.postal_code || null,
      sic_codes: chCompany.sic_codes || [],
      last_synced_at: new Date().toISOString(),
    };

    // Upsert company
    const { data: savedCompany, error: companyError } = await supabase
      .from('companies')
      .upsert(companyData, { 
        onConflict: 'company_number',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (companyError) {
      throw companyError;
    }

    // Cache officers and PSCs
    await Promise.all([
      cacheOfficers(supabase, savedCompany.id, officers),
      cachePSCs(supabase, savedCompany.id, pscs)
    ]);

    // Return the cached company with relationships
    return await getLocalCompany(supabase, chCompany.company_number);
  } catch (error) {
    console.error('Error caching company data:', error);
    throw error;
  }
}

/**
 * Cache officers data
 */
async function cacheOfficers(supabase: any, companyId: string, officers: any[]) {
  if (!officers?.length) return;

  for (const officer of officers) {
    try {
      // Create or find person
      const personData = {
        full_name: officer.name,
        date_of_birth: officer.date_of_birth ? 
          new Date(officer.date_of_birth.year, officer.date_of_birth.month - 1, 1).toISOString().split('T')[0] : null,
        nationality: officer.nationality || null,
        address: officer.address ? formatAddress(officer.address) : null,
        postal_code: officer.address?.postal_code || null,
        normalized_name: officer.name.toLowerCase().trim(),
      };

      const { data: person, error: personError } = await supabase
        .from('persons')
        .upsert(personData, { 
          onConflict: 'normalized_name',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (personError) {
        console.error('Error upserting person:', personError);
        continue;
      }

      // Create officer appointment
      const officerData = {
        company_id: companyId,
        person_id: person.id,
        role: mapOfficerRole(officer.officer_role),
        appointed_on: officer.appointed_on ? 
          new Date(officer.appointed_on).toISOString().split('T')[0] : null,
        resigned_on: officer.resigned_on ? 
          new Date(officer.resigned_on).toISOString().split('T')[0] : null,
      };

      await supabase
        .from('company_officers')
        .upsert(officerData, { 
          onConflict: 'company_id,person_id,role,appointed_on',
          ignoreDuplicates: true 
        });
    } catch (error) {
      console.error('Error caching officer:', error);
      // Continue with next officer
    }
  }
}

/**
 * Cache PSCs data  
 */
async function cachePSCs(supabase: any, companyId: string, pscs: any[]) {
  if (!pscs?.length) return;

  for (const psc of pscs) {
    try {
      const personName = psc.name || 
        (psc.name_elements ? `${psc.name_elements.forename || ''} ${psc.name_elements.surname || ''}`.trim() : 'Unknown');
      
      // Create or find person
      const personData = {
        full_name: personName,
        date_of_birth: psc.date_of_birth ? 
          new Date(psc.date_of_birth.year, psc.date_of_birth.month - 1, 1).toISOString().split('T')[0] : null,
        nationality: psc.nationality || null,
        address: psc.address ? formatAddress(psc.address) : null,
        postal_code: psc.address?.postal_code || null,
        normalized_name: personName.toLowerCase().trim(),
      };

      const { data: person, error: personError } = await supabase
        .from('persons')
        .upsert(personData, { 
          onConflict: 'normalized_name',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (personError) {
        console.error('Error upserting PSC person:', personError);
        continue;
      }

      // Create PSC appointment as officer
      const officerData = {
        company_id: companyId,
        person_id: person.id,
        role: 'person_of_significant_control' as any,
        appointed_on: psc.notified_on ? 
          new Date(psc.notified_on).toISOString().split('T')[0] : null,
        resigned_on: psc.ceased_on ? 
          new Date(psc.ceased_on).toISOString().split('T')[0] : null,
      };

      await supabase
        .from('company_officers')
        .upsert(officerData, { 
          onConflict: 'company_id,person_id,role,appointed_on',
          ignoreDuplicates: true 
        });
    } catch (error) {
      console.error('Error caching PSC:', error);
      // Continue with next PSC
    }
  }
}

/**
 * Helper functions for mapping data
 */
function mapCompaniesHouseStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'dissolved': 'dissolved',
    'liquidation': 'liquidation',
    'administration': 'suspended',
    'dormant': 'dormant',
    'strike-off': 'strike_off',
  };
  return statusMap[status?.toLowerCase()] || 'unknown';
}

function mapCompaniesHouseType(type: string): string {
  const typeMap: Record<string, string> = {
    'private-limited-guarant-nsc-limited-exemption': 'private_limited',
    'private-limited-guarant-nsc': 'private_limited',
    'private-limited-shares-section-30-exemption': 'private_limited',
    'ltd': 'private_limited',
    'plc': 'public_limited',
    'limited-partnership': 'limited_partnership',
    'llp': 'llp',
  };
  return typeMap[type?.toLowerCase()] || 'other';
}

function mapOfficerRole(role: string): string {
  const roleMap: Record<string, string> = {
    'director': 'director',
    'secretary': 'secretary',
    'llp-member': 'director',
    'member': 'director',
  };
  return roleMap[role?.toLowerCase()] || 'other';
}

function formatAddress(address: any): string {
  if (!address) return '';
  
  const parts = [
    address.premises,
    address.address_line_1,
    address.address_line_2,
    address.locality,
    address.region,
    address.postal_code,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { companyNumber: string } }
) {
  const startTime = Date.now();
  
  try {
    // Parse and validate parameters
    const { companyNumber } = ParamsSchema.parse(params);
    
    const searchParams = request.nextUrl.searchParams;
    const queryParams = QueryParamsSchema.parse({
      source: searchParams.get('source'),
      includeOfficers: searchParams.get('includeOfficers'),
      includePSCs: searchParams.get('includePSCs'),
      refresh: searchParams.get('refresh'),
    });

    // Validate company number format
    if (!isValidCompanyNumber(companyNumber)) {
      return NextResponse.json(
        { error: 'Invalid company number format' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get authenticated user
    const user = await getUser(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let result = { company: null, executionTime: 0, source: 'none' as const };
    let errors: string[] = [];

    // Determine search strategy
    if (queryParams.refresh || queryParams.source === 'companies_house') {
      // Force fetch from Companies House
      const chResult = await getCompaniesHouseCompany(
        supabase, 
        companyNumber, 
        queryParams.includeOfficers, 
        queryParams.includePSCs
      );
      result = {
        company: chResult.company,
        executionTime: chResult.executionTime,
        source: chResult.source || 'companies_house' as const
      };
    } else if (queryParams.source === 'local') {
      // Only search local database
      const localResult = await getLocalCompany(supabase, companyNumber);
      result = {
        company: localResult.company,
        executionTime: localResult.executionTime,
        source: localResult.source || 'local' as const
      };
    } else {
      // Default: try local first, then Companies House if not found or stale
      const localResult = await getLocalCompany(supabase, companyNumber);
      
      if (localResult.company) {
        // Check if data is fresh (less than 24 hours old)
        const lastSynced = new Date(localResult.company.last_synced_at || 0);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (lastSynced > dayAgo) {
          result = {
            company: localResult.company,
            executionTime: localResult.executionTime,
            source: 'local' as const
          };
        } else {
          // Data is stale, refresh from Companies House
          const chResult = await getCompaniesHouseCompany(
            supabase, 
            companyNumber, 
            queryParams.includeOfficers, 
            queryParams.includePSCs
          );
          result = {
            company: chResult.company || localResult.company,
            executionTime: chResult.executionTime,
            source: chResult.company ? 'companies_house' as const : 'local' as const
          };
        }
      } else {
        // Not found locally, try Companies House
        const chResult = await getCompaniesHouseCompany(
          supabase, 
          companyNumber, 
          queryParams.includeOfficers, 
          queryParams.includePSCs
        );
        result = {
          company: chResult.company,
          executionTime: chResult.executionTime,
          source: chResult.source || 'companies_house' as const
        };
      }
    }

    // Handle errors
    if (result.error) {
      errors.push(result.error);
    }

    // Company not found
    if (result.notFound || !result.company) {
      return NextResponse.json(
        { 
          error: 'Company not found',
          companyNumber,
          errors: errors.length > 0 ? errors : undefined
        },
        { status: 404 }
      );
    }

    // Log the query for analytics
    const totalExecutionTime = Date.now() - startTime;
    await logSearchQuery(supabase, {
      user_id: user.id,
      query_text: companyNumber,
      query_type: 'company_details',
      results_count: 1,
      execution_time_ms: totalExecutionTime,
    });

    return NextResponse.json({
      company: result.company.company || result.company,
      officers: result.company.company_officers || [],
      relationships: {
        parent: result.company.parent_relationships || [],
        children: result.company.child_relationships || [],
      },
      metadata: {
        companyNumber,
        source: result.source,
        executionTimeMs: totalExecutionTime,
        lastSynced: result.company.last_synced_at,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

  } catch (error) {
    console.error('Company details API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}