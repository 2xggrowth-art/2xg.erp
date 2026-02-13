/**
 * Migration 022: Add serial_number column to stock_count_items
 *
 * For serial-tracked items, each serial number becomes a separate
 * stock_count_item with expected_quantity = 1
 */

const up = `
-- Add serial_number column to stock_count_items
ALTER TABLE stock_count_items
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);

-- Add index for serial number lookups
CREATE INDEX IF NOT EXISTS idx_stock_count_items_serial
ON stock_count_items(serial_number) WHERE serial_number IS NOT NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP INDEX IF EXISTS idx_stock_count_items_serial;
ALTER TABLE stock_count_items DROP COLUMN IF EXISTS serial_number;
NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
