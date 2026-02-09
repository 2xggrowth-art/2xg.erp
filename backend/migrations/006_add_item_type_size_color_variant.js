// Migration: Add item_type, size, color, variant columns to items table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Adding item_type, size, color, variant columns to items table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'goods';
      ALTER TABLE items ADD COLUMN IF NOT EXISTS size TEXT;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS color TEXT;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS variant TEXT;
    `
  });

  if (error) {
    console.log('RPC not available, trying alternative...');
    // Check if columns exist
    const { data, error: checkError } = await supabase
      .from('items')
      .select('item_type')
      .limit(1);

    if (checkError && checkError.message.includes('item_type')) {
      console.log('\nColumn does not exist yet. Please run this SQL in Supabase Studio:\n');
      console.log(`
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'goods';
ALTER TABLE items ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS variant TEXT;

NOTIFY pgrst, 'reload schema';
      `);
    } else {
      console.log('Columns already exist or were added successfully!');
    }
  } else {
    console.log('Columns added successfully!');
    // Reload PostgREST schema
    await supabase.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema';" });
  }
}

migrate().catch(console.error);
