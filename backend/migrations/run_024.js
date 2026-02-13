// Run migration 024
require('dotenv').config();
const { up } = require('./024_create_damage_reports');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('Running migration 024: Create item_damage_reports table...');

  try {
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ query: up }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Migration failed:', result);
      process.exit(1);
    }

    console.log('Migration 024 completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
