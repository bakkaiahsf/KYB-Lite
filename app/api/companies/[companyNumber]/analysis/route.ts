import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiAnalysisService } from '@/lib/services/ai-analysis';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  companyNumber: z.string().min(1, 'Company number is required'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { companyNumber: string } }
) {
  try {
    const startTime = Date.now();

    // Validate company number
    const validatedParams = ParamsSchema.parse(params);
    const { companyNumber } = validatedParams;

    // Get company data from the main companies API
    const baseUrl = request.nextUrl.origin;
    const companiesResponse = await fetch(`${baseUrl}/api/companies/${companyNumber}`, {
      headers: {
        'User-Agent': 'KYB-Lite-AI-Analysis/1.0'
      }
    });

    if (!companiesResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Company not found',
          message: 'Could not fetch company data for analysis'
        },
        { status: 404 }
      );
    }

    const companyData = await companiesResponse.json();
    
    if (!companyData.company) {
      return NextResponse.json(
        { 
          error: 'Company data unavailable',
          message: 'No company data available for analysis'
        },
        { status: 404 }
      );
    }

    // Perform AI analysis
    const analysis = await aiAnalysisService.analyzeCompanyRisk(companyData.company);

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      companyNumber,
      companyName: companyData.company.company_name,
      analysis,
      executionTime,
      timestamp: new Date().toISOString(),
      source: 'ai_analysis'
    });

  } catch (error) {
    console.error('AI Analysis API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          message: 'Invalid company number format',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: 'Could not complete AI risk analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companyNumber: string } }
) {
  try {
    const startTime = Date.now();
    
    // Validate company number
    const validatedParams = ParamsSchema.parse(params);
    const { companyNumber } = validatedParams;

    // Get custom company data from request body
    const customCompanyData = await request.json();

    // Perform AI analysis on custom data
    const analysis = await aiAnalysisService.analyzeCompanyRisk(customCompanyData);

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      companyNumber,
      companyName: customCompanyData.company_name,
      analysis,
      executionTime,
      timestamp: new Date().toISOString(),
      source: 'ai_analysis_custom'
    });

  } catch (error) {
    console.error('Custom AI Analysis API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: 'Could not complete custom AI risk analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}