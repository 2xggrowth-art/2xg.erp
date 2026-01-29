const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('Checking if vendor_credits table exists...\n');

  const { data, error } = await supabase
    .from('vendor_credits')
    .select('count')
    .limit(1);

  if (error) {
    console.log('❌ Table does NOT exist!');
    console.log('Error:', error.message);
    console.log('\n📝 ACTION REQUIRED:');
    console.log('1. Go to: https://ulubfvmxtqmsoyumdwvg.supabase.co');
    console.log('2. Click "SQL Editor" in the sidebar');
    console.log('3. Copy content from: backend/src/utils/create-vendor-credits-table.sql');
    console.log('4. Paste and run it in Supabase SQL Editor');
  } else {
    console.log('✅ Table EXISTS! Database is ready.');
    console.log('Found', data ? data.length : 0, 'records');
  }
}

checkTables();
