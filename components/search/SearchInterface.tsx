'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import SearchFilters from './SearchFilters';
import UsageLimits from './UsageLimits';
import { User } from '@supabase/supabase-js';

interface SearchInterfaceProps {
  user: User;
  subscriptionTier: string;
  todaySearches: number;
  initialQuery?: string;
  currentPage: number;
}

interface SearchFilters {
  status?: string;
  company_type?: string;
  jurisdiction?: string;
  include_officers?: boolean;
  include_pscs?: boolean;
}

interface SearchResult {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  address_snippet: string;
  snippet?: string;
  matches?: {
    title?: number[];
    snippet?: number[];
  };
}

const subscriptionLimits = {
  free: { searches: 5, results: 5 },
  basic: { searches: 100, results: 20 },
  pro: { searches: 1000, results: 50 },
  enterprise: { searches: 'Unlimited', results: 100 },
};

export default function SearchInterface({
  user,
  subscriptionTier,
  todaySearches,
  initialQuery = '',
  currentPage = 1,
}: SearchInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    include_officers: true,
    include_pscs: true,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentSearchPage, setCurrentSearchPage] = useState(currentPage);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  const limits = subscriptionLimits[subscriptionTier as keyof typeof subscriptionLimits];
  const canSearch = typeof limits.searches === 'number' 
    ? todaySearches < limits.searches 
    : true;

  // Perform search
  const performSearch = async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) return;
    
    if (!canSearch) {
      setError('Daily search limit reached. Please upgrade your plan to continue searching.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const searchUrl = new URL('/api/companies/search', window.location.origin);
      searchUrl.searchParams.set('q', searchQuery.trim());
      searchUrl.searchParams.set('page', page.toString());
      searchUrl.searchParams.set('items_per_page', limits.results.toString());
      
      // Add filters
      if (filters.status) searchUrl.searchParams.set('status', filters.status);
      if (filters.company_type) searchUrl.searchParams.set('company_type', filters.company_type);
      if (filters.jurisdiction) searchUrl.searchParams.set('jurisdiction', filters.jurisdiction);
      if (filters.include_officers) searchUrl.searchParams.set('include_officers', 'true');
      if (filters.include_pscs) searchUrl.searchParams.set('include_pscs', 'true');

      const response = await fetch(searchUrl.toString());
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in.');
        }
        if (response.status === 403) {
          throw new Error('Search limit exceeded. Please upgrade your plan.');
        }
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error('Search failed. Please try again.');
      }

      const data = await response.json();
      setResults(data.results || []);
      setTotalResults(data.total_results || 0);
      setCurrentSearchPage(page);

      // Update URL without triggering a page reload
      const newUrl = new URLSearchParams();
      newUrl.set('q', searchQuery.trim());
      if (page > 1) newUrl.set('page', page.toString());
      router.replace(`/dashboard/search?${newUrl.toString()}`, { scroll: false });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery, 1);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query.trim()) {
      performSearch(query, 1);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (query.trim()) {
      performSearch(query, page);
    }
  };

  // Load initial search if query is provided
  useEffect(() => {
    if (initialQuery && !hasSearched) {
      performSearch(initialQuery, currentPage);
    }
  }, [initialQuery, currentPage]);

  const totalPages = Math.ceil(totalResults / limits.results);

  return (
    <div className="space-y-6">
      {/* Usage Limits */}
      <UsageLimits
        subscriptionTier={subscriptionTier}
        todaySearches={todaySearches}
        limits={limits}
        canSearch={canSearch}
      />

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SearchBar
          query={query}
          onSearch={handleSearch}
          isLoading={isLoading}
          disabled={!canSearch}
        />
      </div>

      {/* Search Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        disabled={isLoading || !canSearch}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Search Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <SearchResults
          results={results}
          isLoading={isLoading}
          totalResults={totalResults}
          currentPage={currentSearchPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          subscriptionTier={subscriptionTier}
          searchQuery={query}
        />
      )}

      {/* Welcome Message for New Users */}
      {!hasSearched && !isLoading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-8 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              Ready to search UK companies?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Enter a company name or registration number above to get started with detailed company intelligence, officer relationships, and risk analysis.
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              <p>✓ Real-time data from Companies House</p>
              <p>✓ Officer and PSC relationships</p>
              <p>✓ Company status and history</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}