const up = `
  ALTER TABLE pos_sessions
  ADD COLUMN IF NOT EXISTS denomination_data JSONB DEFAULT '[]'::jsonb;

  COMMENT ON COLUMN pos_sessions.denomination_data IS 'Cash denomination breakdown at session close. Format: [{"note": 500, "count": 10, "total": 5000}, ...]';

  NOTIFY pgrst, 'reload schema';
`;

const down = `
  ALTER TABLE pos_sessions
  DROP COLUMN IF EXISTS denomination_data;

  NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
