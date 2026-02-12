/**
 * Migration 020: Create Stock Counts Tables
 *
 * Creates tables for the new StockCount app:
 * - stock_counts: Main count task table
 * - stock_count_items: Items to be counted
 *
 * Stock counts are linked to Bills (received goods) for item source.
 * Counters are mobile_users who perform the count.
 * Admins (regular users) review and approve/reject counts.
 */

const up = `
-- Drop old stock count tables if they exist (clean slate)
DROP TABLE IF EXISTS stock_count_items CASCADE;
DROP TABLE IF EXISTS stock_counts CASCADE;
DROP TABLE IF EXISTS putaway_tasks CASCADE;
DROP TABLE IF EXISTS damage_reports CASCADE;

-- Stock Counts table
CREATE TABLE stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_number VARCHAR(50) NOT NULL UNIQUE,

  -- Source: which bill/PO items come from
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  bill_number VARCHAR(50),

  -- Location
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  location_name VARCHAR(255) NOT NULL,
  bin_location_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  bin_code VARCHAR(100),

  -- Assignment
  assigned_to UUID REFERENCES mobile_users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  assigned_by UUID,  -- Regular user (admin) who created the count
  assigned_by_name VARCHAR(255),

  -- Count type: 'delivery' (from bill/PO) or 'audit' (periodic check)
  count_type VARCHAR(20) DEFAULT 'delivery' CHECK (count_type IN ('delivery', 'audit')),

  -- Status flow: pending -> in_progress -> submitted -> approved/rejected/recount
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'recount')),

  -- Stats (updated as items are counted)
  total_items INTEGER DEFAULT 0,
  counted_items INTEGER DEFAULT 0,
  matched_items INTEGER DEFAULT 0,
  mismatched_items INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,

  -- Dates
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_by_name VARCHAR(255),

  -- Notes
  notes TEXT,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Count Items table
CREATE TABLE stock_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,

  -- Item reference
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),

  -- From bill_items
  bill_item_id UUID,

  -- Quantities
  expected_quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
  counted_quantity DECIMAL(15,2),  -- NULL means not yet counted
  variance DECIMAL(15,2) GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,

  -- Status: pending (not counted), counted (matches), mismatch (doesn't match)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'counted', 'mismatch')),

  -- When was this item counted
  counted_at TIMESTAMPTZ,

  -- Notes (e.g., damage found, reason for mismatch)
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stock_counts_assigned_to ON stock_counts(assigned_to);
CREATE INDEX idx_stock_counts_status ON stock_counts(status);
CREATE INDEX idx_stock_counts_bill_id ON stock_counts(bill_id);
CREATE INDEX idx_stock_count_items_stock_count_id ON stock_count_items(stock_count_id);
CREATE INDEX idx_stock_count_items_item_id ON stock_count_items(item_id);

-- Function to auto-update stock count stats
CREATE OR REPLACE FUNCTION update_stock_count_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stock_counts SET
    counted_items = (
      SELECT COUNT(*) FROM stock_count_items
      WHERE stock_count_id = COALESCE(NEW.stock_count_id, OLD.stock_count_id)
      AND counted_quantity IS NOT NULL
    ),
    matched_items = (
      SELECT COUNT(*) FROM stock_count_items
      WHERE stock_count_id = COALESCE(NEW.stock_count_id, OLD.stock_count_id)
      AND status = 'counted'
    ),
    mismatched_items = (
      SELECT COUNT(*) FROM stock_count_items
      WHERE stock_count_id = COALESCE(NEW.stock_count_id, OLD.stock_count_id)
      AND status = 'mismatch'
    ),
    accuracy_percentage = CASE
      WHEN (SELECT COUNT(*) FROM stock_count_items WHERE stock_count_id = COALESCE(NEW.stock_count_id, OLD.stock_count_id) AND counted_quantity IS NOT NULL) = 0
      THEN 0
      ELSE ROUND(
        (SELECT COUNT(*) FROM stock_count_items WHERE stock_count_id = COALESCE(NEW.stock_count_id, OLD.stock_count_id) AND status = 'counted')::DECIMAL * 100 /
        NULLIF((SELECT COUNT(*) FROM stock_count_items WHERE stock_count_id = COALESCE(NEW.stock_count_id, OLD.stock_count_id) AND counted_quantity IS NOT NULL), 0),
        2
      )
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.stock_count_id, OLD.stock_count_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when items are updated
DROP TRIGGER IF EXISTS trigger_update_stock_count_stats ON stock_count_items;
CREATE TRIGGER trigger_update_stock_count_stats
AFTER INSERT OR UPDATE OR DELETE ON stock_count_items
FOR EACH ROW EXECUTE FUNCTION update_stock_count_stats();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP TRIGGER IF EXISTS trigger_update_stock_count_stats ON stock_count_items;
DROP FUNCTION IF EXISTS update_stock_count_stats();
DROP TABLE IF EXISTS stock_count_items CASCADE;
DROP TABLE IF EXISTS stock_counts CASCADE;
NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
