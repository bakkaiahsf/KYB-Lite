'use client';

import { 
  BuildingOfficeIcon, 
  CalendarIcon, 
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BanknotesIcon 
} from '@heroicons/react/24/outline';

interface CompanyData {
  company_name: string;
  company_number: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  officers?: any[];
  persons_with_significant_control?: any[];
  accounts?: any;
  sic_codes?: string[];
  registered_office_address?: any;
}

interface CompanyOverviewProps {
  company: CompanyData;
}

export default function CompanyOverview({ company }: CompanyOverviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-900/20 text-green-200 border-green-500/20';
      case 'dissolved':
        return 'bg-red-900/20 text-red-200 border-red-500/20';
      case 'liquidation':
        return 'bg-yellow-900/20 text-yellow-200 border-yellow-500/20';
      default:
        return 'bg-gray-900/20 text-gray-200 border-gray-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Basic Information */}
      <div className="lg:col-span-2 space-y-6">
        {/* Company Details Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BuildingOfficeIcon className="h-6 w-6 mr-2 text-blue-400" />
            Company Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Company Name</label>
              <p className="text-white font-medium">{company.company_name}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Company Number</label>
              <p className="text-white font-medium">#{company.company_number}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(company.company_status)}`}>
                {company.company_status.toUpperCase()}
              </span>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Company Type</label>
              <p className="text-white font-medium">{company.company_type}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Incorporated</label>
              <p className="text-white font-medium flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                {formatDate(company.date_of_creation)}
              </p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Age</label>
              <p className="text-white font-medium">
                {Math.floor((Date.now() - new Date(company.date_of_creation).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
              </p>
            </div>
          </div>
        </div>

        {/* Registered Address */}
        {company.registered_office_address && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <MapPinIcon className="h-6 w-6 mr-2 text-blue-400" />
              Registered Office Address
            </h2>
            
            <div className="text-gray-300">
              {company.registered_office_address.address_line_1 && (
                <p>{company.registered_office_address.address_line_1}</p>
              )}
              {company.registered_office_address.address_line_2 && (
                <p>{company.registered_office_address.address_line_2}</p>
              )}
              {company.registered_office_address.locality && (
                <p>{company.registered_office_address.locality}</p>
              )}
              {company.registered_office_address.postal_code && (
                <p>{company.registered_office_address.postal_code}</p>
              )}
              {company.registered_office_address.country && (
                <p>{company.registered_office_address.country}</p>
              )}
            </div>
          </div>
        )}

        {/* SIC Codes */}
        {company.sic_codes && company.sic_codes.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-400" />
              Standard Industrial Classification (SIC)
            </h2>
            
            <div className="space-y-2">
              {company.sic_codes.map((code, index) => (
                <div key={index} className="bg-gray-900/50 rounded p-3">
                  <span className="text-blue-400 font-mono">{code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Officers
              </span>
              <span className="text-white font-medium">
                {company.officers?.length || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                PSCs
              </span>
              <span className="text-white font-medium">
                {company.persons_with_significant_control?.length || 0}
              </span>
            </div>
            
            {company.accounts?.last_accounts?.made_up_to && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center">
                  <BanknotesIcon className="h-4 w-4 mr-2" />
                  Last Accounts
                </span>
                <span className="text-white font-medium text-sm">
                  {formatDate(company.accounts.last_accounts.made_up_to)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Officers */}
        {company.officers && company.officers.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-blue-400" />
              Officers ({company.officers.length})
            </h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {company.officers.slice(0, 10).map((officer, index) => (
                <div key={index} className="bg-gray-900/50 rounded p-3">
                  <p className="text-white font-medium">{officer.name}</p>
                  <p className="text-sm text-gray-400">{officer.role}</p>
                  {officer.appointed_on && (
                    <p className="text-xs text-gray-500">
                      Appointed: {formatDate(officer.appointed_on)}
                    </p>
                  )}
                </div>
              ))}
              {company.officers.length > 10 && (
                <p className="text-sm text-gray-400 text-center">
                  +{company.officers.length - 10} more officers
                </p>
              )}
            </div>
          </div>
        )}

        {/* PSCs */}
        {company.persons_with_significant_control && company.persons_with_significant_control.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Persons with Significant Control
            </h2>
            
            <div className="space-y-3">
              {company.persons_with_significant_control.map((psc, index) => (
                <div key={index} className="bg-gray-900/50 rounded p-3">
                  <p className="text-white font-medium">{psc.name}</p>
                  <p className="text-sm text-gray-400">{psc.kind}</p>
                  {psc.natures_of_control && (
                    <div className="mt-2">
                      {psc.natures_of_control.map((nature: string, i: number) => (
                        <span key={i} className="inline-block bg-blue-900/20 text-blue-200 text-xs px-2 py-1 rounded mr-1 mb-1">
                          {nature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}