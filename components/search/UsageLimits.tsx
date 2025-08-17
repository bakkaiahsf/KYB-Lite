'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface UsageLimitsProps {
  subscriptionTier: string;
  todaySearches: number;
  limits: {
    searches: number | string;
    results: number;
  };
  canSearch: boolean;
}

export default function UsageLimits({
  subscriptionTier,
  todaySearches,
  limits,
  canSearch,
}: UsageLimitsProps) {
  const searchesRemaining = typeof limits.searches === 'number' 
    ? Math.max(0, limits.searches - todaySearches)
    : 'Unlimited';

  const usagePercentage = typeof limits.searches === 'number'
    ? Math.min(100, (todaySearches / limits.searches) * 100)
    : 0;

  const getStatusColor = () => {
    if (!canSearch) return 'red';
    if (usagePercentage > 80) return 'orange';
    if (usagePercentage > 60) return 'yellow';
    return 'green';
  };

  const statusColor = getStatusColor();

  return (
    <div className={`rounded-lg border p-4 ${
      !canSearch 
        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
        : statusColor === 'orange'
        ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700'
        : statusColor === 'yellow'
        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'
        : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {!canSearch ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            ) : (
              <CheckCircleIcon className={`h-6 w-6 ${
                statusColor === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                statusColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`} />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${
              !canSearch 
                ? 'text-red-800 dark:text-red-200'
                : statusColor === 'orange'
                ? 'text-orange-800 dark:text-orange-200'
                : statusColor === 'yellow'
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-green-800 dark:text-green-200'
            }`}>
              {!canSearch 
                ? 'Daily search limit reached' 
                : 'Search usage'
              }
            </h3>
            
            <div className={`mt-1 text-sm ${
              !canSearch 
                ? 'text-red-700 dark:text-red-300'
                : statusColor === 'orange'
                ? 'text-orange-700 dark:text-orange-300'
                : statusColor === 'yellow'
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-green-700 dark:text-green-300'
            }`}>
              <span className="font-medium">{todaySearches}</span> searches used today
              {typeof limits.searches === 'number' && (
                <>
                  <span className="mx-1">•</span>
                  <span className="font-medium">{searchesRemaining}</span> remaining
                </>
              )}
            </div>

            {/* Usage Progress Bar */}
            {typeof limits.searches === 'number' && (
              <div className="mt-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      !canSearch 
                        ? 'bg-red-600'
                        : statusColor === 'orange'
                        ? 'bg-orange-600'
                        : statusColor === 'yellow'
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(100, usagePercentage)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Plan Details */}
            <div className="mt-2 flex items-center text-xs space-x-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                subscriptionTier === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                subscriptionTier === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                subscriptionTier === 'basic' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan
              </span>
              
              <span className={`${
                !canSearch 
                  ? 'text-red-600 dark:text-red-400'
                  : statusColor === 'orange'
                  ? 'text-orange-600 dark:text-orange-400'
                  : statusColor === 'yellow'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {limits.results} results per search
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        {(!canSearch || subscriptionTier === 'free') && (
          <div className="flex-shrink-0">
            <Link
              href="/account"
              className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                !canSearch
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Upgrade Plan
            </Link>
          </div>
        )}
      </div>

      {/* Additional messaging */}
      {!canSearch && (
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
          <p className="text-xs text-red-600 dark:text-red-400">
            Your daily search limit has been reached. Upgrade to a higher plan for more searches, 
            or wait until tomorrow for your limit to reset.
          </p>
        </div>
      )}

      {canSearch && usagePercentage > 80 && subscriptionTier === 'free' && (
        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
          <p className="text-xs text-orange-600 dark:text-orange-400">
            You're approaching your daily limit. Consider upgrading for unlimited searches and advanced features.
          </p>
        </div>
      )}
    </div>
  );
}