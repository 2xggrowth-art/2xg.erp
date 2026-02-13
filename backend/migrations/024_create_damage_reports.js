// Migration 024: Create item_damage_reports table
const up = `
-- Table for tracking damaged items with photos
CREATE TABLE IF NOT EXISTS item_damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id UUID REFERENCES stock_counts(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100),
  bin_location_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  bin_code VARCHAR(50),
  damaged_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  damage_description TEXT,
  photo_base64 TEXT,
  photo_url TEXT,
  reported_by UUID REFERENCES mobile_users(id) ON DELETE SET NULL,
  reported_by_name VARCHAR(255),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON item_damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_damage_reports_item ON item_damage_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_stock_count ON item_damage_reports(stock_count_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP TABLE IF EXISTS item_damage_reports;
`;

module.exports = { up, down };
