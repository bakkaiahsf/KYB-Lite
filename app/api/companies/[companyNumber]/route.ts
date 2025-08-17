import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    // For now, return mock data to get the build working
    const mockCompany = {
      company_name: "Example Company Ltd",
      company_number: companyNumber,
      company_status: "active",
      company_type: "ltd",
      date_of_creation: "2020-01-01",
      officers: [
        {
          name: "John Doe",
          role: "Director",
          appointed_on: "2020-01-01",
          nationality: "British"
        }
      ],
      persons_with_significant_control: [
        {
          name: "Jane Smith",
          kind: "individual-person-with-significant-control",
          natures_of_control: ["ownership-of-shares-25-to-50-percent"]
        }
      ],
      registered_office_address: {
        address_line_1: "123 Business Street",
        locality: "London",
        postal_code: "SW1A 1AA",
        country: "England"
      },
      sic_codes: ["62020", "62090"],
      accounts: {
        last_accounts: {
          made_up_to: "2023-12-31",
          type: "full"
        },
        next_due: "2024-12-31"
      }
    };

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      company: mockCompany,
      executionTime,
      source: 'mock',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Company API Error:', error);
    
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
        error: 'Company lookup failed',
        message: 'Could not fetch company information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}