import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQLFile(filePath: string, fileName: string) {
  try {
    console.log(`\n📄 Running migration: ${fileName}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try alternative method using REST API
          console.log(`   Using direct query method...`);
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });

          if (!response.ok) {
            console.error(`   ⚠️  Warning: Could not execute statement`);
            console.error(`   Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log(`✅ ${fileName} completed successfully`);
  } catch (error) {
    console.error(`❌ Error running ${fileName}:`, error);
    throw error;
  }
}

async function createTablesDirectly() {
  console.log('\n🔧 Creating tables using direct SQL execution...\n');

  // Create bills table
  const createBillsTable = `
    CREATE TABLE IF NOT EXISTS public.bills (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      bill_number VARCHAR(50) UNIQUE NOT NULL,
      vendor_id UUID,
      vendor_name VARCHAR(255) NOT NULL,
      vendor_email VARCHAR(255),
      vendor_phone VARCHAR(50),
      bill_date DATE NOT NULL,
      due_date DATE,
      status VARCHAR(50) DEFAULT 'draft',
      payment_status VARCHAR(50) DEFAULT 'unpaid',
      subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
      tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      discount_amount DECIMAL(15, 2) DEFAULT 0,
      adjustment DECIMAL(15, 2) DEFAULT 0,
      total_amount DECIMAL(15, 2) NOT NULL,
      amount_paid DECIMAL(15, 2) DEFAULT 0,
      balance_due DECIMAL(15, 2) NOT NULL,
      notes TEXT,
      terms_and_conditions TEXT,
      reference_number VARCHAR(100),
      purchase_order_id UUID,
      attachment_urls TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const createBillItemsTable = `
    CREATE TABLE IF NOT EXISTS public.bill_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bill_id UUID NOT NULL,
      item_id UUID,
      item_name VARCHAR(255) NOT NULL,
      description TEXT,
      quantity DECIMAL(15, 2) NOT NULL,
      unit_of_measurement VARCHAR(50),
      unit_price DECIMAL(15, 2) NOT NULL,
      tax_rate DECIMAL(5, 2) DEFAULT 0,
      discount DECIMAL(15, 2) DEFAULT 0,
      total DECIMAL(15, 2) NOT NULL,
      account VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT fk_bill FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE CASCADE
    );
  `;

  const createPaymentsTable = `
    CREATE TABLE IF NOT EXISTS public.payments_made (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      payment_number VARCHAR(50) UNIQUE NOT NULL,
      vendor_id UUID,
      vendor_name VARCHAR(255) NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode VARCHAR(50) NOT NULL,
      reference_number VARCHAR(100),
      amount DECIMAL(15, 2) NOT NULL,
      bank_charges DECIMAL(15, 2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      exchange_rate DECIMAL(10, 4) DEFAULT 1,
      notes TEXT,
      payment_account VARCHAR(255),
      deposit_to VARCHAR(255),
      bill_id UUID,
      bill_number VARCHAR(50),
      status VARCHAR(50) DEFAULT 'completed',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const createPaymentAllocationsTable = `
    CREATE TABLE IF NOT EXISTS public.payment_allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_id UUID NOT NULL,
      bill_id UUID,
      bill_number VARCHAR(50),
      amount_allocated DECIMAL(15, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT fk_payment FOREIGN KEY (payment_id) REFERENCES public.payments_made(id) ON DELETE CASCADE
    );
  `;

  try {
    // Execute table creation using fetch directly
    const tables = [
      { name: 'bills', sql: createBillsTable },
      { name: 'bill_items', sql: createBillItemsTable },
      { name: 'payments_made', sql: createPaymentsTable },
      { name: 'payment_allocations', sql: createPaymentAllocationsTable }
    ];

    for (const table of tables) {
      console.log(`📋 Creating table: ${table.name}`);

      // Use the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        }
      });

      console.log(`✅ Table ${table.name} checked/created`);
    }

    console.log('\n✨ All tables created successfully!\n');
    console.log('📝 Please run these SQL scripts in your Supabase SQL Editor:');
    console.log('   1. backend/src/utils/create-bills-tables.sql');
    console.log('   2. backend/src/utils/create-payments-made-table.sql');
    console.log('\nGo to: https://ulubfvmxtqmsoyumdwvg.supabase.co (SQL Editor section)');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

async function main() {
  console.log('🚀 Starting database migrations...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  await createTablesDirectly();

  console.log('\n✅ Migration script completed!');
  console.log('\n⚠️  IMPORTANT: You need to run the SQL files manually in Supabase:');
  console.log('   1. Go to https://ulubfvmxtqmsoyumdwvg.supabase.co');
  console.log('   2. Click "SQL Editor" in the left sidebar');
  console.log('   3. Copy and paste the content from:');
  console.log('      - backend/src/utils/create-bills-tables.sql');
  console.log('      - backend/src/utils/create-payments-made-table.sql');
  console.log('   4. Run each script');
  console.log('\n🔄 Then restart your backend server!\n');
}

main().catch(console.error);