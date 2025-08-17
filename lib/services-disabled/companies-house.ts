/**
 * Companies House API Service
 * 
 * Provides integration with the UK Companies House API for fetching
 * company information, officers, and PSC data with proper rate limiting
 * and error handling.
 * 
 * Rate Limits: 600 requests per 5 minutes per API key
 * Base URL: https://api.company-information.service.gov.uk
 */

import { z } from 'zod';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

// Companies House API response schemas
const CompaniesHouseAddressSchema = z.object({
  premises: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  locality: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

const CompaniesHouseCompanySchema = z.object({
  company_number: z.string(),
  company_name: z.string(),
  company_status: z.string(),
  company_type: z.string().optional(),
  date_of_creation: z.string().optional(),
  date_of_dissolution: z.string().optional(),
  registered_office_address: CompaniesHouseAddressSchema.optional(),
  sic_codes: z.array(z.string()).optional(),
  jurisdiction: z.string().optional(),
});

const CompaniesHouseOfficerSchema = z.object({
  name: z.string(),
  officer_role: z.string(),
  appointed_on: z.string().optional(),
  resigned_on: z.string().optional(),
  date_of_birth: z.object({
    month: z.number().optional(),
    year: z.number().optional(),
  }).optional(),
  nationality: z.string().optional(),
  address: CompaniesHouseAddressSchema.optional(),
});

const CompaniesHousePSCSchema = z.object({
  name: z.string().optional(),
  name_elements: z.object({
    forename: z.string().optional(),
    surname: z.string().optional(),
  }).optional(),
  kind: z.string(),
  natures_of_control: z.array(z.string()).optional(),
  notified_on: z.string().optional(),
  ceased_on: z.string().optional(),
  date_of_birth: z.object({
    month: z.number().optional(),
    year: z.number().optional(),
  }).optional(),
  nationality: z.string().optional(),
  address: CompaniesHouseAddressSchema.optional(),
});

const CompaniesHouseSearchResultSchema = z.object({
  company_number: z.string(),
  title: z.string(),
  company_status: z.string(),
  company_type: z.string().optional(),
  address_snippet: z.string().optional(),
  date_of_creation: z.string().optional(),
});

// Exported types
export type CompaniesHouseCompany = z.infer<typeof CompaniesHouseCompanySchema>;
export type CompaniesHouseOfficer = z.infer<typeof CompaniesHouseOfficerSchema>;
export type CompaniesHousePSC = z.infer<typeof CompaniesHousePSCSchema>;
export type CompaniesHouseSearchResult = z.infer<typeof CompaniesHouseSearchResultSchema>;

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number = 600,
    private windowMs: number = 5 * 60 * 1000 // 5 minutes
  ) {}
  
  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Remove requests outside the current window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we've hit the rate limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 1000; // Add 1s buffer
      
      if (waitTime > 0) {
        console.warn(`Rate limit approached. Waiting ${waitTime}ms before next request.`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.acquire(); // Recursive call after waiting
      }
    }
    
    // Record this request
    this.requests.push(now);
  }
  
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// ============================================================================
// COMPANIES HOUSE SERVICE
// ============================================================================

