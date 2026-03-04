// Run migration 042: Add org_code to org_settings and device_number to registers
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { up } = require('./042_add_org_code_and_device_number');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('Running migration 042: Add org_code and device_number...');

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

    console.log('Migration 042 completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
