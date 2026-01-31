/**
 * Bin Location Setup Verification Script
 * Run this to check if your database is properly configured
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('\n🔍 Verifying Bin Location Setup...\n');

  let allGood = true;

  // Check 1: bin_locations table
  console.log('1️⃣  Checking bin_locations table...');
  try {
    const { data: bins, error } = await supabase
      .from('bin_locations')
      .select('*')
      .limit(5);

    if (error) {
      console.error('   ❌ bin_locations table error:', error.message);
      console.log('   💡 Run migration: backend/migrations/001_create_bin_locations.sql');
      allGood = false;
    } else {
      console.log(`   ✅ bin_locations table exists with ${bins.length} sample records`);
      if (bins.length > 0) {
        console.log(`   📦 Sample bins: ${bins.map(b => b.bin_code).join(', ')}`);
      }
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
    allGood = false;
  }

  // Check 2: bill_item_bin_allocations table
  console.log('\n2️⃣  Checking bill_item_bin_allocations table...');
  try {
    const { data: allocations, error } = await supabase
      .from('bill_item_bin_allocations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   ❌ bill_item_bin_allocations table error:', error.message);
      console.log('   💡 Run migration: backend/migrations/002_create_bill_item_bin_allocations.sql');
      allGood = false;
    } else {
      console.log(`   ✅ bill_item_bin_allocations table exists`);
      if (allocations && allocations.length > 0) {
        console.log(`   📊 Found ${allocations.length} allocation records`);
      } else {
        console.log('   ⚠️  No allocation records yet (expected until you create a bill with bin allocations)');
      }
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
    allGood = false;
  }

  // Check 3: bill_items table (should already exist)
  console.log('\n3️⃣  Checking bill_items table...');
  try {
    const { data: billItems, error, count } = await supabase
      .from('bill_items')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('   ❌ bill_items table error:', error.message);
      console.log('   💡 This table should exist from core schema. Check your database setup.');
      allGood = false;
    } else {
      console.log(`   ✅ bill_items table exists`);
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
    allGood = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allGood) {
    console.log('✅ All tables configured correctly!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Create a new bill with items');
    console.log('   2. Click "Select Bins" to allocate quantities');
    console.log('   3. View item details to see bin locations');
  } else {
    console.log('❌ Setup incomplete. Please run the required migrations.');
    console.log('\n📋 Migration Steps:');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Run backend/migrations/001_create_bin_locations.sql');
    console.log('   3. Run backend/migrations/002_create_bill_item_bin_allocations.sql');
    console.log('   4. Run: NOTIFY pgrst, \'reload schema\';');
    console.log('   5. Run this script again to verify');
  }
  console.log('='.repeat(60) + '\n');
}

verifySetup().catch(console.error);
