/**
 * Migration 011: Add is_premium_tagged and incentive_type columns to items
 */

module.exports = {
  up: `
    ALTER TABLE items
    ADD COLUMN IF NOT EXISTS is_premium_tagged BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS incentive_type VARCHAR(100) DEFAULT NULL;

    NOTIFY pgrst, 'reload schema';
  `,
  down: `
    ALTER TABLE items
    DROP COLUMN IF EXISTS is_premium_tagged,
    DROP COLUMN IF EXISTS incentive_type;

    NOTIFY pgrst, 'reload schema';
  `
};
