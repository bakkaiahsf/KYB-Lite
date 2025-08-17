import { Suspense } from 'react';
import SearchInterface from '@/components/search/SearchInterface';

export const metadata = {
  title: 'Company Search - KYB Lite',
  description: 'Search UK companies and analyze ownership structures, officers, and risk factors',
};

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  // Mock data for public demo - no authentication required
  const mockUser = null;
  const subscriptionTier = 'demo';
  const todaySearches = 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Company Search
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Search and analyze UK companies with real-time data from Companies House
          </p>
        </div>

        {/* Search Interface */}
        <Suspense fallback={<SearchSkeleton />}>
          <SearchInterface
            user={mockUser}
            subscriptionTier={subscriptionTier}
            todaySearches={todaySearches}
            initialQuery={searchParams.q}
            currentPage={parseInt(searchParams.page || '1')}
          />
        </Suspense>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search bar skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      
      {/* Results skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}