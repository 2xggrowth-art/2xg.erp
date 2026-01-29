-- Migration: Add missing columns to items table
-- Run this if your items table already exists but is missing some columns

-- Add brand column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='brand') THEN
        ALTER TABLE items ADD COLUMN brand TEXT;
    END IF;
END $$;

-- Add hsn_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='hsn_code') THEN
        ALTER TABLE items ADD COLUMN hsn_code TEXT;
    END IF;
END $$;

-- Add upc column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='upc') THEN
        ALTER TABLE items ADD COLUMN upc TEXT;
    END IF;
END $$;

-- Add mpn column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='mpn') THEN
        ALTER TABLE items ADD COLUMN mpn TEXT;
    END IF;
END $$;

-- Add ean column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='ean') THEN
        ALTER TABLE items ADD COLUMN ean TEXT;
    END IF;
END $$;

-- Add isbn column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='isbn') THEN
        ALTER TABLE items ADD COLUMN isbn TEXT;
    END IF;
END $$;

-- Add is_returnable column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='is_returnable') THEN
        ALTER TABLE items ADD COLUMN is_returnable BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
