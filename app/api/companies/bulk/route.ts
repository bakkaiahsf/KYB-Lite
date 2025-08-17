/**
 * Bulk Company Search API Endpoint
 * 
 * Handles bulk company searches and batch operations
 * For Pro/Enterprise subscribers only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createCompaniesHouseService, isValidCompanyNumber } from '@/lib/services/companies-house';
import { getUser, getSubscription, logSearchQuery } from '@/utils/supabase/queries';
import type { Database } from '@/types_db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const BulkSearchSchema = z.object({
  searches: z.array(z.object({
    id: z.string().optional(), // Client-provided ID for tracking
    query: z.string().min(1).max(100),
    type: z.enum(['name', 'number']).default('name'),
  })).min(1).max(100, 'Maximum 100 searches per request'),
  options: z.object({
    source: z.enum(['local', 'companies_house', 'both']).default('both'),
    limit: z.coerce.number().min(1).max(10).default(5), // Per search limit
    includeOfficers: z.boolean().default(false),
    cacheMisses: z.boolean().default(true), // Cache Companies House results
  }).optional().default({}),
});

const BulkDetailsSchema = z.object({
  companyNumbers: z.array(z.string().min(1)).min(1).max(50, 'Maximum 50 companies per request'),
  options: z.object({
    source: z.enum(['local', 'companies_house', 'both']).default('both'),
    includeOfficers: z.boolean().default(true),
    includePSCs: z.boolean().default(true),
    refresh: z.boolean().default(false),
  }).optional().default({}),
});

// ============================================================================
// SUBSCRIPTION ACCESS CONTROL
// ============================================================================

const TIER_LIMITS = {
  free: { bulkOperations: false },
  basic: { bulkOperations: false },
  pro: { bulkOperations: true, maxBulkSize: 25 },
  enterprise: { bulkOperations: true, maxBulkSize: 100 },
};

async function checkBulkAccess(supabase: any): Promise<{ allowed: boolean; tier: string; maxSize?: number }> {
  const subscription = await getSubscription(supabase);
  
  if (!subscription) {
    return { allowed: false, tier: 'free' };
  }

  const productId = subscription.prices?.products?.id;
  const tierMap: Record<string, keyof typeof TIER_LIMITS> = {
    'prod_nexus_pro': 'pro',
    'prod_nexus_enterprise': 'enterprise',
  };

  const tier = tierMap[productId] || 'free';
  const limits = TIER_LIMITS[tier];

  return {
    allowed: limits.bulkOperations,
    tier,
    maxSize: limits.maxBulkSize,
  };
}

// ============================================================================
// BULK SEARCH HANDLER
// ============================================================================

async function handleBulkSearch(supabase: any, userId: string, data: z.infer<typeof BulkSearchSchema>) {
  const companiesHouseService = createCompaniesHouseService();
  const results = [];
  const errors = [];

  for (const search of data.searches) {
    const searchStartTime = Date.now();
    
    try {
      let searchResults = [];

      // Search local database
      if (data.options.source === 'local' || data.options.source === 'both') {
        const { data: localResults, error } = await supabase.rpc('search_companies', {
          search_term: search.query,
          limit_count: data.options.limit
        });

        if (!error && localResults) {
          searchResults = localResults.map((company: any) => ({
            ...company,
            source: 'local'
          }));
        }
      }

      // Search Companies House if needed
      if ((data.options.source === 'companies_house' || data.options.source === 'both') &&
          searchResults.length < data.options.limit) {
        try {
          const chResults = await companiesHouseService.searchCompanies(
            search.query, 
            data.options.limit - searchResults.length
          );

          const mappedResults = chResults.map(company => ({
            id: null,
            company_number: company.company_number,
            name: company.title,
            status: mapStatus(company.company_status),
            incorporation_date: company.date_of_creation,
            registered_address: company.address_snippet,
            source: 'companies_house'
          }));

          searchResults.push(...mappedResults);

          // Cache results if enabled
          if (data.options.cacheMisses) {
            await cacheSearchResults(supabase, chResults);
          }
        } catch (chError) {
          errors.push({
            searchId: search.id,
            query: search.query,
            error: `Companies House error: ${chError.message}`,
          });
        }
      }

      const searchTime = Date.now() - searchStartTime;

      results.push({
        searchId: search.id,
        query: search.query,
        type: search.type,
        results: searchResults.slice(0, data.options.limit),
        executionTimeMs: searchTime,
        resultCount: searchResults.length,
      });

      // Log individual search
      await logSearchQuery(supabase, {
        user_id: userId,
        query_text: search.query,
        query_type: `bulk_search_${search.type}`,
        results_count: searchResults.length,
        execution_time_ms: searchTime,
      });

    } catch (error) {
      console.error(`Bulk search error for query "${search.query}":`, error);
      errors.push({
        searchId: search.id,
        query: search.query,
        error: error.message,
      });
    }
  }

  return { results, errors };
}

// ============================================================================
// BULK DETAILS HANDLER
// ============================================================================

async function handleBulkDetails(supabase: any, userId: string, data: z.infer<typeof BulkDetailsSchema>) {
  const companiesHouseService = createCompaniesHouseService();
  const results = [];
  const errors = [];

  for (const companyNumber of data.companyNumbers) {
    const detailStartTime = Date.now();
    
    try {
      if (!isValidCompanyNumber(companyNumber)) {
        errors.push({
          companyNumber,
          error: 'Invalid company number format',
        });
        continue;
      }

      let company = null;

      // Try local database first (unless refresh is requested)
      if (!data.options.refresh && (data.options.source === 'local' || data.options.source === 'both')) {
        const { data: localCompany, error } = await supabase
          .from('companies')
          .select(`
            *,
            ${data.options.includeOfficers ? 'company_officers (*, persons (*)),' : ''}
            parent_relationships:company_relationships!from_company_id (
              *, to_company:companies!to_company_id (*)
            ),
            child_relationships:company_relationships!to_company_id (
              *, from_company:companies!from_company_id (*)
            )
          `)
          .eq('company_number', companyNumber.toUpperCase())
          .single();

        if (!error && localCompany) {
          company = localCompany;
        }
      }

      // Fetch from Companies House if not found locally or refresh requested
      if (!company && (data.options.source === 'companies_house' || data.options.source === 'both' || data.options.refresh)) {
        try {
          const profile = await companiesHouseService.getCompleteProfile(companyNumber);
          
          if (profile.company) {
            // Cache the company data
            company = await cacheCompanyProfile(supabase, profile);
          }
        } catch (chError) {
          errors.push({
            companyNumber,
            error: `Companies House error: ${chError.message}`,
          });
          continue;
        }
      }

      const detailTime = Date.now() - detailStartTime;

      if (company) {
        results.push({
          companyNumber,
          company,
          executionTimeMs: detailTime,
          source: company.last_synced_at ? 
            (new Date(company.last_synced_at) > new Date(Date.now() - 60000) ? 'companies_house' : 'local') : 
            'local',
        });
      } else {
        errors.push({
          companyNumber,
          error: 'Company not found',
        });
      }

      // Log individual lookup
      await logSearchQuery(supabase, {
        user_id: userId,
        query_text: companyNumber,
        query_type: 'bulk_company_details',
        results_count: company ? 1 : 0,
        execution_time_ms: detailTime,
      });

    } catch (error) {
      console.error(`Bulk details error for company ${companyNumber}:`, error);
      errors.push({
        companyNumber,
        error: error.message,
      });
    }
  }

  return { results, errors };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapStatus(status: string): string {
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

async function cacheSearchResults(supabase: any, results: any[]) {
  try {
    for (const company of results) {
      const companyData = {
        company_number: company.company_number,
        name: company.title,
        status: mapStatus(company.company_status),
        company_type: company.company_type || 'other',
        incorporation_date: company.date_of_creation ? 
          new Date(company.date_of_creation).toISOString().split('T')[0] : null,
        registered_address: company.address_snippet || null,
        jurisdiction: 'GB',
        last_synced_at: new Date().toISOString(),
      };

      await supabase
        .from('companies')
        .upsert(companyData, { 
          onConflict: 'company_number',
          ignoreDuplicates: false 
        });
    }
  } catch (error) {
    console.error('Error caching search results:', error);
    // Non-critical error
  }
}

async function cacheCompanyProfile(supabase: any, profile: any) {
  // This would be similar to the caching logic in the company details endpoint
  // Implementation omitted for brevity - reuse logic from [companyNumber]/route.ts
  return profile.company;
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
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

    // Check bulk operation access
    const access = await checkBulkAccess(supabase);
    if (!access.allowed) {
      return NextResponse.json(
        { 
          error: 'Bulk operations require Pro or Enterprise subscription',
          tier: access.tier,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const operation = body.operation; // 'search' or 'details'

    let results, errors;
    
    if (operation === 'search') {
      const data = BulkSearchSchema.parse(body);
      
      if (data.searches.length > access.maxSize!) {
        return NextResponse.json(
          { 
            error: `Maximum ${access.maxSize} searches allowed per request for ${access.tier} tier`,
            limit: access.maxSize
          },
          { status: 400 }
        );
      }

      ({ results, errors } = await handleBulkSearch(supabase, user.id, data));
      
    } else if (operation === 'details') {
      const data = BulkDetailsSchema.parse(body);
      
      if (data.companyNumbers.length > access.maxSize!) {
        return NextResponse.json(
          { 
            error: `Maximum ${access.maxSize} companies allowed per request for ${access.tier} tier`,
            limit: access.maxSize
          },
          { status: 400 }
        );
      }

      ({ results, errors } = await handleBulkDetails(supabase, user.id, data));
      
    } else {
      return NextResponse.json(
        { error: 'Invalid operation. Must be "search" or "details"' },
        { status: 400 }
      );
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      operation,
      results,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        totalResults: results.length,
        totalErrors: errors.length,
        executionTimeMs: totalTime,
        tier: access.tier,
      },
    });

  } catch (error) {
    console.error('Bulk API error:', error);
    
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