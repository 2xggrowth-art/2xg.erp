import { supabaseAdmin } from '../config/supabase';

async function removeRoleConstraint() {
  console.log('🔧 Removing role CHECK constraint from users table...\n');

  try {
    // First, check if we can connect
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }

    console.log('✅ Database connection successful');
    console.log('   Current users found:', testData?.length || 0);

    // Try to insert a test user with custom role to check if constraint exists
    const testEmail = `constraint-test-${Date.now()}@test.com`;
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        name: 'Constraint Test',
        email: testEmail,
        password_hash: 'test-hash',
        role: 'custom_test_role',
        status: 'Active'
      });

    if (insertError) {
      if (insertError.message.includes('check') || insertError.message.includes('constraint') || insertError.code === '23514') {
        console.log('\n⚠️  Role CHECK constraint is ACTIVE');
        console.log('   Error:', insertError.message);
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('   ─────────────────────────────────────────────────');
        console.log('   ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
        console.log('   ─────────────────────────────────────────────────');
        console.log('\n   Steps:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Open your project → SQL Editor');
        console.log('   3. Paste the SQL above and click RUN');
      } else {
        console.log('\n❌ Different error:', insertError.message);
      }
    } else {
      // Constraint doesn't exist! Delete the test user
      await supabaseAdmin.from('users').delete().eq('email', testEmail);
      console.log('\n✅ Role constraint is ALREADY REMOVED!');
      console.log('   Custom roles should work now.');
    }

  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

removeRoleConstraint();
