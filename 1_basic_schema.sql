-- ============================================================================
-- NEXUS AI - BASIC SCHEMA SETUP (Execute this first)
-- ============================================================================

-- Create enums
CREATE TYPE company_status AS ENUM (
    'active',
    'dissolved',
    'liquidation',
    'dormant',
    'suspended',
    'strike_off',
    'unknown'
);

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

CREATE TYPE person_role AS ENUM (
    'director',
    'secretary',
    'person_of_significant_control',
    'shareholder',
    'trustee',
    'other'
);

-- Create companies table
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
    lei text,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create persons table
CREATE TABLE persons (
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

-- Success message
SELECT 'Basic tables created successfully!' as status;