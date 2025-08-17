'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

interface CompanyData {
  company_name: string;
  company_number: string;
  officers?: any[];
  persons_with_significant_control?: any[];
}

interface AnalysisData {
  relationshipRisks?: any[];
}

interface RelationshipVisualizationProps {
  company: CompanyData;
  analysisData: AnalysisData | null;
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'company' | 'officer' | 'psc';
  riskLevel?: 'low' | 'medium' | 'high';
  details?: any;
}

interface NetworkEdge {
  source: string;
  target: string;
  relationship: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export default function RelationshipVisualization({ company, analysisData }: RelationshipVisualizationProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [viewMode, setViewMode] = useState<'network' | 'list'>('network');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    generateNetworkData();
  }, [company, analysisData]);

  const generateNetworkData = () => {
    const networkNodes: NetworkNode[] = [];
    const networkEdges: NetworkEdge[] = [];

    // Add main company node
    networkNodes.push({
      id: company.company_number,
      name: company.company_name,
      type: 'company',
      riskLevel: getCompanyRiskLevel(),
      details: company
    });

    // Add officer nodes and edges
    company.officers?.forEach((officer, index) => {
      const officerId = `officer_${index}`;
      networkNodes.push({
        id: officerId,
        name: officer.name,
        type: 'officer',
        riskLevel: getOfficerRiskLevel(officer),
        details: officer
      });

      networkEdges.push({
        source: officerId,
        target: company.company_number,
        relationship: officer.role || 'Officer',
        riskLevel: getRelationshipRiskLevel(officer)
      });
    });

    // Add PSC nodes and edges
    company.persons_with_significant_control?.forEach((psc, index) => {
      const pscId = `psc_${index}`;
      networkNodes.push({
        id: pscId,
        name: psc.name,
        type: 'psc',
        riskLevel: getPSCRiskLevel(psc),
        details: psc
      });

      networkEdges.push({
        source: pscId,
        target: company.company_number,
        relationship: psc.kind || 'Significant Control',
        riskLevel: getRelationshipRiskLevel(psc)
      });
    });

    setNodes(networkNodes);
    setEdges(networkEdges);
  };

  const getCompanyRiskLevel = (): 'low' | 'medium' | 'high' => {
    // Check analysis data for company risk
    if (analysisData?.relationshipRisks?.length) {
      const highRiskCount = analysisData.relationshipRisks.filter(r => r.riskLevel === 'high').length;
      if (highRiskCount > 0) return 'high';
      const mediumRiskCount = analysisData.relationshipRisks.filter(r => r.riskLevel === 'medium').length;
      if (mediumRiskCount > 0) return 'medium';
    }
    return 'low';
  };

  const getOfficerRiskLevel = (officer: any): 'low' | 'medium' | 'high' => {
    // Simple risk assessment based on available data
    if (!officer.nationality || !officer.appointed_on) return 'medium';
    const appointmentAge = (Date.now() - new Date(officer.appointed_on).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (appointmentAge < 0.5) return 'medium'; // Recently appointed
    return 'low';
  };

  const getPSCRiskLevel = (psc: any): 'low' | 'medium' | 'high' => {
    // Check for high control levels
    if (psc.natures_of_control?.some((control: string) => 
      control.includes('ownership-of-shares-75-to-100') || 
      control.includes('voting-rights-75-to-100')
    )) {
      return 'high';
    }
    return 'low';
  };

  const getRelationshipRiskLevel = (entity: any): 'low' | 'medium' | 'high' => {
    return 'low'; // Default for now
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-500/20';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/20';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'company': return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'officer': return <UserGroupIcon className="h-5 w-5" />;
      case 'psc': return <ArrowsRightLeftIcon className="h-5 w-5" />;
      default: return <InformationCircleIcon className="h-5 w-5" />;
    }
  };

  const renderNetworkView = () => {
    const centerX = 300;
    const centerY = 200;
    const radius = 150;

    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Network Visualization</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('network')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'network' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Network
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              List
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4" style={{ height: '400px', overflow: 'hidden' }}>
          <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 600 400">
            {/* Edges */}
            {edges.map((edge, index) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;
              
              // Calculate positions (simplified circular layout)
              const sourceAngle = (index / (nodes.length - 1)) * 2 * Math.PI;
              const sourceX = centerX + Math.cos(sourceAngle) * radius;
              const sourceY = centerY + Math.sin(sourceAngle) * radius;
              
              return (
                <g key={`edge-${index}`}>
                  <line
                    x1={sourceX}
                    y1={sourceY}
                    x2={centerX}
                    y2={centerY}
                    stroke={edge.riskLevel === 'high' ? '#ef4444' : edge.riskLevel === 'medium' ? '#f59e0b' : '#10b981'}
                    strokeWidth="2"
                    strokeDasharray={edge.riskLevel === 'high' ? '5,5' : 'none'}
                  />
                  <text
                    x={(sourceX + centerX) / 2}
                    y={(sourceY + centerY) / 2}
                    fill="#9ca3af"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {edge.relationship}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node, index) => {
              const isCenter = node.type === 'company';
              const x = isCenter ? centerX : centerX + Math.cos((index / (nodes.length - 1)) * 2 * Math.PI) * radius;
              const y = isCenter ? centerY : centerY + Math.sin((index / (nodes.length - 1)) * 2 * Math.PI) * radius;
              
              return (
                <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isCenter ? 30 : 20}
                    fill={node.riskLevel === 'high' ? '#dc2626' : node.riskLevel === 'medium' ? '#d97706' : '#059669'}
                    stroke="#374151"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                  <text
                    x={x}
                    y={y + 4}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {node.name.length > 15 ? node.name.slice(0, 15) + '...' : node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-6">
        {/* Officers */}
        {company.officers && company.officers.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-blue-400" />
              Officers ({company.officers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.officers.map((officer, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getRiskColor(getOfficerRiskLevel(officer))}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{officer.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(getOfficerRiskLevel(officer))}`}>
                      {getOfficerRiskLevel(officer).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{officer.role}</p>
                  {officer.appointed_on && (
                    <p className="text-xs text-gray-500">
                      Appointed: {new Date(officer.appointed_on).toLocaleDateString()}
                    </p>
                  )}
                  {officer.nationality && (
                    <p className="text-xs text-gray-500">Nationality: {officer.nationality}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PSCs */}
        {company.persons_with_significant_control && company.persons_with_significant_control.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ArrowsRightLeftIcon className="h-5 w-5 mr-2 text-purple-400" />
              Persons with Significant Control ({company.persons_with_significant_control.length})
            </h3>
            <div className="space-y-4">
              {company.persons_with_significant_control.map((psc, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getRiskColor(getPSCRiskLevel(psc))}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{psc.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(getPSCRiskLevel(psc))}`}>
                      {getPSCRiskLevel(psc).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{psc.kind}</p>
                  {psc.natures_of_control && (
                    <div className="flex flex-wrap gap-1">
                      {psc.natures_of_control.map((control: string, i: number) => (
                        <span key={i} className="bg-purple-900/20 text-purple-200 text-xs px-2 py-1 rounded">
                          {control.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationship Risks from AI Analysis */}
        {analysisData?.relationshipRisks && analysisData.relationshipRisks.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-400" />
              AI-Identified Relationship Risks
            </h3>
            <div className="space-y-3">
              {analysisData.relationshipRisks.map((risk, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getRiskColor(risk.riskLevel)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{risk.relatedEntity}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{risk.relationshipType}</p>
                  <p className="text-sm text-gray-300">{risk.description}</p>
                  {risk.concerns && risk.concerns.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {risk.concerns.map((concern: string, i: number) => (
                        <span key={i} className="bg-red-900/20 text-red-200 text-xs px-2 py-1 rounded">
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
  };

  return (
    <div className="space-y-6">
      {viewMode === 'network' ? renderNetworkView() : renderListView()}
      
      {/* Selected Node Details */}
      {selectedNode && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            {getNodeIcon(selectedNode.type)}
            <span className="ml-2">Selected: {selectedNode.name}</span>
          </h3>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(selectedNode.details, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}