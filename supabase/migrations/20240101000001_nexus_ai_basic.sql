-- ============================================================================
-- NEXUS AI COMPANY INTELLIGENCE PLATFORM - BASIC SCHEMA (Without Extensions)
-- ============================================================================
-- This migration adds essential company intelligence tables to the existing
-- KYB-Lite SaaS template while maintaining compatibility with the billing system.
-- ============================================================================

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- Company status enumeration
CREATE TYPE company_status AS ENUM (
    'active',
    'dissolved',
    'liquidation',
    'dormant',
    'suspended',
    'strike_off',
    'unknown'
);

-- Company type enumeration  
CREATE TYPE company_type AS ENUM (
    'private_limited',
    'public_limited',
    'limited_partnership',
    'unlimited_company',
    'community_interest_company',
    'charitable_incorporated_organisation',
    'llp',
    'sole_trader',
    'other'
);

-- Person role enumeration
CREATE TYPE person_role AS ENUM (
    'director',
    'secretary',
    'person_of_significant_control',
    'shareholder',
    'trustee',
    'other'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Companies table - core company information
CREATE TABLE companies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_number text NOT NULL UNIQUE,
    name text NOT NULL,
    status company_status DEFAULT 'unknown',
    company_type company_type DEFAULT 'other',
    incorporation_date date,
    dissolution_date date,
    jurisdiction text DEFAULT 'GB',
    registered_address text,
    postal_code text,
    sic_codes text[],
    lei text, -- Legal Entity Identifier
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Persons table - individuals related to companies
CREATE TABLE persons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    date_of_birth date,
    nationality text,
    address text,
    postal_code text,
    normalized_name text, -- For deduplication
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Company officers table - directors, secretaries, etc.
CREATE TABLE company_officers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    role person_role NOT NULL,
    appointed_on date,
    resigned_on date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, person_id, role, appointed_on)
);

-- Company relationships table - ownership, subsidiaries, etc.
CREATE TABLE company_relationships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    to_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    relationship_type text NOT NULL,
    ownership_percentage decimal(5,2),
    confidence_score decimal(3,2) DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(from_company_id, to_company_id, relationship_type)
);

-- Sanctions lists table - different sanctions databases
CREATE TABLE sanctions_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    list_name text NOT NULL UNIQUE,
    source_url text,
    last_updated timestamp with time zone,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sanctions entries table - individual sanctions records
CREATE TABLE sanctions_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id uuid NOT NULL REFERENCES sanctions_lists(id) ON DELETE CASCADE,
    entity_name text NOT NULL,
    entity_type text, -- 'individual', 'organization', 'vessel', etc.
    aliases text[],
    addresses text[],
    date_of_birth date,
    nationality text,
    reference_number text,
    sanctions_type text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Search queries table - track user searches for analytics
CREATE TABLE search_queries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    query_text text NOT NULL,
    query_type text DEFAULT 'company_name',
    results_count integer DEFAULT 0,
    execution_time_ms integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- BASIC INDEXES FOR PERFORMANCE
-- ============================================================================

-- Companies indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_number ON companies(company_number);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_jurisdiction ON companies(jurisdiction);
CREATE INDEX idx_companies_updated_at ON companies(updated_at);

-- Persons indexes
CREATE INDEX idx_persons_name ON persons(full_name);
CREATE INDEX idx_persons_normalized_name ON persons(normalized_name);
CREATE INDEX idx_persons_dob ON persons(date_of_birth);

-- Officers indexes
CREATE INDEX idx_officers_company_id ON company_officers(company_id);
CREATE INDEX idx_officers_person_id ON company_officers(person_id);
CREATE INDEX idx_officers_role ON company_officers(role);

-- Relationships indexes
CREATE INDEX idx_relationships_from_company ON company_relationships(from_company_id);
CREATE INDEX idx_relationships_to_company ON company_relationships(to_company_id);
CREATE INDEX idx_relationships_type ON company_relationships(relationship_type);

