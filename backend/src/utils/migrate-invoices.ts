import { supabaseAdmin } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function migrateInvoices() {
  try {
    console.log('Starting invoices migration...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-invoices-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration failed:', error);

      // If exec_sql doesn't exist, try direct query
      console.log('Trying alternative method...');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        const { error: stmtError } = await supabaseAdmin.from('_sql').select(statement);
        if (stmtError) {
          console.error('Statement error:', stmtError);
        }
      }
    } else {
      console.log('✅ Invoices migration completed successfully!');
    }

    // Verify tables were created
    console.log('\nVerifying tables...');
    const { data: invoicesCheck, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('count');

    const { data: itemsCheck, error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .select('count');

    if (!invoicesError) {
      console.log('✅ invoices table exists');
    } else {
      console.log('❌ invoices table not found:', invoicesError.message);
    }

    if (!itemsError) {
      console.log('✅ invoice_items table exists');
    } else {
      console.log('❌ invoice_items table not found:', itemsError.message);
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateInvoices();
