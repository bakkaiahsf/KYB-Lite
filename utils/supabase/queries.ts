import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import type { Database } from '../../types_db';

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

export const getUser = cache(async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});

export const getSubscription = cache(async (supabase: SupabaseClient) => {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  return subscription;
});

export const getProducts = cache(async (supabase: SupabaseClient) => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  return products;
});

export const getUserDetails = cache(async (supabase: SupabaseClient) => {
  const { data: userDetails } = await supabase
    .from('users')
    .select('*')
    .single();
  return userDetails;
});

// ============================================================================
// COMPANY INTELLIGENCE FUNCTIONS
// ============================================================================

/**
 * Search companies using the built-in search function
 */
export const searchCompanies = async (
  supabase: SupabaseClient<Database>,
  searchTerm: string,
  options?: {
    limit?: number;
  }
) => {
  const { data, error } = await supabase.rpc('search_companies', {
    search_term: searchTerm,
    limit_count: options?.limit || 50
  });

  if (error) {
    console.error('Error searching companies:', error);
    return null;
  }

  return data;
};

/**
 * Get company details with officers and relationships
 */
export const getCompanyDetails = cache(async (
  supabase: SupabaseClient<Database>,
  companyId: string
) => {
  const { data: company, error: companyError } = await supabase
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
    .eq('id', companyId)
    .single();

  if (companyError) {
    console.error('Error fetching company details:', companyError);
    return null;
  }

  return company;
});

/**
 * Get person details with company appointments
 */
export const getPersonDetails = cache(async (
  supabase: SupabaseClient<Database>,
  personId: string
) => {
  const { data: person, error } = await supabase
    .from('persons')
    .select(`
      *,
      company_officers (
        *,
        companies (*)
      )
    `)
    .eq('id', personId)
    .single();

  if (error) {
    console.error('Error fetching person details:', error);
    return null;
  }

  return person;
});

/**
 * Get companies by jurisdiction
 */
export const getCompaniesByJurisdiction = cache(async (
  supabase: SupabaseClient<Database>,
  jurisdiction: string,
  limit: number = 100
) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('jurisdiction', jurisdiction)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching companies by jurisdiction:', error);
    return [];
  }

  return data || [];
});

/**
 * Get active company officers for a company
 */
export const getActiveOfficers = cache(async (
  supabase: SupabaseClient<Database>,
  companyId: string
) => {
  const { data, error } = await supabase
    .from('company_officers')
    .select(`
      *,
      persons (*)
    `)
    .eq('company_id', companyId)
    .is('resigned_on', null)
    .order('appointed_on', { ascending: false });

  if (error) {
    console.error('Error fetching active officers:', error);
    return [];
  }

  return data || [];
});

/**
 * Get sanctions screening results for a company or person
 */
