'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import CompanyOverview from '@/components/company/CompanyOverview';
import RiskAnalysisPanel from '@/components/company/RiskAnalysisPanel';
import RelationshipVisualization from '@/components/company/RelationshipVisualization';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  BuildingOfficeIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon 
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

interface AnalysisData {
  overallRiskScore: number;
  riskLevel: string;
  riskFactors: any[];
  businessInsights: string[];
  recommendations: string[];
  keyHighlights: any[];
  relationshipRisks: any[];
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyNumber = params?.companyNumber as string;
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (companyNumber) {
      fetchCompanyData();
    }
  }, [companyNumber]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch company data');
      }

      setCompany(data.company);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIAnalysis = async () => {
    if (!company) return;

    try {
      setAnalysisLoading(true);
      
      const response = await fetch(`/api/companies/${companyNumber}/analysis`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI analysis');
      }

      setAnalysis(data.analysis);
      setActiveTab('analysis');
    } catch (err) {
      console.error('AI Analysis Error:', err);
      // Set fallback analysis instead of showing error
      setAnalysis({
        overallRiskScore: 5,
        riskLevel: 'MEDIUM',
        riskFactors: [],
        businessInsights: ['AI analysis temporarily unavailable'],
        recommendations: ['Manual review recommended'],
        keyHighlights: [],
        relationshipRisks: []
      });
      setActiveTab('analysis');
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Company Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested company could not be loaded.'}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Company Overview', icon: BuildingOfficeIcon },
    { id: 'analysis', name: 'AI Risk Analysis', icon: ChartBarIcon },
    { id: 'relationships', name: 'Relationships', icon: InformationCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{company.company_name}</h1>
              <p className="text-gray-400 mt-1">
                #{company.company_number} • {company.company_status} • {company.company_type}
              </p>
            </div>
            <div className="flex space-x-3">
              {!analysis && (
                <button
                  onClick={fetchAIAnalysis}
                  disabled={analysisLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  <span>{analysisLoading ? 'Analyzing...' : 'AI Risk Analysis'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <CompanyOverview company={company} />
          )}
          
          {activeTab === 'analysis' && (
            <RiskAnalysisPanel 
              analysis={analysis} 
              loading={analysisLoading}
              onRefresh={fetchAIAnalysis}
            />
          )}
          
          {activeTab === 'relationships' && (
            <RelationshipVisualization 
              company={company}
              analysisData={analysis}
            />
          )}
        </div>
      </div>
    </div>
  );
}