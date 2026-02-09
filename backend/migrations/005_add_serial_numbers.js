// Migration: Add serial_numbers column to bill_items
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Adding serial_numbers column to bill_items...');

  // Add serial_numbers as JSONB array column
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS serial_numbers JSONB DEFAULT '[]'::jsonb;
    `
  });

  if (error) {
    // Try direct approach via PostgREST
    console.log('RPC not available, trying alternative...');
    // Use a workaround: insert and check
    const { data, error: checkError } = await supabase
      .from('bill_items')
      .select('serial_numbers')
      .limit(1);

    if (checkError && checkError.message.includes('serial_numbers')) {
      console.log('Column does not exist yet. Please run this SQL in Supabase Studio:');
      console.log('ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS serial_numbers JSONB DEFAULT \'[]\'::jsonb;');
      console.log("NOTIFY pgrst, 'reload schema';");
    } else {
      console.log('Column already exists or was added successfully!');
    }
  } else {
    console.log('Column added successfully!');
  }

  // Test query
  const { data, error: testError } = await supabase
    .from('bill_items')
    .select('id, serial_numbers')
    .limit(1);

  console.log('Test query result:', testError ? testError.message : 'Success', data);
}

migrate().catch(console.error);
