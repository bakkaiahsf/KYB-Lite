-- ============================================================================
-- NEXUS AI BASIC SEED DATA
-- ============================================================================
-- Basic sample data for testing the Nexus AI company intelligence platform
-- ============================================================================

-- Insert sample companies
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

-- Insert sample company officers
INSERT INTO company_officers (
  company_id, person_id, role, appointed_on
)
SELECT 
  c.id, p.id, 'director', '2020-01-15'
FROM companies c, persons p
WHERE c.company_number = '12345678' AND p.full_name = 'John Smith'
ON CONFLICT DO NOTHING;

INSERT INTO company_officers (
  company_id, person_id, role, appointed_on
)
SELECT 
  c.id, p.id, 'secretary', '2020-01-15'
FROM companies c, persons p
WHERE c.company_number = '12345678' AND p.full_name = 'Sarah Johnson'
ON CONFLICT DO NOTHING;

INSERT INTO company_officers (
  company_id, person_id, role, appointed_on
)
SELECT 
  c.id, p.id, 'director', '2019-06-20'
FROM companies c, persons p
WHERE c.company_number = '87654321' AND p.full_name = 'Michael Brown'
ON CONFLICT DO NOTHING;

-- Insert sample company relationships
INSERT INTO company_relationships (
  from_company_id, to_company_id, relationship_type, ownership_percentage, confidence_score
)
SELECT 
  c1.id, c2.id, 'subsidiary', 75.0, 1.0
FROM companies c1, companies c2
WHERE c1.company_number = '12345678' AND c2.company_number = '87654321'
ON CONFLICT DO NOTHING;

-- Sample search queries (for analytics)
INSERT INTO search_queries (
  query_text, query_type, results_count, execution_time_ms
) VALUES
  ('TechCorp', 'company_name', 1, 150),
  ('DataFlow', 'company_name', 1, 120),
  ('12345678', 'company_number', 1, 85),
  ('Green Energy', 'company_name', 1, 200)
ON CONFLICT DO NOTHING;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Basic seed data inserted successfully!';
    RAISE NOTICE 'Sample companies: TechCorp Limited, DataFlow Solutions Ltd, Green Energy Partners';
    RAISE NOTICE 'Sample officers and relationships created';
END $$;