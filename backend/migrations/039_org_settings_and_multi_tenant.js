const up = `
  -- Org settings table (replaces hardcoded BCH data across the codebase)
  CREATE TABLE IF NOT EXISTS org_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    state_code VARCHAR(2),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    gstin VARCHAR(15),
    gst_registration_type VARCHAR(20) DEFAULT 'regular',
    pan VARCHAR(10),
    logo_url TEXT,
    -- Bank details
    bank_name VARCHAR(100),
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(20),
    bank_branch VARCHAR(100),
    bank_account_type VARCHAR(20),
    -- Document prefixes
    invoice_prefix VARCHAR(10) DEFAULT 'INV-',
    session_prefix VARCHAR(10) DEFAULT 'SE1-',
    -- Invoice defaults
    default_notes TEXT,
    default_payment_terms VARCHAR(100) DEFAULT 'Due on Receipt',
    -- POS settings
    default_register VARCHAR(100) DEFAULT 'billing desk',
    place_of_supply VARCHAR(50),
    -- Appearance
    theme_color VARCHAR(7) DEFAULT '#2563EB',
    accent_color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
  );

  -- Seed BCH data (migrate from hardcoded values)
  INSERT INTO org_settings (
    organization_id, company_name, tagline,
    address_line1, address_line2, city, state, state_code, postal_code,
    phone, email, website, gstin,
    bank_name, bank_account_name, bank_account_number, bank_ifsc, bank_branch, bank_account_type,
    invoice_prefix, session_prefix, default_register, place_of_supply,
    default_notes
  ) SELECT
    id, 'BHARAT CYCLE HUB', 'Defined By Service & Expertise',
    'Main Road, Chikka Bommasandra, Yelahanka', 'Bengaluru, Karnataka 560065',
    'bangalore', 'Karnataka', '29', '560065',
    '9380097119', 'inventory.bharathcyclehub@gmail.com', 'Bharathcyclehub.com', '29AMVPI3949R1ZQ',
    'HDFC', 'BHARAT CYCLE HUB', '50200078092592', 'HDFC0000371', 'YELAHANKA', 'CURRENT',
    'INV-', 'SE1-', 'billing desk', 'Karnataka (29)',
    'PLEASE CHECKOUT BHARATHCYCLEHUB.COM FOR MORE DETAILS.'
  FROM organizations LIMIT 1
  ON CONFLICT (organization_id) DO NOTHING;

  NOTIFY pgrst, 'reload schema';
`;

const down = `
  DROP TABLE IF EXISTS org_settings;

  NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
