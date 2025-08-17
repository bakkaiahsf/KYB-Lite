'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Company {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  address_snippet: string;
}

export default function CompanySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      setResults(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="company-search" className="py-24 sm:py-32 bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Search UK Companies
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-300">
            Search from over 15 million companies registered with Companies House
          </p>
        </div>

        <div className="mt-12 mx-auto max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter company name or number..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-4 pl-12 pr-32 text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-md bg-red-900/50 border border-red-700 p-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-white">Search Results</h3>
              <div className="space-y-3">
                {results.map((company) => (
                  <Link
                    key={company.company_number}
                    href={`/company/${company.company_number}`}
                    className="block rounded-lg border border-gray-700 bg-gray-800 p-6 hover:border-gray-600 hover:bg-gray-750 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <BuildingOfficeIcon className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-medium text-white truncate">
                          {company.title}
                        </h4>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-400">
                          <span>#{company.company_number}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            company.company_status === 'active' 
                              ? 'bg-green-900/50 text-green-200' 
                              : 'bg-gray-700 text-gray-300'
                          }`}>
                            {company.company_status}
                          </span>
                          <span>{company.company_type}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                          {company.address_snippet}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Incorporated: {new Date(company.date_of_creation).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}