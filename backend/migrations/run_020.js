/**
 * Run migration 020: Create Stock Counts Tables
 *
 * Usage: node migrations/run_020.js
 */

require('dotenv').config();

const migration = require('./020_create_stock_counts.js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('Running migration 020: Create Stock Counts Tables...');
  console.log('SUPABASE_URL:', SUPABASE_URL?.substring(0, 50) + '...');

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

    console.log('Migration completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
