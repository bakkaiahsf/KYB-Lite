-- ============================================================================
-- NEXUS AI - SAMPLE DATA (Execute this fourth)
-- ============================================================================

-- Insert sample sanctions lists
INSERT INTO sanctions_lists (list_name, source_url, active) VALUES
('UK_OFSI', 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets', true),
('UN_SANCTIONS', 'https://www.un.org/securitycouncil/sanctions/information', true),
('EU_SANCTIONS', 'https://ec.europa.eu/info/business-economy-euro/banking-and-finance/international-relations/restrictive-measures-sanctions_en', true),
('US_OFAC', 'https://www.treasury.gov/ofac', true);

-- Insert sample companies
INSERT INTO companies (
  company_number, name, status, company_type, 
  incorporation_date, jurisdiction, registered_address, sic_codes
) VALUES 
  ('12345678', 'TechCorp Limited', 'active', 'private_limited', '2020-01-15', 'GB', '123 Innovation Drive, London, SW1A 1AA', ARRAY['62020', '62090']),
  ('87654321', 'DataFlow Solutions Ltd', 'active', 'private_limited', '2019-06-20', 'GB', '456 Data Street, Manchester, M1 1AA', ARRAY['62012', '63110']),
  ('11223344', 'Green Energy Partners', 'active', 'private_limited', '2021-03-10', 'GB', '789 Renewable Way, Edinburgh, EH1 1AA', ARRAY['35110', '35230']),
  ('44332211', 'Dissolved Company Ltd', 'dissolved', 'private_limited', '2018-12-01', 'GB', '999 Gone Street, Birmingham, B1 1AA', ARRAY['70100']);

-- Insert sample persons
INSERT INTO persons (
  full_name, nationality, address, normalized_name
) VALUES
  ('John Smith', 'British', '10 Downing Street, London, SW1A 2AA', 'john smith'),
  ('Sarah Johnson', 'British', '25 Kings Road, London, SW3 4RP', 'sarah johnson'),
  ('Michael Brown', 'British', '42 Technology Avenue, Manchester, M2 3BB', 'michael brown'),
  ('Emily Davis', 'British', '15 Green Lane, Edinburgh, EH2 4QQ', 'emily davis'),
  ('David Wilson', 'British', '88 Business Park, Birmingham, B2 5TT', 'david wilson');

-- Link some officers to companies
INSERT INTO company_officers (company_id, person_id, role, appointed_on)
SELECT 
  c.id, p.id, 'director', '2020-01-15'
FROM companies c, persons p
WHERE c.company_number = '12345678' AND p.full_name = 'John Smith';

INSERT INTO company_officers (company_id, person_id, role, appointed_on)
SELECT 
  c.id, p.id, 'secretary', '2020-01-15'
FROM companies c, persons p
WHERE c.company_number = '12345678' AND p.full_name = 'Sarah Johnson';

-- Test the search function
SELECT 'Testing search function...' as status;
SELECT * FROM search_companies('Tech', 5);

-- Show record counts
SELECT 
    'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL
SELECT 
    'persons' as table_name, COUNT(*) as record_count FROM persons
UNION ALL
SELECT 
    'company_officers' as table_name, COUNT(*) as record_count FROM company_officers
UNION ALL
SELECT 
    'sanctions_lists' as table_name, COUNT(*) as record_count FROM sanctions_lists;

-- Final success message
SELECT 'Sample data inserted successfully! Database is ready!' as status;