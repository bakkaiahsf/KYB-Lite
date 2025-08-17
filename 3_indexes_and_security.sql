-- ============================================================================
-- NEXUS AI - INDEXES, SECURITY & FUNCTIONS (Execute this third)
-- ============================================================================

-- Create indexes for performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_number ON companies(company_number);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_persons_name ON persons(full_name);
CREATE INDEX idx_persons_normalized_name ON persons(normalized_name);
CREATE INDEX idx_officers_company_id ON company_officers(company_id);
CREATE INDEX idx_officers_person_id ON company_officers(person_id);
CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access for company data)
CREATE POLICY "Companies are publicly readable" ON companies FOR SELECT USING (true);
CREATE POLICY "Persons are publicly readable" ON persons FOR SELECT USING (true);
CREATE POLICY "Officers are publicly readable" ON company_officers FOR SELECT USING (true);
CREATE POLICY "Relationships are publicly readable" ON company_relationships FOR SELECT USING (true);
CREATE POLICY "Sanctions lists are publicly readable" ON sanctions_lists FOR SELECT USING (true);
CREATE POLICY "Sanctions entries are publicly readable" ON sanctions_entries FOR SELECT USING (true);
CREATE POLICY "Users can view own search queries" ON search_queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own search queries" ON search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create search function
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

-- Success message
SELECT 'Indexes, security, and functions created successfully!' as status;