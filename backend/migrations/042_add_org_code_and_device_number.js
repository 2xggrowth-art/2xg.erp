const up = `
  ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS org_code VARCHAR(10);

  COMMENT ON COLUMN org_settings.org_code IS 'Short organization code used as prefix for invoice/session numbers (e.g. BCH, MBK)';

  ALTER TABLE registers
  ADD COLUMN IF NOT EXISTS device_number INTEGER;

  COMMENT ON COLUMN registers.device_number IS 'Auto-incrementing device number per org, used for unique invoice/session prefixes per POS device';

  NOTIFY pgrst, 'reload schema';
`;

const down = `
  ALTER TABLE org_settings
  DROP COLUMN IF EXISTS org_code;

  ALTER TABLE registers
  DROP COLUMN IF EXISTS device_number;

  NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
