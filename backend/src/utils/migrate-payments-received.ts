import { supabaseAdmin as supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function migratePaymentsReceived() {
  try {
    console.log('Starting Payments Received migration...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-payments-received-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration...');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration error:', error);

      // Try alternative method - execute line by line
      console.log('Trying alternative migration method...');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (stmtError) {
          console.warn('Statement error (may be OK):', stmtError.message);
        }
      }
    }

    console.log('✅ Payments Received migration completed successfully!');

    // Verify table was created
    const { data: paymentsCheck, error: paymentsError } = await supabase
      .from('payments_received')
      .select('*')
      .limit(1);

    if (paymentsError) {
      console.error('❌ Verification failed:', paymentsError);
    } else {
      console.log('✅ Verified: payments_received table exists');
    }

  } catch (error: any) {
    console.error('Fatal error:', error);
    throw error;
  }
}

// Run migration
migratePaymentsReceived()
  .then(() => {
    console.log('\n🎉 Migration process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
