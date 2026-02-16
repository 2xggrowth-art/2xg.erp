// Migration 026: Add damage_type and severity columns to item_damage_reports
const up = `
ALTER TABLE item_damage_reports ADD COLUMN IF NOT EXISTS damage_type VARCHAR(50);
ALTER TABLE item_damage_reports ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
ALTER TABLE item_damage_reports ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

NOTIFY pgrst, 'reload schema';
`;

const down = `
ALTER TABLE item_damage_reports DROP COLUMN IF EXISTS damage_type;
ALTER TABLE item_damage_reports DROP COLUMN IF EXISTS severity;
ALTER TABLE item_damage_reports DROP COLUMN IF EXISTS quantity;
`;

module.exports = { up, down };
