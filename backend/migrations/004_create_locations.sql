-- Migration: Create locations table and add location_id FK to bin_locations
-- Run this in Supabase SQL Editor BEFORE deploying the code changes

-- Step 1: Create the locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 2: Migrate existing warehouse text values into locations table
INSERT INTO locations (name)
SELECT DISTINCT warehouse FROM bin_locations
WHERE warehouse IS NOT NULL AND warehouse != ''
ON CONFLICT (name) DO NOTHING;

-- Step 3: Add location_id FK column to bin_locations
ALTER TABLE bin_locations ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE RESTRICT;

-- Step 4: Backfill location_id from existing warehouse text
UPDATE bin_locations bl
SET location_id = l.id
FROM locations l
WHERE bl.warehouse = l.name;

-- Step 5: Create index on location_id
CREATE INDEX IF NOT EXISTS idx_bin_locations_location_id ON bin_locations(location_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
