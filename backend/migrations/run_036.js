const { up } = require('./036_create_pos_codes');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log('Running migration 036: Create pos_codes table...');
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
  console.log('Migration 036 completed successfully.');
  console.log(result);
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
