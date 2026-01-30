-- =====================================================
-- Bill Item Bin Allocations Table Migration
-- Run this in your Supabase SQL Editor
-- This creates the bill_item_bin_allocations table to track
-- which bins received items from bills
-- =====================================================

-- Create bill_item_bin_allocations table
CREATE TABLE IF NOT EXISTS bill_item_bin_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_item_id UUID NOT NULL,
  bin_location_id UUID NOT NULL REFERENCES bin_locations(id) ON DELETE RESTRICT,
  quantity DECIMAL(15, 2) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key to bill_items (not enforced in case bill_items doesn't exist yet)
  CONSTRAINT fk_bill_item
    FOREIGN KEY (bill_item_id)
    REFERENCES bill_items(id)
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bill_item_bin_allocations_bill_item
  ON bill_item_bin_allocations(bill_item_id);

CREATE INDEX IF NOT EXISTS idx_bill_item_bin_allocations_bin_location
  ON bill_item_bin_allocations(bin_location_id);

-- Create trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bill_item_bin_allocations_updated_at
  ON bill_item_bin_allocations;

CREATE TRIGGER update_bill_item_bin_allocations_updated_at
  BEFORE UPDATE ON bill_item_bin_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE bill_item_bin_allocations IS
  'Tracks the distribution of bill items across different bin locations';

COMMENT ON COLUMN bill_item_bin_allocations.bill_item_id IS
  'Reference to the bill item being allocated';

COMMENT ON COLUMN bill_item_bin_allocations.bin_location_id IS
  'Reference to the bin location receiving the items';

COMMENT ON COLUMN bill_item_bin_allocations.quantity IS
  'Quantity allocated to this bin location';

-- Verify the table was created successfully
SELECT 'Bill item bin allocations table created successfully!' AS message;
