-- Migration: Create Brands and Manufacturers Tables
-- Date: 2026-02-03
-- Purpose: Fix 500 errors on /api/brands and /api/manufacturers endpoints
--
-- HOW TO RUN:
-- 1. Open Supabase Studio → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run" or press Ctrl+Enter
-- 4. Verify: "Success. No rows returned" means it worked

-- Step 1: Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create Manufacturers table FIRST (brands references it)
CREATE TABLE IF NOT EXISTS manufacturers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create Brands table with FK to manufacturers
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brands_manufacturer_id ON brands(manufacturer_id);

-- Step 6: Add triggers for updated_at
DROP TRIGGER IF EXISTS update_manufacturers_updated_at ON manufacturers;
CREATE TRIGGER update_manufacturers_updated_at
  BEFORE UPDATE ON manufacturers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Reload PostgREST schema cache (IMPORTANT!)
NOTIFY pgrst, 'reload schema';

-- Done! The brands and manufacturers endpoints should now work.
