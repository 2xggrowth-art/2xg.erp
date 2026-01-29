import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('🚀 Starting Transfer Orders table migration...');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

async function runMigration() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-transfer-orders-table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('\n📄 SQL file loaded successfully');
    console.log('\n⚠️  IMPORTANT: Copy and paste the following SQL into your Supabase SQL Editor:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n📝 Steps to run the migration:');
    console.log('   1. Go to: https://ulubfvmxtqmsoyumdwvg.supabase.co');
    console.log('   2. Click on "SQL Editor" in the left sidebar');
    console.log('   3. Create a new query');
    console.log('   4. Copy the SQL above and paste it into the editor');
    console.log('   5. Click "Run" to execute the migration');
    console.log('\n✅ After running the SQL, restart your backend server!\n');

  } catch (error) {
    console.error('❌ Error reading SQL file:', error);
  }
}

runMigration();
