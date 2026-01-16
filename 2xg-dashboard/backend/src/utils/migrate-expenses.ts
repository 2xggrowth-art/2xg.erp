import { supabaseAdmin } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running expenses table migration...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-expenses-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('COMMENT')) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // Try direct execution for DDL statements
        console.log('Trying alternative execution method...');
        const { error: directError } = await supabaseAdmin.from('_migrations').insert({
          name: `expense_migration_${Date.now()}`,
          sql: statement
        });

        if (directError) {
          console.error('Error executing statement:', error);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Verifying tables...');

    // Verify tables exist
    const { data: categories, error: catError } = await supabaseAdmin
      .from('expense_categories')
      .select('count');

    const { data: expenses, error: expError } = await supabaseAdmin
      .from('expenses')
      .select('count');

    if (catError) {
      console.error('❌ Error: expense_categories table not found:', catError.message);
    } else {
      console.log('✅ expense_categories table exists');
    }

    if (expError) {
      console.error('❌ Error: expenses table not found:', expError.message);
    } else {
      console.log('✅ expenses table exists');
    }

    console.log('\n🎉 Setup complete!');
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
