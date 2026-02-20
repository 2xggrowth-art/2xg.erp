// Quick diagnostic script
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n=== Backend Diagnostic ===\n');
console.log('1. Environment Variables:');
console.log('   SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET (length: ' + supabaseKey.length + ')' : 'MISSING');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n ERROR: Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('\n2. Testing Supabase Connection...');

  // Test 1: Check if users table exists
  console.log('\n3. Checking users table...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .limit(5);

  if (usersError) {
    console.log('   ERROR:', usersError.message);
    console.log('   Code:', usersError.code);
    console.log('   Details:', usersError.details);
  } else {
    console.log('   Users found:', users.length);
    if (users.length > 0) {
      console.log('   Users:');
      users.forEach(u => console.log('   -', u.email, '| Role:', u.role, '| Status:', u.status));
    }
  }

  // Test 2: Check for specific user
  console.log('\n4. Looking for mohd.zaheer@gmail.com...');
  const { data: zaheer, error: zaheerError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'mohd.zaheer@gmail.com')
    .single();

  if (zaheerError) {
    console.log('   User NOT found:', zaheerError.message);
  } else {
    console.log('   User found!');
    console.log('   - ID:', zaheer.id);
    console.log('   - Name:', zaheer.name);
    console.log('   - Role:', zaheer.role);
    console.log('   - Status:', zaheer.status);
    console.log('   - Has password_hash:', zaheer.password_hash ? 'YES (length: ' + zaheer.password_hash.length + ')' : 'NO');
  }

  // Test 3: Check organizations
  console.log('\n5. Checking organizations table...');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (orgsError) {
    console.log('   ERROR:', orgsError.message);
  } else {
    console.log('   Organizations found:', orgs.length);
  }

  console.log('\n=== Diagnostic Complete ===\n');
}

diagnose().catch(console.error);
