// Run migrations using Supabase JS client (rpc) instead of pg-meta HTTP endpoint
// This avoids the Kong/Traefik routing issue
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runSQL(description, sql) {
  console.log(`Running: ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      // exec_sql might not exist, try alternative
      console.log(`  rpc failed: ${error.message}`);
      return false;
    }
    console.log(`  OK`);
    return true;
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    return false;
  }
}

// Try direct PostgREST approach - create tables via REST
async function checkTable(name) {
  const { error } = await supabase.from(name).select('id').limit(1);
  if (error) {
    console.log(`  ${name}: ${error.message}`);
    return false;
  }
  console.log(`  ${name}: EXISTS`);
  return true;
}

async function migrate() {
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Checking connectivity...');

  // First test basic connectivity
  const { data, error } = await supabase.from('items').select('id').limit(1);
  if (error) {
    console.log('ERROR: Cannot connect to Supabase:', error.message);

    // Try pg-meta endpoint directly
    console.log('\nTrying pg-meta endpoint directly...');
    try {
      const response = await fetch(SUPABASE_URL + '/pg/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
          'apikey': SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: 'SELECT 1 as test' }),
      });
      const text = await response.text();
      console.log(`pg-meta response (${response.status}):`, text.substring(0, 200));
    } catch (e) {
      console.log('pg-meta also failed:', e.message);
    }
    return;
  }

  console.log('Connected! Items table accessible.\n');

  // Check if tables already exist
  console.log('Checking if migration tables already exist...');
  const scExists = await checkTable('stock_counts');
  const sciExists = await checkTable('stock_count_items');
  const drExists = await checkTable('damage_reports');

  if (scExists && sciExists && drExists) {
    console.log('\nAll tables already exist! Migration not needed.');
    return;
  }

  // Try exec_sql RPC
  console.log('\nTrying exec_sql RPC...');
  const rpcOk = await runSQL('test', 'SELECT 1');

  if (rpcOk) {
    // RPC works, run migrations
    if (!scExists) {
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
        CREATE INDEX IF NOT EXISTS idx_stock_counts_status ON stock_counts(status);
        CREATE INDEX IF NOT EXISTS idx_stock_counts_assigned ON stock_counts(assigned_to_user_id);
      `);
    }

    if (!sciExists) {
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
        CREATE INDEX IF NOT EXISTS idx_stock_count_items_sc ON stock_count_items(stock_count_id);
        CREATE INDEX IF NOT EXISTS idx_stock_count_items_item ON stock_count_items(item_id);
      `);
    }

    if (!drExists) {
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
        CREATE INDEX IF NOT EXISTS idx_damage_reports_item ON damage_reports(item_id);
        CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);
      `);
    }

    await runSQL('reload schema', "NOTIFY pgrst, 'reload schema';");
  } else {
    console.log('\nexec_sql RPC not available. Trying pg-meta endpoint...');

    // Fall back to pg-meta
    const statements = [];

    if (!scExists) {
      statements.push({
        desc: 'stock_counts table',
        sql: `CREATE TABLE IF NOT EXISTS stock_counts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          stock_count_number VARCHAR(50) UNIQUE NOT NULL,
          description TEXT, location_id UUID, location_name VARCHAR(255),
          assigned_to_user_id UUID, assigned_to_name VARCHAR(255),
          status VARCHAR(30) DEFAULT 'draft', notes TEXT,
          approved_by_user_id UUID, approved_at TIMESTAMPTZ,
          created_by_user_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
      });
      statements.push({
        desc: 'stock_counts indexes',
        sql: `CREATE INDEX IF NOT EXISTS idx_stock_counts_status ON stock_counts(status);
              CREATE INDEX IF NOT EXISTS idx_stock_counts_assigned ON stock_counts(assigned_to_user_id)`
      });
    }

    if (!sciExists) {
      statements.push({
        desc: 'stock_count_items table',
        sql: `CREATE TABLE IF NOT EXISTS stock_count_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
          item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          item_name VARCHAR(255), sku VARCHAR(100),
          bin_location_id UUID, bin_code VARCHAR(50),
          expected_quantity DECIMAL(15,2), counted_quantity DECIMAL(15,2),
          variance DECIMAL(15,2), notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`
      });
    }

    if (!drExists) {
      statements.push({
        desc: 'damage_reports table',
        sql: `CREATE TABLE IF NOT EXISTS damage_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          report_number VARCHAR(50) UNIQUE NOT NULL,
          item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          item_name VARCHAR(255), bin_location_id UUID,
          quantity DECIMAL(15,2) NOT NULL, damage_type VARCHAR(50),
          description TEXT, photo_urls JSONB DEFAULT '[]'::jsonb,
          status VARCHAR(30) DEFAULT 'reported',
          reported_by_user_id UUID, reported_by_name VARCHAR(255),
          reviewed_by_user_id UUID, reviewed_at TIMESTAMPTZ,
          stock_adjusted BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
      });
    }

    statements.push({ desc: 'reload schema', sql: "NOTIFY pgrst, 'reload schema'" });

    for (const stmt of statements) {
      console.log(`Running: ${stmt.desc}...`);
      try {
        const response = await fetch(SUPABASE_URL + '/pg/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
            'apikey': SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({ query: stmt.sql }),
        });
        if (response.ok) {
          console.log('  OK');
        } else {
          const text = await response.text();
          console.log(`  FAILED (${response.status}): ${text.substring(0, 150)}`);
        }
      } catch (e) {
        console.log(`  ERROR: ${e.message}`);
      }
    }
  }

  // Final verification
  console.log('\nVerifying tables...');
  await checkTable('stock_counts');
  await checkTable('stock_count_items');
  await checkTable('damage_reports');
}

migrate().catch(console.error);
