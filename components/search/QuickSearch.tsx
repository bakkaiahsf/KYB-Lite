'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function QuickSearch() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    
    // Navigate to search page with query
    router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleExampleSearch = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const exampleSearches = [
    'Microsoft Corporation',
    'Apple Inc',
    'Google LLC',
    'Amazon',
    'Tesla'
  ];

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company name or number..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Searching...
            </div>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* Example Searches */}
      <div className="text-sm">
        <span className="text-gray-600 dark:text-gray-400 mr-2">Try:</span>
        <div className="inline-flex flex-wrap gap-2 mt-1">
          {exampleSearches.map((example) => (
            <button
              key={example}
              onClick={() => handleExampleSearch(example)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Search Tips:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Search by company name (e.g., "Microsoft Corporation")</li>
          <li>• Use company registration number for exact matches</li>
          <li>• Try partial names for broader results</li>
          <li>• Include "Ltd", "PLC", or "Limited" for UK companies</li>
        </ul>
      </div>
    </div>
  );
}