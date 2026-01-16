import { supabaseAdmin } from './src/config/supabase';

async function checkColumns() {
  console.log('Checking if columns exist in suppliers table...\n');

  try {
    // Query the information_schema to see what columns actually exist
    const { data, error } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'suppliers'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.error('Error querying columns (trying alternative method):', error);

      // Alternative: Try direct query
      const result = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .limit(0);

      console.log('Table exists and is queryable');
      console.log('\nPlease run this SQL in your Supabase SQL Editor to see all columns:');
      console.log(`
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'suppliers'
ORDER BY ordinal_position;
      `);
      return;
    }

    console.log('Columns in suppliers table:');
    console.table(data);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkColumns();
