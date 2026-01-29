import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createExpensesTables() {
  console.log('Creating expense tables...\n');

  try {
    // Note: For production, you should run the SQL directly in Supabase SQL Editor
    // This script will just verify the tables exist or provide instructions

    console.log('📋 INSTRUCTIONS:');
    console.log('================\n');
    console.log('Please run the SQL migration manually:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to: SQL Editor');
    console.log('3. Open the file: backend/src/utils/create-expenses-tables.sql');
    console.log('4. Copy and paste the SQL into the Supabase SQL Editor');
    console.log('5. Click "Run" to execute the migration\n');

    console.log('Checking if tables exist...\n');

    // Try to query the tables
    const { data: categoriesData, error: catError } = await supabase
      .from('expense_categories')
      .select('*')
      .limit(1);

    if (catError) {
      if (catError.code === '42P01') {
        console.log('❌ expense_categories table does NOT exist');
        console.log('   Please run the SQL migration in Supabase SQL Editor\n');
      } else {
        console.log('⚠️  Error checking expense_categories:', catError.message);
      }
    } else {
      console.log('✅ expense_categories table exists');
      console.log(`   Found ${categoriesData?.length || 0} categories\n`);
    }

    const { data: expensesData, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);

    if (expError) {
      if (expError.code === '42P01') {
        console.log('❌ expenses table does NOT exist');
        console.log('   Please run the SQL migration in Supabase SQL Editor\n');
      } else {
        console.log('⚠️  Error checking expenses:', expError.message);
      }
    } else {
      console.log('✅ expenses table exists');
      console.log(`   Found ${expensesData?.length || 0} expenses\n`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

createExpensesTables();
