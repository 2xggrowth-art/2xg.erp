// Migration 025: Create placement_tasks, transfer_tasks, and count_schedules tables
const up = `
-- Table for tracking item placement (putaway) workflow
CREATE TABLE IF NOT EXISTS placement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  serial_number VARCHAR(100),
  colour VARCHAR(100),
  colour_hex VARCHAR(20),
  size VARCHAR(50),
  variant VARCHAR(100),
  category VARCHAR(100),
  source_po VARCHAR(100),
  suggested_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  suggested_bin_code VARCHAR(50),
  suggested_bin_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'placed', 'transferred')),
  placed_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  placed_bin_code VARCHAR(50),
  placed_by UUID REFERENCES mobile_users(id) ON DELETE SET NULL,
  placed_by_name VARCHAR(255),
  placed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_tasks_status ON placement_tasks(status);
CREATE INDEX IF NOT EXISTS idx_placement_tasks_item ON placement_tasks(item_id);

-- Table for mobile transfer tasks (counter-level pick-and-place)
CREATE TABLE IF NOT EXISTS transfer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50),
  transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  serial_number VARCHAR(100),
  colour VARCHAR(100),
  colour_hex VARCHAR(20),
  size VARCHAR(50),
  variant VARCHAR(100),
  source_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  source_bin_code VARCHAR(50),
  source_location VARCHAR(255),
  dest_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  dest_bin_code VARCHAR(50),
  dest_location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
  reason TEXT,
  assigned_to UUID REFERENCES mobile_users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transfer_tasks_status ON transfer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_transfer_tasks_assigned ON transfer_tasks(assigned_to);

-- Table for stock count schedule configuration per location
CREATE TABLE IF NOT EXISTS count_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  regular_days JSONB DEFAULT '[true,true,true,true,true,true,false]',
  high_value_daily BOOLEAN DEFAULT false,
  overrides JSONB DEFAULT '[]',
  holidays JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id)
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP TABLE IF EXISTS count_schedules;
DROP TABLE IF EXISTS transfer_tasks;
DROP TABLE IF EXISTS placement_tasks;
`;

module.exports = { up, down };
