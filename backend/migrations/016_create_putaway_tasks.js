require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const up = `
-- Create putaway_tasks table
CREATE TABLE IF NOT EXISTS putaway_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number VARCHAR(50) UNIQUE NOT NULL,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  bill_item_id UUID REFERENCES bill_items(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  serial_number TEXT,
  quantity DECIMAL(15,2) NOT NULL CHECK (quantity > 0),
  placed_quantity DECIMAL(15,2) DEFAULT 0,
  suggested_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  suggested_bin_code VARCHAR(50),
  actual_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  actual_bin_code VARCHAR(50),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to_user_id UUID,
  assigned_to_name VARCHAR(255),
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_by_user_id UUID,
  completed_at TIMESTAMPTZ,
  completed_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_putaway_status ON putaway_tasks(status);
CREATE INDEX IF NOT EXISTS idx_putaway_assigned ON putaway_tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_putaway_item ON putaway_tasks(item_id);
CREATE INDEX IF NOT EXISTS idx_putaway_bill_item ON putaway_tasks(bill_item_id);

-- Add capacity column to bin_locations for utilization tracking
ALTER TABLE bin_locations ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP TABLE IF EXISTS putaway_tasks CASCADE;
ALTER TABLE bin_locations DROP COLUMN IF EXISTS capacity;
NOTIFY pgrst, 'reload schema';
`;

async function runMigration(direction = 'up') {
  const sql = direction === 'up' ? up : down;

  console.log(`Running migration 016 (${direction})...`);

  const response = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Migration failed:', result);
    process.exit(1);
  }

  console.log('Migration 016 completed successfully:', result);
}

// Run if called directly
if (require.main === module) {
  const direction = process.argv[2] || 'up';
  runMigration(direction).catch(console.error);
}

module.exports = { up, down };
