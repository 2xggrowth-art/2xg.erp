// Run migration 030 - Add auto_generated to stock_counts
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  const { up } = require('./030_add_auto_generated_to_stock_counts.js');

  console.log('Running migration 030: Add auto_generated to stock_counts...');
  console.log('SQL:', up);

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

  console.log('Migration result:', result);
  console.log('Migration 030 completed successfully!');
}

runMigration().catch(console.error);
