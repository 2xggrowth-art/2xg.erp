// Migration: Create item_batches and batch_deductions tables for batch tracking
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const upSQL = `
  -- Create item_batches table
  CREATE TABLE IF NOT EXISTS item_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    bill_item_id UUID REFERENCES bill_items(id) ON DELETE SET NULL,
    batch_number VARCHAR(100) NOT NULL,
    initial_quantity DECIMAL(15,2) NOT NULL CHECK (initial_quantity > 0),
    remaining_quantity DECIMAL(15,2) NOT NULL CHECK (remaining_quantity >= 0),
    bin_location_id UUID REFERENCES bin_locations(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'depleted')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_number, item_id)
  );

  CREATE INDEX IF NOT EXISTS idx_item_batches_item_id ON item_batches(item_id);
  CREATE INDEX IF NOT EXISTS idx_item_batches_bill_id ON item_batches(bill_id);
  CREATE INDEX IF NOT EXISTS idx_item_batches_status ON item_batches(status);

  -- Create batch_deductions table
  CREATE TABLE IF NOT EXISTS batch_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES item_batches(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    invoice_item_id UUID REFERENCES invoice_items(id) ON DELETE SET NULL,
    transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE SET NULL,
    quantity DECIMAL(15,2) NOT NULL CHECK (quantity > 0),
    deduction_type VARCHAR(20) NOT NULL CHECK (deduction_type IN ('sale', 'transfer', 'adjustment')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_batch_deductions_batch_id ON batch_deductions(batch_id);
  CREATE INDEX IF NOT EXISTS idx_batch_deductions_invoice_id ON batch_deductions(invoice_id);

  NOTIFY pgrst, 'reload schema';
`;

async function migrate() {
  console.log('Creating item_batches and batch_deductions tables...');

  const { error } = await supabase.rpc('exec_sql', { sql: upSQL });

  if (error) {
    console.log('RPC not available, trying alternative...');

    // Check if tables already exist
    const { data, error: checkError } = await supabase
      .from('item_batches')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('item_batches')) {
      console.log('Tables do not exist yet. Please run this SQL in Supabase Studio:');
      console.log(upSQL);
    } else {
      console.log('Tables already exist or were created successfully!');
    }
  } else {
    console.log('Tables created successfully!');
  }

  // Test queries
  const { error: testError1 } = await supabase
    .from('item_batches')
    .select('id')
    .limit(1);
  console.log('item_batches test:', testError1 ? testError1.message : 'Success');

  const { error: testError2 } = await supabase
    .from('batch_deductions')
    .select('id')
    .limit(1);
  console.log('batch_deductions test:', testError2 ? testError2.message : 'Success');
}

migrate().catch(console.error);
