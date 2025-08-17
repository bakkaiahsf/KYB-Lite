import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export interface CompanyRiskAnalysis {
  overallRiskScore: number; // 1-10 scale
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactor[];
  businessInsights: string[];
  recommendations: string[];
  keyHighlights: KeyHighlight[];
  relationshipRisks: RelationshipRisk[];
}

export interface RiskFactor {
  category: 'financial' | 'regulatory' | 'operational' | 'reputation' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  likelihood: number; // 1-10
}

export interface KeyHighlight {
  type: 'warning' | 'opportunity' | 'strength' | 'concern';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RelationshipRisk {
  relatedEntity: string;
  relationshipType: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  concerns: string[];
}

export interface CompanyData {
  company_name: string;
  company_number: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  accounts?: {
    last_accounts?: {
      made_up_to?: string;
      type?: string;
    };
    next_due?: string;
  };
  sic_codes?: string[];
  officers?: Array<{
    name: string;
    role: string;
    appointed_on?: string;
    nationality?: string;
    country_of_residence?: string;
  }>;
  persons_with_significant_control?: Array<{
    name: string;
    kind: string;
    natures_of_control?: string[];
    nationality?: string;
  }>;
  registered_office_address?: {
    address_line_1?: string;
    locality?: string;
    postal_code?: string;
    country?: string;
  };
}

export class AIAnalysisService {
  private static instance: AIAnalysisService;

  static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  async analyzeCompanyRisk(companyData: CompanyData): Promise<CompanyRiskAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(companyData);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert financial analyst and due diligence specialist. 
            Analyze company data and provide comprehensive risk assessment with specific focus on:
            - Financial stability and compliance
            - Regulatory risks and filing status
            - Business relationships and ownership structure
            - Operational and reputational risks
            
            Respond with a valid JSON object matching the CompanyRiskAnalysis interface.
            Be specific, actionable, and highlight key red flags or opportunities.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const analysisResult = completion.choices[0]?.message?.content;
      if (!analysisResult) {
        throw new Error('No analysis result from OpenAI');
      }

      // Parse and validate the JSON response
      const analysis: CompanyRiskAnalysis = JSON.parse(analysisResult);
      return this.validateAndEnhanceAnalysis(analysis, companyData);

    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getFallbackAnalysis(companyData);
    }
  }

  private buildAnalysisPrompt(companyData: CompanyData): string {
    return `
Analyze the following UK company data for business risk assessment:

COMPANY DETAILS:
- Name: ${companyData.company_name}
- Number: ${companyData.company_number}
- Status: ${companyData.company_status}
- Type: ${companyData.company_type}
- Incorporated: ${companyData.date_of_creation}
- SIC Codes: ${companyData.sic_codes?.join(', ') || 'Not specified'}

FINANCIAL INFORMATION:
- Last Accounts: ${companyData.accounts?.last_accounts?.made_up_to || 'Not available'}
- Next Due: ${companyData.accounts?.next_due || 'Not available'}
- Accounts Type: ${companyData.accounts?.last_accounts?.type || 'Not specified'}

OFFICERS (${companyData.officers?.length || 0}):
${companyData.officers?.map(officer => 
  `- ${officer.name} (${officer.role}) - Appointed: ${officer.appointed_on || 'Unknown'}, Nationality: ${officer.nationality || 'Unknown'}`
).join('\n') || 'No officers data available'}

PERSONS WITH SIGNIFICANT CONTROL (${companyData.persons_with_significant_control?.length || 0}):
${companyData.persons_with_significant_control?.map(psc => 
  `- ${psc.name} (${psc.kind}) - Controls: ${psc.natures_of_control?.join(', ') || 'Unspecified'}`
).join('\n') || 'No PSC data available'}

REGISTERED ADDRESS:
${companyData.registered_office_address ? 
  `${companyData.registered_office_address.address_line_1 || ''}, ${companyData.registered_office_address.locality || ''}, ${companyData.registered_office_address.postal_code || ''}, ${companyData.registered_office_address.country || ''}` 
  : 'Not available'}

Please provide a comprehensive risk analysis focusing on due diligence red flags, compliance issues, and business relationship risks.
`;
  }

  private validateAndEnhanceAnalysis(analysis: CompanyRiskAnalysis, companyData: CompanyData): CompanyRiskAnalysis {
    // Ensure risk score is within valid range
    analysis.overallRiskScore = Math.max(1, Math.min(10, analysis.overallRiskScore));
    
    // Ensure risk level matches score
    if (analysis.overallRiskScore >= 8) analysis.riskLevel = 'CRITICAL';
    else if (analysis.overallRiskScore >= 6) analysis.riskLevel = 'HIGH';
    else if (analysis.overallRiskScore >= 4) analysis.riskLevel = 'MEDIUM';
    else analysis.riskLevel = 'LOW';

    // Add automatic risk factors based on company data
    const autoRiskFactors = this.generateAutoRiskFactors(companyData);
    analysis.riskFactors = [...(analysis.riskFactors || []), ...autoRiskFactors];

    return analysis;
  }

  private generateAutoRiskFactors(companyData: CompanyData): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Check company status
    if (companyData.company_status !== 'active') {
      factors.push({
        category: 'regulatory',
        severity: 'high',
        description: `Company status is ${companyData.company_status}`,
        impact: 'Business may not be actively trading or may be in process of dissolution',
        likelihood: 9
      });
    }

    // Check accounts filing
    if (companyData.accounts?.next_due) {
      const nextDue = new Date(companyData.accounts.next_due);
      const now = new Date();
      const daysOverdue = Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 0) {
        factors.push({
          category: 'compliance',
          severity: daysOverdue > 30 ? 'high' : 'medium',
          description: `Accounts filing is ${daysOverdue} days overdue`,
          impact: 'Potential regulatory penalties and compliance issues',
          likelihood: 8
        });
      }
    }

    // Check for officers
    if (!companyData.officers || companyData.officers.length === 0) {
      factors.push({
        category: 'regulatory',
        severity: 'medium',
        description: 'No officers information available',
        impact: 'Limited transparency about company management',
        likelihood: 6
      });
    }

    return factors;
  }

  private getFallbackAnalysis(companyData: CompanyData): CompanyRiskAnalysis {
    return {
      overallRiskScore: 5,
      riskLevel: 'MEDIUM',
      riskFactors: [
        {
          category: 'operational',
          severity: 'medium',
          description: 'AI analysis temporarily unavailable',
          impact: 'Manual review recommended for comprehensive risk assessment',
          likelihood: 5
        }
      ],
      businessInsights: [
        'AI analysis service is currently unavailable',
        'Please verify company details manually',
        'Consider checking latest filing information'
      ],
      recommendations: [
        'Perform manual due diligence review',
        'Check recent company filings',
        'Verify current business operations'
      ],
      keyHighlights: [
        {
          type: 'concern',
          title: 'Limited Analysis Available',
          description: 'AI risk analysis could not be completed',
          priority: 'medium'
        }
      ],
      relationshipRisks: []
    };
  }
}

export const aiAnalysisService = AIAnalysisService.getInstance();