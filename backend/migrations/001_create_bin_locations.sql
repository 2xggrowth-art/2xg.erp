-- =====================================================
-- Bin Locations Table Migration
-- Run this in your Supabase SQL Editor
-- This creates the bin_locations table for warehouse management
-- =====================================================

-- Create bin_locations table
CREATE TABLE IF NOT EXISTS bin_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bin_code VARCHAR(50) UNIQUE NOT NULL,
  warehouse VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bin_locations_bin_code ON bin_locations(bin_code);
CREATE INDEX IF NOT EXISTS idx_bin_locations_warehouse ON bin_locations(warehouse);
CREATE INDEX IF NOT EXISTS idx_bin_locations_status ON bin_locations(status);

-- Create trigger to auto-update the updated_at timestamp
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bin_locations') THEN
    DROP TRIGGER IF EXISTS update_bin_locations_updated_at ON bin_locations;
    CREATE TRIGGER update_bin_locations_updated_at
      BEFORE UPDATE ON bin_locations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert some sample data (optional - you can remove this if you don't want sample data)
INSERT INTO bin_locations (bin_code, warehouse, description, status) VALUES
  ('BIN-001', 'Main Warehouse', 'Primary storage bin in main warehouse', 'active'),
  ('BIN-002', 'Main Warehouse', 'Secondary storage bin', 'active'),
  ('A-01-01', 'Main Warehouse', 'Aisle A, Rack 01, Shelf 01', 'active'),
  ('B-01-01', 'Secondary Warehouse', 'Aisle B, Rack 01, Shelf 01', 'active')
ON CONFLICT (bin_code) DO NOTHING;

-- Verify the table was created successfully
SELECT 'Bin locations table created successfully!' AS message,
       COUNT(*) AS sample_records
FROM bin_locations;
