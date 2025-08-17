-- ============================================================================
-- NEXUS AI - RELATIONSHIPS & SUPPORTING TABLES (Execute this second)
-- ============================================================================

-- Create company_officers table
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

-- Create company_relationships table
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

-- Create sanctions_lists table
CREATE TABLE sanctions_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    list_name text NOT NULL UNIQUE,
    source_url text,
    last_updated timestamp with time zone,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sanctions_entries table
CREATE TABLE sanctions_entries (
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
CREATE TABLE search_queries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    query_text text NOT NULL,
    query_type text DEFAULT 'company_name',
    results_count integer DEFAULT 0,
    execution_time_ms integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Success message
SELECT 'Relationship tables created successfully!' as status;