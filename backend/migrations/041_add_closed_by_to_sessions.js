const up = `
  ALTER TABLE pos_sessions
  ADD COLUMN IF NOT EXISTS closed_by VARCHAR(255);

  COMMENT ON COLUMN pos_sessions.closed_by IS 'Name of the user who closed the session';

  NOTIFY pgrst, 'reload schema';
`;

const down = `
  ALTER TABLE pos_sessions
  DROP COLUMN IF EXISTS closed_by;

  NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
