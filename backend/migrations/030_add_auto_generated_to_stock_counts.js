const up = `
ALTER TABLE stock_counts ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_stock_counts_bin_date ON stock_counts(bin_location_id, due_date);
CREATE INDEX IF NOT EXISTS idx_stock_counts_due_unassigned ON stock_counts(due_date, status) WHERE assigned_to IS NULL;
NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP INDEX IF EXISTS idx_stock_counts_due_unassigned;
DROP INDEX IF EXISTS idx_stock_counts_bin_date;
ALTER TABLE stock_counts DROP COLUMN IF EXISTS auto_generated;
NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
