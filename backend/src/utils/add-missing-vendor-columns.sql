-- Add missing columns to suppliers table for vendor management
-- Run this in your Supabase SQL Editor

-- Add company_name column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='company_name') THEN
        ALTER TABLE suppliers ADD COLUMN company_name TEXT;
    END IF;
END $$;

-- Add work_phone column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='work_phone') THEN
        ALTER TABLE suppliers ADD COLUMN work_phone TEXT;
    END IF;
END $$;

-- Add gst_treatment column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='gst_treatment') THEN
        ALTER TABLE suppliers ADD COLUMN gst_treatment TEXT;
    END IF;
END $$;

-- Add gstin column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='gstin') THEN
        ALTER TABLE suppliers ADD COLUMN gstin TEXT;
    END IF;
END $$;

-- Add pan column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='pan') THEN
        ALTER TABLE suppliers ADD COLUMN pan TEXT;
    END IF;
END $$;

-- Add source_of_supply column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='source_of_supply') THEN
        ALTER TABLE suppliers ADD COLUMN source_of_supply TEXT;
    END IF;
END $$;

-- Add currency column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='currency') THEN
        ALTER TABLE suppliers ADD COLUMN currency TEXT DEFAULT 'INR';
    END IF;
END $$;

-- Add is_msme_registered column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='suppliers' AND column_name='is_msme_registered') THEN
        ALTER TABLE suppliers ADD COLUMN is_msme_registered BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'suppliers'
ORDER BY ordinal_position;
