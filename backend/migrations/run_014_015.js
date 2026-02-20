// Run migrations 014 and 015 via individual SQL statements through pg-meta
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(description, sql) {
  console.log(`Running: ${description}...`);
  const response = await fetch(SUPABASE_URL + '/pg/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (response.ok) {
    console.log(`  OK`);
    return true;
  } else {
    const text = await response.text();
    console.error(`  FAILED (${response.status}): ${text}`);
    return false;
  }
}

async function migrate() {
  // Stock counts table
  await runSQL('stock_counts table', `
    CREATE TABLE IF NOT EXISTS stock_counts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_count_number VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      location_id UUID,
      location_name VARCHAR(255),
      assigned_to_user_id UUID,
      assigned_to_name VARCHAR(255),
      status VARCHAR(30) DEFAULT 'draft',
      notes TEXT,
      approved_by_user_id UUID,
      approved_at TIMESTAMPTZ,
      created_by_user_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSQL('stock_counts indexes', `
    CREATE INDEX IF NOT EXISTS idx_stock_counts_status ON stock_counts(status);
    CREATE INDEX IF NOT EXISTS idx_stock_counts_assigned ON stock_counts(assigned_to_user_id);
  `);

  // Stock count items table
  await runSQL('stock_count_items table', `
    CREATE TABLE IF NOT EXISTS stock_count_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
      item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      item_name VARCHAR(255),
      sku VARCHAR(100),
      bin_location_id UUID,
      bin_code VARCHAR(50),
      expected_quantity DECIMAL(15,2),
      counted_quantity DECIMAL(15,2),
      variance DECIMAL(15,2),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSQL('stock_count_items indexes', `
    CREATE INDEX IF NOT EXISTS idx_stock_count_items_sc ON stock_count_items(stock_count_id);
    CREATE INDEX IF NOT EXISTS idx_stock_count_items_item ON stock_count_items(item_id);
  `);

  // Damage reports table
  await runSQL('damage_reports table', `
    CREATE TABLE IF NOT EXISTS damage_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      report_number VARCHAR(50) UNIQUE NOT NULL,
      item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      item_name VARCHAR(255),
      bin_location_id UUID,
      quantity DECIMAL(15,2) NOT NULL,
      damage_type VARCHAR(50),
      description TEXT,
      photo_urls JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(30) DEFAULT 'reported',
      reported_by_user_id UUID,
      reported_by_name VARCHAR(255),
      reviewed_by_user_id UUID,
      reviewed_at TIMESTAMPTZ,
      stock_adjusted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await runSQL('damage_reports indexes', `
    CREATE INDEX IF NOT EXISTS idx_damage_reports_item ON damage_reports(item_id);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);
  `);

  // Reload PostgREST schema
  await runSQL('reload schema', `NOTIFY pgrst, 'reload schema';`);

  console.log('\nDone! Verifying tables...');

  // Verify
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { error: e1 } = await supabase.from('stock_counts').select('id').limit(1);
  console.log('stock_counts:', e1 ? e1.message : 'OK');

  const { error: e2 } = await supabase.from('stock_count_items').select('id').limit(1);
  console.log('stock_count_items:', e2 ? e2.message : 'OK');

  const { error: e3 } = await supabase.from('damage_reports').select('id').limit(1);
  console.log('damage_reports:', e3 ? e3.message : 'OK');
}

migrate().catch(console.error);
