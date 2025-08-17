import DashboardOverview from '@/components/dashboard/DashboardOverview';
import QuickSearch from '@/components/search/QuickSearch';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';

export default function DashboardPage() {
  // Mock data for public demo - no authentication required
  const mockData = {
    user: null,
    subscriptionTier: 'demo',
    todaySearches: 0,
    recentSearches: [],
    totalCompanies: 15000000,
    activeCompanies: 4800000,
    recentUpdates: 12500
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-white">
            Company Intelligence Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Search and analyze UK companies with real-time data from Companies House
          </p>
        </div>

        {/* Analytics Overview */}
        <AnalyticsOverview data={mockData} />

        {/* Quick Search */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Quick Company Search
          </h2>
          <QuickSearch />
        </div>

        {/* Dashboard Overview */}
        <DashboardOverview 
          user={mockData.user}
          subscriptionTier={mockData.subscriptionTier}
          todaySearches={mockData.todaySearches}
          recentSearches={mockData.recentSearches}
        />
      </div>
    </div>
  );
}