export class CompaniesHouseService {
  private baseUrl = 'https://api.company-information.service.gov.uk';
  private rateLimiter: RateLimiter;
  
  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('Companies House API key is required');
    }
    this.rateLimiter = new RateLimiter();
  }
  
  // ============================================================================
  // SEARCH METHODS
  // ============================================================================
  
  /**
   * Search for companies by name or number
   */
  async searchCompanies(
    query: string,
    itemsPerPage: number = 20,
    startIndex: number = 0
  ): Promise<CompaniesHouseSearchResult[]> {
    await this.rateLimiter.acquire();
    
    const url = new URL(`${this.baseUrl}/search/companies`);
    url.searchParams.set('q', query);
    url.searchParams.set('items_per_page', itemsPerPage.toString());
    url.searchParams.set('start_index', startIndex.toString());
    
    try {
      const response = await this.makeRequest(url.toString());
      const data = await response.json();
      
      if (!data.items) {
        return [];
      }
      
      return data.items.map((item: any) => CompaniesHouseSearchResultSchema.parse(item));
    } catch (error) {
      console.error('Companies House search error:', error);
      throw new CompaniesHouseError('Failed to search companies', 500);
    }
  }
  
  // ============================================================================
  // COMPANY DATA METHODS
  // ============================================================================
  
  /**
   * Get detailed company information
   */
  async getCompany(companyNumber: string): Promise<CompaniesHouseCompany> {
    await this.rateLimiter.acquire();
    
    const cleanCompanyNumber = this.cleanCompanyNumber(companyNumber);
    const url = `${this.baseUrl}/company/${cleanCompanyNumber}`;
    
    try {
      const response = await this.makeRequest(url);
      
      if (response.status === 404) {
        throw new CompaniesHouseError('Company not found', 404);
      }
      
      const data = await response.json();
      return CompaniesHouseCompanySchema.parse(data);
    } catch (error) {
      if (error instanceof CompaniesHouseError) {
        throw error;
      }
      console.error('Companies House get company error:', error);
      throw new CompaniesHouseError('Failed to fetch company data', 500);
    }
  }
  
  /**
   * Get company officers
   */
  async getOfficers(
    companyNumber: string,
    itemsPerPage: number = 35,
    startIndex: number = 0
  ): Promise<CompaniesHouseOfficer[]> {
    await this.rateLimiter.acquire();
    
    const cleanCompanyNumber = this.cleanCompanyNumber(companyNumber);
    const url = new URL(`${this.baseUrl}/company/${cleanCompanyNumber}/officers`);
    url.searchParams.set('items_per_page', itemsPerPage.toString());
    url.searchParams.set('start_index', startIndex.toString());
    
    try {
      const response = await this.makeRequest(url.toString());
      
      if (response.status === 404) {
        return []; // No officers found
      }
      
      const data = await response.json();
      
      if (!data.items) {
        return [];
      }
      
      return data.items.map((item: any) => CompaniesHouseOfficerSchema.parse(item));
    } catch (error) {
      console.error('Companies House get officers error:', error);
      throw new CompaniesHouseError('Failed to fetch officers data', 500);
    }
  }
  
  /**
   * Get Persons with Significant Control (PSCs)
   */
  async getPSCs(
    companyNumber: string,
    itemsPerPage: number = 25,
    startIndex: number = 0
  ): Promise<CompaniesHousePSC[]> {
    await this.rateLimiter.acquire();
    
    const cleanCompanyNumber = this.cleanCompanyNumber(companyNumber);
    const url = new URL(`${this.baseUrl}/company/${cleanCompanyNumber}/persons-with-significant-control`);
    url.searchParams.set('items_per_page', itemsPerPage.toString());
    url.searchParams.set('start_index', startIndex.toString());
    
    try {
      const response = await this.makeRequest(url.toString());
      
      if (response.status === 404) {
        return []; // No PSCs found
      }
      
      const data = await response.json();
      
      if (!data.items) {
        return [];
      }
      
      return data.items.map((item: any) => CompaniesHousePSCSchema.parse(item));
    } catch (error) {
      console.error('Companies House get PSCs error:', error);
      throw new CompaniesHouseError('Failed to fetch PSCs data', 500);
    }
  }
  
  /**
   * Get complete company profile (company + officers + PSCs)
   */
  async getCompleteProfile(companyNumber: string) {
    const [company, officers, pscs] = await Promise.allSettled([
      this.getCompany(companyNumber),
      this.getOfficers(companyNumber),
      this.getPSCs(companyNumber),
    ]);
    
    return {
      company: company.status === 'fulfilled' ? company.value : null,
      officers: officers.status === 'fulfilled' ? officers.value : [],
      pscs: pscs.status === 'fulfilled' ? pscs.value : [],
      errors: {
        company: company.status === 'rejected' ? company.reason.message : null,
        officers: officers.status === 'rejected' ? officers.reason.message : null,
        pscs: pscs.status === 'rejected' ? pscs.reason.message : null,
      },
    };
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  /**
   * Get rate limiter status
   */
  getRateLimitStatus() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      limit: 600,
      windowMs: 5 * 60 * 1000,
    };
  }
  
  /**
   * Clean and format company number
   */
  private cleanCompanyNumber(companyNumber: string): string {
    return companyNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  
  /**
   * Format address object to string
   */
  static formatAddress(address: z.infer<typeof CompaniesHouseAddressSchema>): string {
    if (!address) return '';
    
    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  }
  
  /**
   * Extract person name from Companies House format
   */
  static extractPersonName(item: CompaniesHouseOfficer | CompaniesHousePSC): string {
    if ('name' in item && item.name) {
      return item.name;
    }
    
    if ('name_elements' in item && item.name_elements) {
      const { forename, surname } = item.name_elements;
      return [forename, surname].filter(Boolean).join(' ');
    }
    
    return 'Unknown';
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  /**
   * Make authenticated request to Companies House API
   */
  private async makeRequest(url: string): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        'Accept': 'application/json',
        'User-Agent': 'Nexus-AI-Company-Intelligence/1.0',
      },
    });
    
    // Log rate limit headers if available
    const remaining = response.headers.get('X-Ratelimit-Remaining');
    const limit = response.headers.get('X-Ratelimit-Limit');
    
    if (remaining && limit) {
      console.log(`Rate limit: ${remaining}/${limit} remaining`);
    }
    
    return response;
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class CompaniesHouseError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'CompaniesHouseError';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Companies House service instance with API key from environment
 */
export function createCompaniesHouseService(): CompaniesHouseService {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'COMPANIES_HOUSE_API_KEY environment variable is required. ' +
      'Get your API key from https://developer.company-information.service.gov.uk/'
    );
  }
  
  return new CompaniesHouseService(apiKey);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate UK company number format
 */
export function isValidCompanyNumber(companyNumber: string): boolean {
  // UK company numbers are typically 8 characters (numbers or letters)
  // Some older companies may have fewer characters
  const cleaned = companyNumber.replace(/[^A-Z0-9]/gi, '');
  return cleaned.length >= 2 && cleaned.length <= 8;
}

/**
 * Normalize company number for searching
 */
export function normalizeCompanyNumber(companyNumber: string): string {
  const cleaned = companyNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Pad with leading zeros if numeric and less than 8 characters
  if (/^\d+$/.test(cleaned) && cleaned.length < 8) {
    return cleaned.padStart(8, '0');
  }
  
  return cleaned;
}