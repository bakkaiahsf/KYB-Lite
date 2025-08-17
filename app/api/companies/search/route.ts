/**
 * Companies Search API Endpoint
 * 
 * Handles company search requests using both local database and Companies House API
 * Enforces subscription limits and caches results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { createCompaniesHouseService, CompaniesHouseError } from '@/lib/services/companies-house';
import { getUser, getSubscription, logSearchQuery } from '@/utils/supabase/queries';
import type { Database } from '@/types_db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SearchParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  source: z.enum(['local', 'companies_house', 'both']).default('both'),
  limit: z.coerce.number().min(1).max(50).default(20),
  page: z.coerce.number().min(1).default(1),
});

// ============================================================================
// SUBSCRIPTION TIERS AND LIMITS
// ============================================================================

const SUBSCRIPTION_LIMITS = {
  free: {
    searchesPerDay: 5,
    resultsPerSearch: 5,
  },
  basic: {
    searchesPerDay: 100,
    resultsPerSearch: 20,
  },
  pro: {
    searchesPerDay: 1000,
    resultsPerSearch: 50,
  },
  enterprise: {
    searchesPerDay: -1, // unlimited
    resultsPerSearch: 100,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user's subscription tier
 */
async function getUserTier(supabase: any): Promise<keyof typeof SUBSCRIPTION_LIMITS> {
  const subscription = await getSubscription(supabase);
  
  if (!subscription) {
    return 'free';
  }

  const productId = subscription.prices?.products?.id;
  
  // Map product IDs to tiers (these would match your Stripe product IDs)
  const tierMap: Record<string, keyof typeof SUBSCRIPTION_LIMITS> = {
    'prod_nexus_basic': 'basic',
    'prod_nexus_pro': 'pro',  
    'prod_nexus_enterprise': 'enterprise',
  };

  return tierMap[productId] || 'free';
}

/**
 * Check if user has exceeded daily search limit
 */
async function checkSearchLimit(supabase: any, userId: string, tier: keyof typeof SUBSCRIPTION_LIMITS): Promise<boolean> {
  const limit = SUBSCRIPTION_LIMITS[tier].searchesPerDay;
  
  if (limit === -1) {
    return true; // unlimited
  }

  const today = new Date().toISOString().split('T')[0];
  
  const { data: searches, error } = await supabase
    .from('search_queries')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);

  if (error) {
    console.error('Error checking search limit:', error);
    return false;
  }

  return (searches?.length || 0) < limit;
}

/**
 * Search local database
 */
async function searchLocalDatabase(supabase: any, query: string, limit: number) {
  const startTime = Date.now();
  
  const { data, error } = await supabase.rpc('search_companies', {
    search_term: query,
    limit_count: limit
  });

  const executionTime = Date.now() - startTime;

  if (error) {
    console.error('Local search error:', error);
    return { results: [], executionTime, error: error.message };
  }

  return { 
    results: data || [], 
    executionTime,
    source: 'local' as const
  };
}

/**
 * Search Companies House API and cache results
 */
