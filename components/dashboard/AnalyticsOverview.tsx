'use client';

import { 
  BuildingOfficeIcon, 
  ChartBarIcon, 
  ClockIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalCompanies: number;
  activeCompanies: number;
  recentUpdates: number;
}

interface AnalyticsOverviewProps {
  data: {
    totalCompanies: number;
    activeCompanies: number;
    recentUpdates: number;
  };
}

export default function AnalyticsOverview({ data }: AnalyticsOverviewProps) {
  const stats = [
    {
      id: 'total-companies',
      name: 'Total UK Companies',
      value: data.totalCompanies.toLocaleString(),
      icon: BuildingOfficeIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'active-companies',
      name: 'Active Companies',
      value: data.activeCompanies.toLocaleString(),
      icon: ChartBarIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/20'
    },
    {
      id: 'recent-updates',
      name: 'Today\'s Updates',
      value: data.recentUpdates.toLocaleString(),
      icon: ClockIcon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-500/20'
    },
    {
      id: 'api-status',
      name: 'API Status',
      value: 'Live',
      icon: GlobeAltIcon,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
      borderColor: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className={`relative overflow-hidden rounded-lg border ${stat.borderColor} ${stat.bgColor} px-4 py-5 sm:p-6`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-semibold text-white">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}