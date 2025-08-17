import { createClient } from '@/utils/supabase/server';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import QuickSearch from '@/components/search/QuickSearch';

export default async function DashboardPage() {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's recent search queries
  const { data: recentSearches } = await supabase
    .from('search_queries')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get user's subscription and usage stats
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user?.id)
    .single();

  const subscriptionTier = subscription?.status === 'active' 
    ? subscription.price_id?.includes('pro') ? 'pro'
    : subscription.price_id?.includes('enterprise') ? 'enterprise' 
    : subscription.price_id?.includes('basic') ? 'basic'
    : 'free'
    : 'free';

  // Calculate daily usage
  const today = new Date().toISOString().split('T')[0];
  const { count: todaySearches } = await supabase
    .from('search_queries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .gte('created_at', today);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Company Intelligence Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Search and analyze UK companies with real-time data from Companies House
        </p>
      </div>

      {/* Quick Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Company Search
        </h2>
        <QuickSearch />
      </div>

      {/* Dashboard Overview */}
      <DashboardOverview 
        user={user}
        subscriptionTier={subscriptionTier}
        todaySearches={todaySearches || 0}
        recentSearches={recentSearches || []}
      />
    </div>
  );
}