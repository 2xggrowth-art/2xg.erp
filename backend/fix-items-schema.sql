-- Fix items table schema - Add missing 'name' column if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if 'name' column exists, if not add it
DO $$
BEGIN
    -- Try to add 'name' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'name'
    ) THEN
        -- Add 'name' column
        ALTER TABLE items ADD COLUMN name TEXT;

        -- Copy data from 'item_name' if that column exists
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'items'
            AND column_name = 'item_name'
        ) THEN
            UPDATE items SET name = item_name WHERE name IS NULL;
        END IF;

        -- Make it NOT NULL after copying data
        ALTER TABLE items ALTER COLUMN name SET NOT NULL;

        RAISE NOTICE 'Added name column to items table';
    END IF;

    -- Also ensure other required columns exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE items ADD COLUMN type TEXT CHECK (type IN ('goods', 'service')) DEFAULT 'goods';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'unit'
    ) THEN
        ALTER TABLE items ADD COLUMN unit TEXT DEFAULT 'pcs';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'selling_price'
    ) THEN
        ALTER TABLE items ADD COLUMN selling_price DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'cost_price'
    ) THEN
        ALTER TABLE items ADD COLUMN cost_price DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'opening_stock'
    ) THEN
        ALTER TABLE items ADD COLUMN opening_stock INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE items ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE items ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'reorder_point'
    ) THEN
        ALTER TABLE items ADD COLUMN reorder_point INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'preferred_vendor_id'
    ) THEN
        ALTER TABLE items ADD COLUMN preferred_vendor_id UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'sales_account'
    ) THEN
        ALTER TABLE items ADD COLUMN sales_account TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'purchase_account'
    ) THEN
        ALTER TABLE items ADD COLUMN purchase_account TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'inventory_account'
    ) THEN
        ALTER TABLE items ADD COLUMN inventory_account TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'tax_preference'
    ) THEN
        ALTER TABLE items ADD COLUMN tax_preference TEXT DEFAULT 'taxable';
    END IF;

END $$;

-- Verify the columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'items'
ORDER BY ordinal_position;