export const getScreeningResults = cache(async (
  supabase: SupabaseClient<Database>,
  entityName: string
) => {
  const { data, error } = await supabase
    .from('sanctions_entries')
    .select(`
      *,
      sanctions_lists (*)
    `)
    .ilike('entity_name', `%${entityName}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching screening results:', error);
    return [];
  }

  return data || [];
});

/**
 * Create a new company record
 */
export const createCompany = async (
  supabase: SupabaseClient<Database>,
  companyData: Tables['companies']['Insert']
) => {
  const { data, error } = await supabase
    .from('companies')
    .insert(companyData)
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    throw error;
  }

  return data;
};

/**
 * Update a company record
 */
export const updateCompany = async (
  supabase: SupabaseClient<Database>,
  companyId: string,
  companyData: Tables['companies']['Update']
) => {
  const { data, error } = await supabase
    .from('companies')
    .update(companyData)
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }

  return data;
};

/**
 * Create a new person record
 */
export const createPerson = async (
  supabase: SupabaseClient<Database>,
  personData: Tables['persons']['Insert']
) => {
  const { data, error } = await supabase
    .from('persons')
    .insert(personData)
    .select()
    .single();

  if (error) {
    console.error('Error creating person:', error);
    throw error;
  }

  return data;
};

/**
 * Add an officer appointment to a company
 */
export const addCompanyOfficer = async (
  supabase: SupabaseClient<Database>,
  officerData: Tables['company_officers']['Insert']
) => {
  const { data, error } = await supabase
    .from('company_officers')
    .insert(officerData)
    .select()
    .single();

  if (error) {
    console.error('Error adding company officer:', error);
    throw error;
  }

  return data;
};

/**
 * Create a company relationship
 */
export const createCompanyRelationship = async (
  supabase: SupabaseClient<Database>,
  relationshipData: Tables['company_relationships']['Insert']
) => {
  const { data, error } = await supabase
    .from('company_relationships')
    .insert(relationshipData)
    .select()
    .single();

  if (error) {
    console.error('Error creating company relationship:', error);
    throw error;
  }

  return data;
};

/**
 * Create a sanctions entry
 */
export const createSanctionsEntry = async (
  supabase: SupabaseClient<Database>,
  entryData: Tables['sanctions_entries']['Insert']
) => {
  const { data, error } = await supabase
    .from('sanctions_entries')
    .insert(entryData)
    .select()
    .single();

  if (error) {
    console.error('Error creating sanctions entry:', error);
    throw error;
  }

  return data;
};

/**
 * Log a search query for analytics
 */
export const logSearchQuery = async (
  supabase: SupabaseClient<Database>,
  queryData: Tables['search_queries']['Insert']
) => {
  const { data, error } = await supabase
    .from('search_queries')
    .insert(queryData)
    .select()
    .single();

  if (error) {
    console.error('Error logging search query:', error);
    // Don't throw error for analytics logging
    return null;
  }

  return data;
};

/**
 * Get basic company statistics
 */
export const getCompanyStatistics = cache(async (
  supabase: SupabaseClient<Database>
) => {
  try {
    const [companies, persons, officers] = await Promise.all([
      supabase.from('companies').select('status', { count: 'exact' }),
      supabase.from('persons').select('id', { count: 'exact' }),
      supabase.from('company_officers').select('role', { count: 'exact' })
    ]);

    return {
      totalCompanies: companies.count || 0,
      totalPersons: persons.count || 0,
      totalOfficers: officers.count || 0,
      companyStatusBreakdown: companies.data?.reduce((acc, company) => {
        acc[company.status] = (acc[company.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };
  } catch (error) {
    console.error('Error fetching company statistics:', error);
    return {
      totalCompanies: 0,
      totalPersons: 0,
      totalOfficers: 0,
      companyStatusBreakdown: {}
    };
  }
});

/**
 * Check if user has active subscription for company intelligence features
 */
export const hasCompanyIntelligenceAccess = cache(async (
  supabase: SupabaseClient<Database>
) => {
  const subscription = await getSubscription(supabase);
  
  if (!subscription) {
    return false;
  }

  // Check if subscription includes company intelligence features
  const productId = subscription.prices?.product_id;
  return productId && ['prod_nexus_basic', 'prod_nexus_pro', 'prod_nexus_enterprise'].includes(productId);
});

/**
 * Validate RLS policies by testing access
 */
export const validateRLSAccess = async (
  supabase: SupabaseClient<Database>
) => {
  try {
    // Test company access
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    // Test persons access
    const { data: persons, error: personsError } = await supabase
      .from('persons')
      .select('id, full_name')
      .limit(1);

    // Test sanctions access
    const { data: sanctions, error: sanctionsError } = await supabase
      .from('sanctions_entries')
      .select('id, entity_name')
      .limit(1);

    return {
      companies: !companiesError,
      persons: !personsError,
      sanctions: !sanctionsError,
      errors: {
        companies: companiesError?.message,
        persons: personsError?.message,
        sanctions: sanctionsError?.message
      }
    };
  } catch (error) {
    console.error('Error validating RLS access:', error);
    return {
      companies: false,
      persons: false,
      sanctions: false,
      errors: {
        general: 'Failed to validate access'
      }
    };
  }
};
