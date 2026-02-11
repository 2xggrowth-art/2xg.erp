// Migration: Create stock_counts and stock_count_items tables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
CREATE TABLE IF NOT EXISTS stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_number VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  location_name VARCHAR(255),
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'approved', 'rejected', 'completed')),
  notes TEXT,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_counts_status ON stock_counts(status);
CREATE INDEX IF NOT EXISTS idx_stock_counts_assigned ON stock_counts(assigned_to_user_id);

CREATE TABLE IF NOT EXISTS stock_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  sku VARCHAR(100),
  bin_location_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  bin_code VARCHAR(50),
  expected_quantity DECIMAL(15,2),
  counted_quantity DECIMAL(15,2),
  variance DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_count_items_sc ON stock_count_items(stock_count_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_items_item ON stock_count_items(item_id);

NOTIFY pgrst, 'reload schema';
`;

async function migrate() {
  console.log('Creating stock_counts and stock_count_items tables...');

  const response = await fetch(SUPABASE_URL + '/pg/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  const result = await response.text();
  console.log('Status:', response.status);
  console.log('Result:', result);

  if (response.ok) {
    console.log('Migration 014 completed successfully!');
  } else {
    console.error('Migration 014 failed!');
  }
}

migrate().catch(console.error);
