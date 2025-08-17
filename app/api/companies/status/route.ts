/**
 * Companies API Status Endpoint
 * 
 * Provides system status, rate limits, and user quota information
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createCompaniesHouseService } from '@/lib/services/companies-house';
import { getUser, getSubscription } from '@/utils/supabase/queries';
import type { Database } from '@/types_db';

// ============================================================================
// SUBSCRIPTION TIERS AND LIMITS
// ============================================================================

const SUBSCRIPTION_LIMITS = {
  free: {
    searchesPerDay: 5,
    resultsPerSearch: 5,
    bulkOperations: false,
    apiAccess: 'basic',
  },
  basic: {
    searchesPerDay: 100,
    resultsPerSearch: 20,
    bulkOperations: false,
    apiAccess: 'standard',
  },
  pro: {
    searchesPerDay: 1000,
    resultsPerSearch: 50,
    bulkOperations: true,
    apiAccess: 'full',
  },
  enterprise: {
    searchesPerDay: -1, // unlimited
    resultsPerSearch: 100,
    bulkOperations: true,
    apiAccess: 'full',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getUserTier(supabase: any): Promise<keyof typeof SUBSCRIPTION_LIMITS> {
  const subscription = await getSubscription(supabase);
  
  if (!subscription) {
    return 'free';
  }

  const productId = subscription.prices?.products?.id;
  
  const tierMap: Record<string, keyof typeof SUBSCRIPTION_LIMITS> = {
    'prod_nexus_basic': 'basic',
    'prod_nexus_pro': 'pro',
    'prod_nexus_enterprise': 'enterprise',
  };

  return tierMap[productId] || 'free';
}

async function getUserUsage(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's search count
  const { data: todaySearches, error: searchError } = await supabase
    .from('search_queries')
    .select('id, query_type, execution_time_ms, created_at')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)
    .order('created_at', { ascending: false });

  if (searchError) {
    console.error('Error fetching user usage:', searchError);
    return {
      todaySearches: 0,
      recentQueries: [],
      error: searchError.message
    };
  }

  // Get this month's usage stats
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { data: monthlyStats, error: monthlyError } = await supabase
    .from('search_queries')
    .select('query_type, execution_time_ms')
    .eq('user_id', userId)
    .gte('created_at', `${thisMonth}-01T00:00:00.000Z`)
    .lt('created_at', `${thisMonth}-31T23:59:59.999Z`);

  const monthlyUsage = monthlyStats?.reduce((acc, query) => {
    acc.totalQueries++;
    acc.totalExecutionTime += query.execution_time_ms || 0;
    acc.queryTypes[query.query_type] = (acc.queryTypes[query.query_type] || 0) + 1;
    return acc;
  }, {
    totalQueries: 0,
    totalExecutionTime: 0,
    queryTypes: {} as Record<string, number>
  }) || { totalQueries: 0, totalExecutionTime: 0, queryTypes: {} };

  return {
    todaySearches: todaySearches?.length || 0,
    recentQueries: todaySearches?.slice(0, 5) || [],
    monthly: monthlyUsage,
    error: monthlyError?.message
  };
}

async function getSystemHealth() {
  const checks = {
    database: { status: 'unknown', responseTime: 0 },
    companiesHouse: { status: 'unknown', responseTime: 0, rateLimitStatus: null },
  };

  // Test database connection
  try {
    const dbStartTime = Date.now();
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    checks.database.responseTime = Date.now() - dbStartTime;
    checks.database.status = error ? 'error' : 'healthy';
  } catch (error) {
    checks.database.status = 'error';
  }

  // Test Companies House API
  try {
    const chStartTime = Date.now();
    const companiesHouseService = createCompaniesHouseService();
    
    // Use a known test company number
    await companiesHouseService.searchCompanies('test', 1);
    
    checks.companiesHouse.responseTime = Date.now() - chStartTime;
    checks.companiesHouse.status = 'healthy';
    checks.companiesHouse.rateLimitStatus = companiesHouseService.getRateLimitStatus();
  } catch (error) {
    checks.companiesHouse.status = 'error';
  }

  return checks;
}

async function getDatabaseStats(supabase: any) {
  try {
    // Get basic statistics
    const stats = await Promise.allSettled([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('persons').select('id', { count: 'exact', head: true }),
      supabase.from('company_officers').select('id', { count: 'exact', head: true }),
      supabase.from('search_queries').select('id', { count: 'exact', head: true }),
    ]);

    const [companies, persons, officers, searches] = stats.map(result => 
      result.status === 'fulfilled' ? result.value.count : 0
    );

    // Get recent activity
    const { data: recentCompanies } = await supabase
      .from('companies')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      totals: {
        companies: companies || 0,
        persons: persons || 0,
        officers: officers || 0,
        searches: searches || 0,
      },
      recentActivity: recentCompanies || [],
    };
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return {
      totals: { companies: 0, persons: 0, officers: 0, searches: 0 },
      recentActivity: [],
      error: error.message
    };
  }
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeHealth = searchParams.get('health') === 'true';
    const includeStats = searchParams.get('stats') === 'true';

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
    
    // Get authenticated user (optional for some status info)
    const user = await getUser(supabase);
    
    const response: any = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
    };

    // Include user-specific information if authenticated
    if (user) {
      const tier = await getUserTier(supabase);
      const limits = SUBSCRIPTION_LIMITS[tier];
      const usage = await getUserUsage(supabase, user.id);

      response.user = {
        id: user.id,
        tier,
        limits,
        usage,
        remainingSearches: limits.searchesPerDay === -1 ? 
          'unlimited' : 
          Math.max(0, limits.searchesPerDay - usage.todaySearches),
      };
    }

    // Include system health checks if requested
    if (includeHealth) {
      response.health = await getSystemHealth();
    }

    // Include database statistics if requested
    if (includeStats && user) {
      response.stats = await getDatabaseStats(supabase);
    }

    // Include API endpoint documentation
    response.endpoints = {
      search: {
        path: '/api/companies/search',
        method: 'GET',
        description: 'Search for companies by name or number',
        parameters: ['q', 'source', 'limit', 'page'],
        authentication: 'required',
      },
      details: {
        path: '/api/companies/[companyNumber]',
        method: 'GET',
        description: 'Get detailed company information',
        parameters: ['source', 'includeOfficers', 'includePSCs', 'refresh'],
        authentication: 'required',
      },
      bulk: {
        path: '/api/companies/bulk',
        method: 'POST',
        description: 'Bulk search or details operations',
        subscription: 'Pro/Enterprise only',
        authentication: 'required',
      },
      status: {
        path: '/api/companies/status',
        method: 'GET',
        description: 'API status and user quota information',
        parameters: ['health', 'stats'],
        authentication: 'optional',
      },
    };

    // Include rate limiting headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      const tier = await getUserTier(supabase);
      const limits = SUBSCRIPTION_LIMITS[tier];
      
      headers['X-RateLimit-Limit'] = limits.searchesPerDay.toString();
      headers['X-RateLimit-Remaining'] = response.user?.remainingSearches?.toString() || '0';
      headers['X-Subscription-Tier'] = tier;
    }

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Status API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HEALTH CHECK ENDPOINT (HEAD)
// ============================================================================

export async function HEAD(request: NextRequest) {
  try {
    const health = await getSystemHealth();
    
    const allHealthy = Object.values(health).every(check => check.status === 'healthy');
    
    return new NextResponse(null, {
      status: allHealthy ? 200 : 503,
      headers: {
        'X-Health-Database': health.database.status,
        'X-Health-CompaniesHouse': health.companiesHouse.status,
        'X-Response-Time-Database': health.database.responseTime.toString(),
        'X-Response-Time-CompaniesHouse': health.companiesHouse.responseTime.toString(),
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}