async function searchCompaniesHouse(supabase: any, query: string, limit: number) {
  const startTime = Date.now();
  
  try {
    const companiesHouseService = createCompaniesHouseService();
    const results = await companiesHouseService.searchCompanies(query, limit);
    
    const executionTime = Date.now() - startTime;

    // Cache results in local database for future searches
    await cacheCompaniesHouseResults(supabase, results);

    return {
      results: results.map(company => ({
        company_number: company.company_number,
        name: company.title,
        status: mapCompaniesHouseStatus(company.company_status),
        company_type: company.company_type || 'other',
        incorporation_date: company.date_of_creation ? new Date(company.date_of_creation).toISOString().split('T')[0] : null,
        registered_address: company.address_snippet || null,
        source: 'companies_house' as const
      })),
      executionTime,
      source: 'companies_house' as const
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    if (error instanceof CompaniesHouseError) {
      return { 
        results: [], 
        executionTime, 
        error: error.message, 
        statusCode: error.statusCode 
      };
    }
    
    console.error('Companies House search error:', error);
    return { 
      results: [], 
      executionTime, 
      error: 'Failed to search Companies House API' 
    };
  }
}

/**
 * Cache Companies House results in local database
 */
async function cacheCompaniesHouseResults(supabase: any, results: any[]) {
  try {
    for (const company of results) {
      const companyData = {
        company_number: company.company_number,
        name: company.title,
        status: mapCompaniesHouseStatus(company.company_status),
        company_type: company.company_type || 'other',
        incorporation_date: company.date_of_creation ? new Date(company.date_of_creation).toISOString().split('T')[0] : null,
        registered_address: company.address_snippet || null,
        jurisdiction: 'GB',
        last_synced_at: new Date().toISOString(),
      };

      // Upsert company data
      await supabase
        .from('companies')
        .upsert(companyData, { 
          onConflict: 'company_number',
          ignoreDuplicates: false 
        });
    }
  } catch (error) {
    console.error('Error caching Companies House results:', error);
    // Don't throw - caching is non-critical
  }
}

/**
 * Map Companies House status to our enum
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

  return statusMap[status.toLowerCase()] || 'unknown';
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request parameters
    const searchParams = request.nextUrl.searchParams;
    const params = SearchParamsSchema.parse({
      q: searchParams.get('q'),
      source: searchParams.get('source'),
      limit: searchParams.get('limit'),
      page: searchParams.get('page'),
    });

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

    // Get user's subscription tier
    const tier = await getUserTier(supabase);
    
    // Check search limits
    const canSearch = await checkSearchLimit(supabase, user.id, tier);
    if (!canSearch) {
      return NextResponse.json(
        { 
          error: 'Daily search limit exceeded',
          limit: SUBSCRIPTION_LIMITS[tier].searchesPerDay,
          tier 
        },
        { status: 429 }
      );
    }

    // Enforce result limits based on subscription
    const maxResults = SUBSCRIPTION_LIMITS[tier].resultsPerSearch;
    const actualLimit = Math.min(params.limit, maxResults);

    // Perform search based on source parameter
    let localResults = { results: [], executionTime: 0, source: 'local' as const };
    let companiesHouseResults = { results: [], executionTime: 0, source: 'companies_house' as const };
    let errors: string[] = [];

    if (params.source === 'local' || params.source === 'both') {
      localResults = await searchLocalDatabase(supabase, params.q, actualLimit);
      if (localResults.error) {
        errors.push(`Local search: ${localResults.error}`);
      }
    }

    if (params.source === 'companies_house' || params.source === 'both') {
      // Only search Companies House if we don't have enough local results or source is explicitly companies_house
      if (params.source === 'companies_house' || localResults.results.length < actualLimit) {
        companiesHouseResults = await searchCompaniesHouse(supabase, params.q, actualLimit);
        if (companiesHouseResults.error) {
          errors.push(`Companies House: ${companiesHouseResults.error}`);
        }
      }
    }

    // Combine and deduplicate results
    const allResults = [...localResults.results, ...companiesHouseResults.results];
    const uniqueResults = allResults.reduce((acc, current) => {
      const exists = acc.find(item => item.company_number === current.company_number);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as any[]);

    // Apply pagination
    const startIndex = (params.page - 1) * actualLimit;
    const paginatedResults = uniqueResults.slice(startIndex, startIndex + actualLimit);

    // Log search query for analytics
    const totalExecutionTime = Date.now() - startTime;
    await logSearchQuery(supabase, {
      user_id: user.id,
      query_text: params.q,
      query_type: 'company_search',
      results_count: paginatedResults.length,
      execution_time_ms: totalExecutionTime,
    });

    // Return results
    return NextResponse.json({
      results: paginatedResults,
      pagination: {
        page: params.page,
        limit: actualLimit,
        total: uniqueResults.length,
        hasMore: uniqueResults.length > startIndex + actualLimit,
      },
      metadata: {
        query: params.q,
        source: params.source,
        tier,
        searchesRemaining: tier === 'enterprise' ? -1 : SUBSCRIPTION_LIMITS[tier].searchesPerDay - 1,
        executionTimeMs: totalExecutionTime,
        sources: {
          local: localResults.results.length,
          companiesHouse: companiesHouseResults.results.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      },
    });

  } catch (error) {
    console.error('Company search API error:', error);
    
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

// ============================================================================
// RATE LIMITING INFO ENDPOINT
// ============================================================================

export async function HEAD(request: NextRequest) {
  try {
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
    const user = await getUser(supabase);
    
    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const tier = await getUserTier(supabase);
    const canSearch = await checkSearchLimit(supabase, user.id, tier);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Search-Limit': SUBSCRIPTION_LIMITS[tier].searchesPerDay.toString(),
        'X-Search-Remaining': canSearch ? 'true' : 'false',
        'X-Subscription-Tier': tier,
        'X-Results-Limit': SUBSCRIPTION_LIMITS[tier].resultsPerSearch.toString(),
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}