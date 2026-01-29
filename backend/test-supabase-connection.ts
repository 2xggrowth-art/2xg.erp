import { supabaseAdmin } from './src/config/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check environment variables
    console.log('✓ Environment Variables Check:');
    console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
    console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing'}\n`);

    // Test 2: Simple query to verify connection
    console.log('🔗 Testing database connection...');
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .limit(1);

    if (orgError) {
      console.error('✗ Connection failed:', orgError.message);
      console.error('  Make sure you have:');
      console.error('  1. Created your Supabase project');
      console.error('  2. Updated backend/.env with correct credentials');
      console.error('  3. Run the database schema SQL in Supabase SQL Editor\n');
      process.exit(1);
    }

    console.log('✓ Database connection successful!\n');

    // Test 3: Check if tables exist
    console.log('📊 Checking database tables...');
    const tables = [
      'organizations',
      'product_categories',
      'sales_transactions',
      'inventory_items',
      'shipments',
      'deliveries',
      'service_tickets',
      'crm_leads'
    ];

    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`  ✗ ${table}: Not found or error`);
        console.log(`    Error: ${error.message}`);
      } else {
        console.log(`  ✓ ${table}: OK`);
      }
    }

    console.log('\n🎉 Supabase is properly connected!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run dev (to start the backend)');
    console.log('  2. Run: npm run seed (optional - to add sample data)');
    console.log('  3. Start your frontend and begin using the dashboard!\n');

  } catch (error: any) {
    console.error('✗ Unexpected error:', error.message);
    console.error('\nPlease check:');
    console.error('  1. Your internet connection');
    console.error('  2. Supabase project is active and running');
    console.error('  3. Environment variables are correctly set\n');
    process.exit(1);
  }
}

testSupabaseConnection();
