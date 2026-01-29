-- =====================================================
-- 2XG Dashboard - Authentication System Update
-- Execute this in your Supabase SQL Editor
-- This script only adds/updates the users table and auth-related components
-- It won't affect your existing tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function for updating updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- USERS TABLE (Authentication)
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('Admin', 'Manager', 'Staff', 'Viewer')) DEFAULT 'Staff',
  status TEXT CHECK (status IN ('Active', 'Inactive', 'Suspended')) DEFAULT 'Active',
  phone TEXT,
  department TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for users table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- INSERT DEFAULT USERS
-- =====================================================

-- Default admin users (password: admin123)
-- Password hashes are bcrypt hashes of "admin123" (10 salt rounds)
INSERT INTO users (name, email, password_hash, role, status) VALUES
  ('Zaheer', 'mohd.zaheer@gmail.com', '$2b$10$8qAw59mSDPlL93iBxrQCleMpsFQhXdqRQcbSYKkCR3B9Rey5KmYGS', 'Admin', 'Active'),
  ('Rahul Kumar', 'rahul@gmail.com', '$2b$10$e3kUYa4W6qZIrOg1gSQJgeWIe8GEBUbbfmBlWWyppUphXV9kSOj3W', 'Manager', 'Active')
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      updated_at = NOW();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show created users
SELECT
  id,
  name,
  email,
  role,
  status,
  created_at
FROM users
ORDER BY created_at DESC;
