-- ============================================================================
-- NEXUS AI DATABASE MIGRATION - MANUAL APPLICATION
-- ============================================================================
-- This script contains all necessary migrations for the Nexus AI platform
-- Apply this script manually in your Supabase SQL editor
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK IF MIGRATIONS ALREADY APPLIED
-- ============================================================================
-- First check if our tables exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'companies'
) as companies_table_exists;

-- ============================================================================
-- STEP 2: NEXUS AI COMPANY INTELLIGENCE SCHEMA
-- ============================================================================
-- Only apply if companies table doesn't exist

-- Create enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_status') THEN
        CREATE TYPE company_status AS ENUM (
            'active',
            'dissolved',
            'liquidation',
            'dormant',
            'suspended',
            'strike_off',
            'unknown'
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type') THEN
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
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'person_role') THEN
        CREATE TYPE person_role AS ENUM (
            'director',
            'secretary',
            'person_of_significant_control',
            'shareholder',
            'trustee',
            'other'
        );
    END IF;
END $$;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
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
    lei text,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    date_of_birth date,
    nationality text,
    address text,
    postal_code text,
    normalized_name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create company_officers table
CREATE TABLE IF NOT EXISTS company_officers (
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

-- Create company_relationships table
CREATE TABLE IF NOT EXISTS company_relationships (
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

-- Create sanctions_lists table
CREATE TABLE IF NOT EXISTS sanctions_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    list_name text NOT NULL UNIQUE,
    source_url text,
    last_updated timestamp with time zone,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sanctions_entries table
CREATE TABLE IF NOT EXISTS sanctions_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id uuid NOT NULL REFERENCES sanctions_lists(id) ON DELETE CASCADE,
    entity_name text NOT NULL,
    entity_type text,
    aliases text[],
    addresses text[],
    date_of_birth date,
    nationality text,
    reference_number text,
    sanctions_type text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create search_queries table
CREATE TABLE IF NOT EXISTS search_queries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    query_text text NOT NULL,
    query_type text DEFAULT 'company_name',
    results_count integer DEFAULT 0,
    execution_time_ms integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_number ON companies(company_number);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_jurisdiction ON companies(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies(updated_at);

-- Persons indexes
CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(full_name);
CREATE INDEX IF NOT EXISTS idx_persons_normalized_name ON persons(normalized_name);
CREATE INDEX IF NOT EXISTS idx_persons_dob ON persons(date_of_birth);

-- Officers indexes
CREATE INDEX IF NOT EXISTS idx_officers_company_id ON company_officers(company_id);
CREATE INDEX IF NOT EXISTS idx_officers_person_id ON company_officers(person_id);
CREATE INDEX IF NOT EXISTS idx_officers_role ON company_officers(role);

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_relationships_from_company ON company_relationships(from_company_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to_company ON company_relationships(to_company_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON company_relationships(relationship_type);

-- Sanctions indexes
CREATE INDEX IF NOT EXISTS idx_sanctions_entity_name ON sanctions_entries(entity_name);
CREATE INDEX IF NOT EXISTS idx_sanctions_list_id ON sanctions_entries(list_id);

-- Search queries indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies are publicly readable" ON companies;
DROP POLICY IF EXISTS "Persons are publicly readable" ON persons;
DROP POLICY IF EXISTS "Officers are publicly readable" ON company_officers;
DROP POLICY IF EXISTS "Relationships are publicly readable" ON company_relationships;
DROP POLICY IF EXISTS "Sanctions lists are publicly readable" ON sanctions_lists;
DROP POLICY IF EXISTS "Sanctions entries are publicly readable" ON sanctions_entries;
DROP POLICY IF EXISTS "Users can view own search queries" ON search_queries;
DROP POLICY IF EXISTS "Users can insert own search queries" ON search_queries;

-- Create new policies
CREATE POLICY "Companies are publicly readable" ON companies
    FOR SELECT USING (true);

CREATE POLICY "Persons are publicly readable" ON persons
    FOR SELECT USING (true);

CREATE POLICY "Officers are publicly readable" ON company_officers
    FOR SELECT USING (true);

CREATE POLICY "Relationships are publicly readable" ON company_relationships
    FOR SELECT USING (true);

CREATE POLICY "Sanctions lists are publicly readable" ON sanctions_lists
    FOR SELECT USING (true);

CREATE POLICY "Sanctions entries are publicly readable" ON sanctions_entries
    FOR SELECT USING (true);

CREATE POLICY "Users can view own search queries" ON search_queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search queries" ON search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS
-- ============================================================================

-- Function to search companies by name
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
-- STEP 7: CREATE TRIGGERS FOR UPDATED_AT
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
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_persons_updated_at ON persons;
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_officers_updated_at ON company_officers;
CREATE TRIGGER update_company_officers_updated_at BEFORE UPDATE ON company_officers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_relationships_updated_at ON company_relationships;
CREATE TRIGGER update_company_relationships_updated_at BEFORE UPDATE ON company_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sanctions_entries_updated_at ON sanctions_entries;
CREATE TRIGGER update_sanctions_entries_updated_at BEFORE UPDATE ON sanctions_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: SEED BASIC DATA
-- ============================================================================

-- Insert basic sanctions lists
INSERT INTO sanctions_lists (list_name, source_url, active) VALUES
('UK_OFSI', 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets', true),
('UN_SANCTIONS', 'https://www.un.org/securitycouncil/sanctions/information', true),
('EU_SANCTIONS', 'https://ec.europa.eu/info/business-economy-euro/banking-and-finance/international-relations/restrictive-measures-sanctions_en', true),
('US_OFAC', 'https://www.treasury.gov/ofac', true)
ON CONFLICT (list_name) DO NOTHING;

-- Insert sample companies for testing
INSERT INTO companies (
  company_number, name, status, company_type, 
  incorporation_date, jurisdiction, registered_address, sic_codes
) VALUES 
  ('12345678', 'TechCorp Limited', 'active', 'private_limited', '2020-01-15', 'GB', '123 Innovation Drive, London, SW1A 1AA', ARRAY['62020', '62090']),
  ('87654321', 'DataFlow Solutions Ltd', 'active', 'private_limited', '2019-06-20', 'GB', '456 Data Street, Manchester, M1 1AA', ARRAY['62012', '63110']),
  ('11223344', 'Green Energy Partners', 'active', 'private_limited', '2021-03-10', 'GB', '789 Renewable Way, Edinburgh, EH1 1AA', ARRAY['35110', '35230']),
  ('44332211', 'Dissolved Company Ltd', 'dissolved', 'private_limited', '2018-12-01', 'GB', '999 Gone Street, Birmingham, B1 1AA', ARRAY['70100'])
ON CONFLICT (company_number) DO NOTHING;

-- Insert sample persons
INSERT INTO persons (
  full_name, nationality, address, normalized_name
) VALUES
  ('John Smith', 'British', '10 Downing Street, London, SW1A 2AA', 'john smith'),
  ('Sarah Johnson', 'British', '25 Kings Road, London, SW3 4RP', 'sarah johnson'),
  ('Michael Brown', 'British', '42 Technology Avenue, Manchester, M2 3BB', 'michael brown'),
  ('Emily Davis', 'British', '15 Green Lane, Edinburgh, EH2 4QQ', 'emily davis'),
  ('David Wilson', 'British', '88 Business Park, Birmingham, B2 5TT', 'david wilson')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 9: VERIFICATION
-- ============================================================================

-- Verify tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('companies', 'persons', 'company_officers', 'company_relationships', 'sanctions_lists', 'sanctions_entries', 'search_queries')
ORDER BY table_name;

-- Verify functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('search_companies', 'get_company_profile')
ORDER BY routine_name;

-- Test the search function
SELECT * FROM search_companies('Tech', 5);

-- Show sample data count
SELECT 
    'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL
SELECT 
    'persons' as table_name, COUNT(*) as record_count FROM persons
UNION ALL
SELECT 
    'sanctions_lists' as table_name, COUNT(*) as record_count FROM sanctions_lists;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Nexus AI database schema migration completed successfully!';
    RAISE NOTICE 'Tables created: companies, persons, company_officers, company_relationships, sanctions_lists, sanctions_entries, search_queries';
    RAISE NOTICE 'Functions created: search_companies, get_company_profile';
    RAISE NOTICE 'Row Level Security enabled with public read access for company data';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;