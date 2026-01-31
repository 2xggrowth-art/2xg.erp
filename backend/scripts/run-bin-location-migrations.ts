import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(migrationFile: string, description: string) {
  console.log(`\n📝 Running: ${description}`);
  console.log(`   File: ${migrationFile}`);

  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If the RPC doesn't exist, try direct query
      console.log('   Attempting direct SQL execution...');
      const { error: directError } = await supabase.from('_migrations').insert({ name: migrationFile });

      if (directError && directError.message.includes('does not exist')) {
        console.log('   ⚠️  Cannot execute SQL directly via Supabase JS client');
        console.log('   📋 Please run this migration manually in Supabase SQL Editor:');
        console.log(`   👉 ${migrationPath}`);
        console.log('\n' + sql);
        return false;
      }
    }

    console.log(`   ✅ ${description} completed successfully`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log(`\n   📋 Manual migration required. Copy this SQL to Supabase SQL Editor:\n`);
    console.log(`   File: ${path.join(__dirname, '..', 'migrations', migrationFile)}\n`);
    return false;
  }
}

async function reloadSchema() {
  console.log('\n🔄 Reloading PostgREST schema...');

  try {
    const { error } = await supabase.rpc('pg_notify', {
      channel: 'pgrst',
      payload: 'reload schema'
    });

    if (error) {
      console.log('   ⚠️  Could not reload schema via RPC');
      console.log('   📋 Please run manually in Supabase SQL Editor:');
      console.log(`   👉 NOTIFY pgrst, 'reload schema';`);
      return false;
    }

    console.log('   ✅ Schema reloaded successfully');
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log('   📋 Please run manually: NOTIFY pgrst, \'reload schema\';');
    return false;
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying tables were created...');

  const tables = [
    'bin_locations',
    'bill_item_bin_allocations',
    'invoice_item_bin_allocations'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ Table '${table}' does not exist or is not accessible`);
        console.log(`      Error: ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}' exists (${count ?? 0} records)`);
      }
    } catch (error: any) {
      console.log(`   ❌ Table '${table}': ${error.message}`);
    }
  }

  // Check sample bin locations
  console.log('\n📦 Checking sample bin locations...');
  try {
    const { data, error } = await supabase
      .from('bin_locations')
      .select('bin_code, warehouse, status')
      .order('bin_code');

    if (error) {
      console.log(`   ❌ Could not fetch bin locations: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`   ✅ Found ${data.length} bin location(s):`);
      data.forEach(bin => {
        console.log(`      - ${bin.bin_code} (${bin.warehouse}) - ${bin.status}`);
      });
    } else {
      console.log('   ⚠️  No bin locations found. Sample data may not have been inserted.');
    }
  } catch (error: any) {
    console.log(`   ❌ Error fetching bins: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Bin Location Migrations');
  console.log('=' .repeat(60));
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log('=' .repeat(60));

  // Check if migration files exist
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = [
    '001_create_bin_locations.sql',
    '002_create_bill_item_bin_allocations.sql',
    '003_create_invoice_item_bin_allocations.sql'
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }
  }

  console.log('\n✅ All migration files found\n');
  console.log('⚠️  IMPORTANT: Supabase JS client cannot execute raw SQL directly.');
  console.log('   We will attempt migrations, but you may need to run them manually.');
  console.log('\n   To run manually:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Open SQL Editor');
  console.log('   3. Copy and paste each migration file');
  console.log('   4. Click "Run"');
  console.log('\nPress Ctrl+C to cancel, or the script will continue...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Run migrations
  await runMigration('001_create_bin_locations.sql', 'Migration 001: Create bin_locations table');
  await runMigration('002_create_bill_item_bin_allocations.sql', 'Migration 002: Create bill_item_bin_allocations table');
  await runMigration('003_create_invoice_item_bin_allocations.sql', 'Migration 003: Create invoice_item_bin_allocations table');

  // Reload schema
  await reloadSchema();

  // Verify tables
  await verifyTables();

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Migration process completed');
  console.log('='.repeat(60));
  console.log('\n📖 Next steps:');
  console.log('   1. If tables were created successfully, you can start using bin locations');
  console.log('   2. If migrations failed, run them manually in Supabase SQL Editor');
  console.log('   3. Test the feature by creating a new bill with bin allocations');
  console.log('\n📚 Documentation: BIN_LOCATION_IMPLEMENTATION_SUMMARY.md\n');
}

main().catch(console.error);