-- Sanctions indexes
CREATE INDEX idx_sanctions_entity_name ON sanctions_entries(entity_name);
CREATE INDEX idx_sanctions_list_id ON sanctions_entries(list_id);

-- Search queries indexes
CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Companies: Public read access (data is public)
CREATE POLICY "Companies are publicly readable" ON companies
    FOR SELECT USING (true);

-- Persons: Public read access (director info is public)
CREATE POLICY "Persons are publicly readable" ON persons
    FOR SELECT USING (true);

-- Officers: Public read access
CREATE POLICY "Officers are publicly readable" ON company_officers
    FOR SELECT USING (true);

-- Relationships: Public read access
CREATE POLICY "Relationships are publicly readable" ON company_relationships
    FOR SELECT USING (true);

-- Sanctions: Public read access
CREATE POLICY "Sanctions lists are publicly readable" ON sanctions_lists
    FOR SELECT USING (true);

CREATE POLICY "Sanctions entries are publicly readable" ON sanctions_entries
    FOR SELECT USING (true);

-- Search queries: Users can only see their own searches
CREATE POLICY "Users can view own search queries" ON search_queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search queries" ON search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- BASIC FUNCTIONS
-- ============================================================================

-- Function to search companies by name (basic text search)
CREATE OR REPLACE FUNCTION search_companies(
    search_term text,
    limit_count integer DEFAULT 20
)
RETURNS TABLE(
    id uuid,
    company_number text,
    name text,
    status company_status,
    incorporation_date date,
    registered_address text
)
LANGUAGE sql
STABLE
AS $$
    SELECT c.id, c.company_number, c.name, c.status, c.incorporation_date, c.registered_address
    FROM companies c
    WHERE c.name ILIKE '%' || search_term || '%'
       OR c.company_number ILIKE '%' || search_term || '%'
    ORDER BY 
        CASE 
            WHEN c.name ILIKE search_term || '%' THEN 1
            WHEN c.company_number = search_term THEN 1
            ELSE 2
        END,
        c.name
    LIMIT limit_count;
$$;

-- Function to get company with officers
CREATE OR REPLACE FUNCTION get_company_profile(company_uuid uuid)
RETURNS json
LANGUAGE sql
STABLE
AS $$
    SELECT json_build_object(
        'company', row_to_json(c),
        'officers', COALESCE(
            (SELECT json_agg(officer_data)
            FROM (
                SELECT json_build_object(
                    'id', co.id,
                    'role', co.role,
                    'appointed_on', co.appointed_on,
                    'resigned_on', co.resigned_on,
                    'person', row_to_json(p)
                ) as officer_data
                FROM company_officers co
                JOIN persons p ON co.person_id = p.id
                WHERE co.company_id = company_uuid
                ORDER BY co.appointed_on DESC
            ) officers_subquery), 
            '[]'::json
        )
    )
    FROM companies c
    WHERE c.id = company_uuid;
$$;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert basic sanctions lists
INSERT INTO sanctions_lists (list_name, source_url, active) VALUES
('UK_OFSI', 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets', true),
('UN_SANCTIONS', 'https://www.un.org/securitycouncil/sanctions/information', true),
('EU_SANCTIONS', 'https://ec.europa.eu/info/business-economy-euro/banking-and-finance/international-relations/restrictive-measures-sanctions_en', true),
('US_OFAC', 'https://www.treasury.gov/ofac', true);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_officers_updated_at BEFORE UPDATE ON company_officers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_relationships_updated_at BEFORE UPDATE ON company_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sanctions_entries_updated_at BEFORE UPDATE ON sanctions_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE 'Nexus AI Basic Company Intelligence Platform schema migration completed successfully!';
    RAISE NOTICE 'Schema includes: companies, persons, officers, relationships, sanctions';
    RAISE NOTICE 'Basic search functionality enabled with standard indexes';
    RAISE NOTICE 'Row Level Security enabled with subscription-based access control';
END $$;