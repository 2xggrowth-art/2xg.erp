/**
 * Migration 012: Add pos_session_id column to invoices
 * Links POS invoices to the session they were created in.
 */

module.exports = {
  up: `
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS pos_session_id UUID DEFAULT NULL;

    NOTIFY pgrst, 'reload schema';
  `,
  down: `
    ALTER TABLE invoices
    DROP COLUMN IF EXISTS pos_session_id;

    NOTIFY pgrst, 'reload schema';
  `
};
