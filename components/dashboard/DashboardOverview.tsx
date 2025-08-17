'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  BookmarkIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { getSubscriptionTier, getRemainingSearches } from '@/lib/config/subscription';

interface SearchQuery {
  id: string;
  query: string;
  created_at: string;
  user_id: string;
  results_count?: number;
}

interface DashboardOverviewProps {
  user: User;
  subscriptionTier: string;
  todaySearches: number;
  recentSearches: SearchQuery[];
}


const quickStats = [
  {
    name: 'Today\'s Searches',
    icon: MagnifyingGlassIcon,
    href: '/dashboard/search',
    color: 'blue',
  },
  {
    name: 'Search History',
    icon: ClockIcon,
    href: '/dashboard/history',
    color: 'green',
  },
  {
    name: 'Saved Companies',
    icon: BookmarkIcon,
    href: '/dashboard/saved',
    color: 'purple',
  },
  {
    name: 'Analytics',
    icon: ChartBarIcon,
    href: '/dashboard/analytics',
    color: 'orange',
  },
];

export default function DashboardOverview({ 
  user, 
  subscriptionTier, 
  todaySearches, 
  recentSearches 
}: DashboardOverviewProps) {
  const tier = getSubscriptionTier(subscriptionTier);
  const searchesRemaining = getRemainingSearches(subscriptionTier, todaySearches);

  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Usage
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Searches Used */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Searches Used
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {todaySearches}
                </p>
              </div>
              <div className="text-blue-500">
                <MagnifyingGlassIcon className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <span>
                  {typeof tier.limits.searches === 'number' 
                    ? `${searchesRemaining} remaining of ${tier.limits.searches}`
                    : 'Unlimited searches available'
                  }
                </span>
              </div>
              {typeof tier.limits.searches === 'number' && (
                <div className="mt-2">
                  <div className="bg-blue-200 dark:bg-blue-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(100, (todaySearches / tier.limits.searches) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Tier */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Current Plan
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 capitalize">
                  {subscriptionTier}
                </p>
              </div>
              <div className="text-green-500">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-green-600 dark:text-green-400">
                {tier.limits.results} results per search
              </p>
              {subscriptionTier === 'free' && (
                <Link 
                  href="/account"
                  className="mt-2 inline-flex text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                >
                  Upgrade plan →
                </Link>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Quick Actions
                </p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  Get Started
                </p>
              </div>
              <div className="text-purple-500">
                <BookmarkIcon className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-2">
              <Link 
                href="/dashboard/search"
                className="inline-flex text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100"
              >
                Search companies →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20 group-hover:bg-${stat.color}-200 dark:group-hover:bg-${stat.color}-900/30 transition-colors`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                  {stat.name}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Searches
            </h2>
            <Link 
              href="/dashboard/history"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentSearches.map((search, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {search.query}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(search.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/search?q=${encodeURIComponent(search.query)}`}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Search again
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Message for New Users */}
      {recentSearches.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MagnifyingGlassIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Welcome to Nexus AI!
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Start by searching for UK companies to uncover ownership structures, officer relationships, and risk analysis.
              </p>
              <div className="mt-3">
                <Link
                  href="/dashboard/search"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Searching
                  <MagnifyingGlassIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}