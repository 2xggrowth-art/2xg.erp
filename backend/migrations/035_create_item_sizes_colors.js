// Migration 035: Create item_sizes and item_colors tables

const up = `
CREATE TABLE IF NOT EXISTS item_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP TABLE IF EXISTS item_sizes;
DROP TABLE IF EXISTS item_colors;

NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
