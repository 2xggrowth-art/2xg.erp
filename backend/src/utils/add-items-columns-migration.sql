-- Migration: Add missing columns to items table
-- Run this in Supabase SQL Editor to fix "Could not find the 'brand' column" error
-- Date: 2026-02-03

-- Add all missing columns that the items service expects
-- Using IF NOT EXISTS pattern via DO block for safety

DO $$
BEGIN
    -- Basic item fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'brand') THEN
        ALTER TABLE items ADD COLUMN brand TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'tax_rate') THEN
        ALTER TABLE items ADD COLUMN tax_rate DECIMAL(5, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'hsn_code') THEN
        ALTER TABLE items ADD COLUMN hsn_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'upc') THEN
        ALTER TABLE items ADD COLUMN upc TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'mpn') THEN
        ALTER TABLE items ADD COLUMN mpn TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'ean') THEN
        ALTER TABLE items ADD COLUMN ean TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'isbn') THEN
        ALTER TABLE items ADD COLUMN isbn TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'is_returnable') THEN
        ALTER TABLE items ADD COLUMN is_returnable BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'image_url') THEN
        ALTER TABLE items ADD COLUMN image_url TEXT;
    END IF;

    -- Sales Information fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'is_sellable') THEN
        ALTER TABLE items ADD COLUMN is_sellable BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'selling_price') THEN
        ALTER TABLE items ADD COLUMN selling_price DECIMAL(12, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'sales_account') THEN
        ALTER TABLE items ADD COLUMN sales_account TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'sales_description') THEN
        ALTER TABLE items ADD COLUMN sales_description TEXT;
    END IF;

    -- Purchase Information fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'is_purchasable') THEN
        ALTER TABLE items ADD COLUMN is_purchasable BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'purchase_account') THEN
        ALTER TABLE items ADD COLUMN purchase_account TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'purchase_description') THEN
        ALTER TABLE items ADD COLUMN purchase_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'preferred_vendor_id') THEN
        ALTER TABLE items ADD COLUMN preferred_vendor_id UUID;
    END IF;

    -- Inventory Tracking fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'track_inventory') THEN
        ALTER TABLE items ADD COLUMN track_inventory BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'track_bin_location') THEN
        ALTER TABLE items ADD COLUMN track_bin_location BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'advanced_tracking_type') THEN
        ALTER TABLE items ADD COLUMN advanced_tracking_type TEXT DEFAULT 'none';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'inventory_account') THEN
        ALTER TABLE items ADD COLUMN inventory_account TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'valuation_method') THEN
        ALTER TABLE items ADD COLUMN valuation_method TEXT;
    END IF;

    -- Other fields that may be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'max_stock') THEN
        ALTER TABLE items ADD COLUMN max_stock INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'weight') THEN
        ALTER TABLE items ADD COLUMN weight DECIMAL(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'dimensions') THEN
        ALTER TABLE items ADD COLUMN dimensions TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'manufacturer') THEN
        ALTER TABLE items ADD COLUMN manufacturer TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'barcode') THEN
        ALTER TABLE items ADD COLUMN barcode TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'description') THEN
        ALTER TABLE items ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'supplier_id') THEN
        ALTER TABLE items ADD COLUMN supplier_id UUID;
    END IF;

END $$;

-- Reload PostgREST schema cache to pick up new columns
NOTIFY pgrst, 'reload schema';

-- Verify the columns were added (optional - run separately to check)
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'items'
-- ORDER BY ordinal_position;
