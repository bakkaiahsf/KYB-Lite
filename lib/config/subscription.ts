/**
 * Centralized subscription configuration
 * This file contains all subscription-related constants and configuration
 */

export interface SubscriptionLimits {
  searches: number | 'Unlimited';
  results: number;
  daily_limit: number | 'Unlimited';
  features: string[];
}

export interface SubscriptionTier {
  id: string;
  name: string;
  displayName: string;
  limits: SubscriptionLimits;
  color: string;
  price?: {
    monthly: number;
    yearly: number;
  };
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    limits: {
      searches: 5,
      results: 5,
      daily_limit: 5,
      features: ['basic_search', 'company_profiles'],
    },
    color: 'gray',
  },
  basic: {
    id: 'basic',
    name: 'basic',
    displayName: 'Basic',
    limits: {
      searches: 100,
      results: 20,
      daily_limit: 100,
      features: ['basic_search', 'company_profiles', 'search_history', 'export_csv'],
    },
    color: 'green',
    price: {
      monthly: 29,
      yearly: 290,
    },
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    limits: {
      searches: 1000,
      results: 50,
      daily_limit: 1000,
      features: [
        'basic_search',
        'company_profiles',
        'search_history',
        'export_csv',
        'advanced_filters',
        'relationship_mapping',
        'risk_analysis',
        'saved_companies',
      ],
    },
    color: 'blue',
    price: {
      monthly: 99,
      yearly: 990,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    limits: {
      searches: 'Unlimited',
      results: 100,
      daily_limit: 'Unlimited',
      features: [
        'basic_search',
        'company_profiles',
        'search_history',
        'export_csv',
        'advanced_filters',
        'relationship_mapping',
        'risk_analysis',
        'saved_companies',
        'bulk_operations',
        'api_access',
        'team_management',
        'custom_reports',
        'priority_support',
      ],
    },
    color: 'purple',
    price: {
      monthly: 299,
      yearly: 2990,
    },
  },
};

/**
 * Get subscription tier configuration by name
 */
export function getSubscriptionTier(tierName: string): SubscriptionTier {
  return SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS.free;
}

/**
 * Check if a feature is available for a subscription tier
 */
export function hasFeature(tierName: string, feature: string): boolean {
  const tier = getSubscriptionTier(tierName);
  return tier.limits.features.includes(feature);
}

/**
 * Get daily search limit for a subscription tier
 */
export function getDailySearchLimit(tierName: string): number | 'Unlimited' {
  const tier = getSubscriptionTier(tierName);
  return tier.limits.searches;
}

/**
 * Get results per search limit for a subscription tier
 */
export function getResultsPerSearchLimit(tierName: string): number {
  const tier = getSubscriptionTier(tierName);
  return tier.limits.results;
}

/**
 * Check if user can perform more searches today
 */
export function canPerformSearch(tierName: string, todaySearches: number): boolean {
  const limit = getDailySearchLimit(tierName);
  if (limit === 'Unlimited') return true;
  return todaySearches < limit;
}

/**
 * Calculate remaining searches for today
 */
export function getRemainingSearches(tierName: string, todaySearches: number): number | 'Unlimited' {
  const limit = getDailySearchLimit(tierName);
  if (limit === 'Unlimited') return 'Unlimited';
  return Math.max(0, limit - todaySearches);
}

/**
 * Get subscription tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): string {
  if (priceId?.includes('enterprise')) return 'enterprise';
  if (priceId?.includes('pro')) return 'pro';
  if (priceId?.includes('basic')) return 'basic';
  return 'free';
}

export default SUBSCRIPTION_TIERS;