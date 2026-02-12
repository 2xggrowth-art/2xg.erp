// Migration: Add role column to mobile_users table
// This enables role-based navigation in the StockCount app (admin vs counter)

const up = `
-- Add role column to mobile_users
ALTER TABLE mobile_users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'counter';

-- Update the admin user to have admin role
UPDATE mobile_users
SET role = 'admin'
WHERE phone_number = '9876543210';

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
`;

const down = `
ALTER TABLE mobile_users DROP COLUMN IF EXISTS role;
NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
