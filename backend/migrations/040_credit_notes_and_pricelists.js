const up = `
  -- Credit notes for returns
  CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    invoice_number VARCHAR(50),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    sub_total DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    organization_id UUID REFERENCES organizations(id),
    pos_session_id UUID REFERENCES pos_sessions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS credit_note_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    rate DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Pricelists for wholesale/retail pricing
  CREATE TABLE IF NOT EXISTS pricelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS pricelist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricelist_id UUID NOT NULL REFERENCES pricelists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pricelist_id, item_id)
  );

  -- Registers table for multi-register support
  CREATE TABLE IF NOT EXISTS registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Seed default register
  INSERT INTO registers (organization_id, name, description)
  SELECT id, 'billing desk', 'Main billing counter'
  FROM organizations LIMIT 1
  ON CONFLICT DO NOTHING;

  NOTIFY pgrst, 'reload schema';
`;

const down = `
  DROP TABLE IF EXISTS pricelist_items;
  DROP TABLE IF EXISTS pricelists;
  DROP TABLE IF EXISTS credit_note_items;
  DROP TABLE IF EXISTS credit_notes;
  DROP TABLE IF EXISTS registers;

  NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
