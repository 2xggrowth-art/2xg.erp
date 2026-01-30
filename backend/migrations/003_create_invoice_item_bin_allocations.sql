-- =====================================================
-- Invoice Item Bin Allocations Table Migration
-- Run this in your Supabase SQL Editor
-- This creates the invoice_item_bin_allocations table to track
-- which bins items are sold from (deducted from) during sales
-- =====================================================

-- Create invoice_item_bin_allocations table
CREATE TABLE IF NOT EXISTS invoice_item_bin_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_item_id UUID NOT NULL,
  bin_location_id UUID NOT NULL REFERENCES bin_locations(id) ON DELETE RESTRICT,
  quantity DECIMAL(15, 2) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key to invoice_items (not enforced in case invoice_items doesn't exist yet)
  CONSTRAINT fk_invoice_item
    FOREIGN KEY (invoice_item_id)
    REFERENCES invoice_items(id)
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_item_bin_allocations_invoice_item
  ON invoice_item_bin_allocations(invoice_item_id);

CREATE INDEX IF NOT EXISTS idx_invoice_item_bin_allocations_bin_location
  ON invoice_item_bin_allocations(bin_location_id);

-- Create trigger to auto-update the updated_at timestamp
DROP TRIGGER IF EXISTS update_invoice_item_bin_allocations_updated_at
  ON invoice_item_bin_allocations;

CREATE TRIGGER update_invoice_item_bin_allocations_updated_at
  BEFORE UPDATE ON invoice_item_bin_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE invoice_item_bin_allocations IS
  'Tracks which bin locations items are sold from during invoice/sales transactions';

COMMENT ON COLUMN invoice_item_bin_allocations.invoice_item_id IS
  'Reference to the invoice item being sold';

COMMENT ON COLUMN invoice_item_bin_allocations.bin_location_id IS
  'Reference to the bin location items are deducted from';

COMMENT ON COLUMN invoice_item_bin_allocations.quantity IS
  'Quantity deducted from this bin location';

-- Verify the table was created successfully
SELECT 'Invoice item bin allocations table created successfully!' AS message;
