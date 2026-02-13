/**
 * Run migration 022: Add serial_number to stock_count_items
 */
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const migration = require('./022_add_serial_to_stock_count_items.js');

async function runMigration() {
  console.log('Running migration 022...');
  console.log('URL:', SUPABASE_URL);

  try {
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ query: migration.up }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Migration failed:', result);
      process.exit(1);
    }

    console.log('Migration 022 completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
