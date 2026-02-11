// Migration: Create damage_reports table
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
CREATE TABLE IF NOT EXISTS damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  bin_location_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  quantity DECIMAL(15,2) NOT NULL CHECK (quantity > 0),
  damage_type VARCHAR(50) CHECK (damage_type IN ('broken', 'water_damage', 'expired', 'other')),
  description TEXT,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(30) DEFAULT 'reported' CHECK (status IN ('reported', 'reviewed', 'written_off')),
  reported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_by_name VARCHAR(255),
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  stock_adjusted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_damage_reports_item ON damage_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);

NOTIFY pgrst, 'reload schema';
`;

async function migrate() {
  console.log('Creating damage_reports table...');

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
    console.log('Migration 015 completed successfully!');
  } else {
    console.error('Migration 015 failed!');
  }
}

migrate().catch(console.error);
