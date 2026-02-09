/**
 * Migration 010: Add serial_numbers column to bill_item_bin_allocations
 * Links specific serial numbers to the bin they were allocated to.
 */

module.exports = {
  up: `
    ALTER TABLE bill_item_bin_allocations
    ADD COLUMN IF NOT EXISTS serial_numbers JSONB DEFAULT '[]'::jsonb;

    NOTIFY pgrst, 'reload schema';
  `,
  down: `
    ALTER TABLE bill_item_bin_allocations
    DROP COLUMN IF EXISTS serial_numbers;

    NOTIFY pgrst, 'reload schema';
  `
};
