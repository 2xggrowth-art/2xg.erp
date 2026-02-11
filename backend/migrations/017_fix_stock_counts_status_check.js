// Migration 017: Add 'completed' to stock_counts status CHECK constraint
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
-- Drop the old CHECK constraint and add a new one with 'completed'
ALTER TABLE stock_counts DROP CONSTRAINT IF EXISTS stock_counts_status_check;
ALTER TABLE stock_counts ADD CONSTRAINT stock_counts_status_check
  CHECK (status IN ('draft', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'));

NOTIFY pgrst, 'reload schema';
`;

async function migrate() {
  console.log('Fixing stock_counts status CHECK constraint (adding completed)...');

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
    console.log('Migration 017 completed successfully!');
  } else {
    console.error('Migration 017 failed!');
  }
}

migrate().catch(console.error);
