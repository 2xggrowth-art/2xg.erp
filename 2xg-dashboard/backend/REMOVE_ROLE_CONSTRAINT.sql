-- =====================================================
-- Remove Role CHECK Constraint to Allow Custom Roles
-- Execute this in your Supabase SQL Editor
-- =====================================================

-- Drop the existing CHECK constraint on the role column
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

-- The role column will now accept any text value
-- This allows custom roles created in the frontend to work
-- Default remains 'Staff' for backward compatibility

-- Verify the change
SELECT
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- Test: Try to insert a user with a custom role (optional verification)
-- This should now work without errors
-- DELETE FROM users WHERE email = 'test-custom-role@example.com';
-- INSERT INTO users (name, email, password_hash, role, status)
-- VALUES ('Test User', 'test-custom-role@example.com', 'dummy-hash', 'billing', 'Active');
