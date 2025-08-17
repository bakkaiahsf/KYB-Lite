'use client';

import { 
  ExclamationTriangleIcon, 
  ShieldCheckIcon,
  LightBulbIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface RiskFactor {
  category: string;
  severity: string;
  description: string;
  impact: string;
  likelihood: number;
}

interface KeyHighlight {
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface AnalysisData {
  overallRiskScore: number;
  riskLevel: string;
  riskFactors: RiskFactor[];
  businessInsights: string[];
  recommendations: string[];
  keyHighlights: KeyHighlight[];
  relationshipRisks: any[];
}

interface RiskAnalysisPanelProps {
  analysis: AnalysisData | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function RiskAnalysisPanel({ analysis, loading, onRefresh }: RiskAnalysisPanelProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green-900/20 text-green-200 border-green-500/20';
      case 'medium':
        return 'bg-yellow-900/20 text-yellow-200 border-yellow-500/20';
      case 'high':
        return 'bg-orange-900/20 text-orange-200 border-orange-500/20';
      case 'critical':
        return 'bg-red-900/20 text-red-200 border-red-500/20';
      default:
        return 'bg-gray-900/20 text-gray-200 border-gray-500/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'medium':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />;
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHighlightIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'opportunity':
        return <LightBulbIcon className="h-5 w-5 text-green-400" />;
      case 'strength':
        return <ShieldCheckIcon className="h-5 w-5 text-blue-400" />;
      case 'concern':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Analyzing Company Risk</h3>
          <p className="text-gray-400">AI is processing company data and relationships...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
        <div className="text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI Risk Analysis</h3>
          <p className="text-gray-400 mb-4">Get comprehensive AI-powered risk assessment and business insights</p>
          <button
            onClick={onRefresh}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <ChartBarIcon className="h-5 w-5" />
            <span>Start AI Analysis</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-purple-400" />
            AI Risk Analysis
          </h2>
          <button
            onClick={onRefresh}
            className="text-gray-400 hover:text-white transition-colors"
            title="Refresh Analysis"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {analysis.overallRiskScore}/10
            </div>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getRiskLevelColor(analysis.riskLevel)}`}>
              {analysis.riskLevel} RISK
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  analysis.overallRiskScore >= 8 ? 'bg-red-500' :
                  analysis.overallRiskScore >= 6 ? 'bg-orange-500' :
                  analysis.overallRiskScore >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(analysis.overallRiskScore / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Highlights */}
      {analysis.keyHighlights && analysis.keyHighlights.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Key Highlights</h3>
          <div className="space-y-3">
            {analysis.keyHighlights.map((highlight, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4 flex items-start space-x-3">
                {getHighlightIcon(highlight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-white">{highlight.title}</h4>
                  <p className="text-gray-300 text-sm mt-1">{highlight.description}</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    highlight.priority === 'high' ? 'bg-red-900/20 text-red-200' :
                    highlight.priority === 'medium' ? 'bg-yellow-900/20 text-yellow-200' :
                    'bg-gray-900/20 text-gray-200'
                  }`}>
                    {highlight.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors */}
        {analysis.riskFactors && analysis.riskFactors.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-400" />
              Risk Factors ({analysis.riskFactors.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analysis.riskFactors.map((factor, index) => (
                <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(factor.severity)}
                      <span className="text-white font-medium capitalize">{factor.category}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Likelihood: {factor.likelihood}/10
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{factor.description}</p>
                  <p className="text-gray-400 text-xs">{factor.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Insights */}
        {analysis.businessInsights && analysis.businessInsights.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2 text-blue-400" />
              Business Insights
            </h3>
            <div className="space-y-2">
              {analysis.businessInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-400" />
            Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationship Risks */}
      {analysis.relationshipRisks && analysis.relationshipRisks.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Relationship Risks</h3>
          <div className="space-y-3">
            {analysis.relationshipRisks.map((risk, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{risk.relatedEntity}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    risk.riskLevel === 'high' ? 'bg-red-900/20 text-red-200' :
                    risk.riskLevel === 'medium' ? 'bg-yellow-900/20 text-yellow-200' :
                    'bg-green-900/20 text-green-200'
                  }`}>
                    {risk.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{risk.relationshipType}</p>
                <p className="text-gray-300 text-sm">{risk.description}</p>
                {risk.concerns && risk.concerns.length > 0 && (
                  <div className="mt-2">
                    {risk.concerns.map((concern: string, i: number) => (
                      <span key={i} className="inline-block bg-red-900/20 text-red-200 text-xs px-2 py-1 rounded mr-1 mb-1">
                        {concern}
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
  );
}