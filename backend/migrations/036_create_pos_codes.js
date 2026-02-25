const up = `
CREATE TABLE IF NOT EXISTS pos_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  employee_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_codes_code ON pos_codes(code) WHERE is_active = true;
NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP INDEX IF EXISTS idx_pos_codes_code;
DROP TABLE IF EXISTS pos_codes;
NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
