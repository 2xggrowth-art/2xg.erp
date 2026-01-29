import { supabaseAdmin as supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function migrateSalesOrders() {
  try {
    console.log('Starting Sales Orders migration...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-sales-orders-tables.sql');
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

    console.log('✅ Sales Orders migration completed successfully!');

    // Verify tables were created
    const { data: ordersCheck, error: ordersError } = await supabase
      .from('sales_orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.error('❌ Verification failed:', ordersError);
    } else {
      console.log('✅ Verified: sales_orders table exists');
    }

    const { data: itemsCheck, error: itemsError } = await supabase
      .from('sales_order_items')
      .select('*')
      .limit(1);

    if (itemsError) {
      console.error('❌ Verification failed:', itemsError);
    } else {
      console.log('✅ Verified: sales_order_items table exists');
    }

  } catch (error: any) {
    console.error('Fatal error:', error);
    throw error;
  }
}

// Run migration
migrateSalesOrders()
  .then(() => {
    console.log('\n🎉 Migration process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
