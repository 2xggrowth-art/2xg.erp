/**
 * Migration 009: Create transfer_order_allocations table
 * Tracks actual stock movements when transfer orders are initiated.
 */

module.exports = {
  up: `
    CREATE TABLE IF NOT EXISTS transfer_order_allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
      transfer_order_item_id UUID REFERENCES transfer_order_items(id) ON DELETE CASCADE,
      item_id UUID NOT NULL,
      source_bin_location_id UUID NOT NULL REFERENCES bin_locations(id),
      destination_bin_location_id UUID NOT NULL REFERENCES bin_locations(id),
      quantity DECIMAL(15, 2) NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_toa_transfer_order ON transfer_order_allocations(transfer_order_id);
    CREATE INDEX IF NOT EXISTS idx_toa_item ON transfer_order_allocations(item_id);
    CREATE INDEX IF NOT EXISTS idx_toa_source_bin ON transfer_order_allocations(source_bin_location_id);
    CREATE INDEX IF NOT EXISTS idx_toa_dest_bin ON transfer_order_allocations(destination_bin_location_id);

    NOTIFY pgrst, 'reload schema';
  `,
  down: `
    DROP TABLE IF EXISTS transfer_order_allocations CASCADE;
    NOTIFY pgrst, 'reload schema';
  `
};
