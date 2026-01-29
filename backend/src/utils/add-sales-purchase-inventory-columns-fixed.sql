-- Migration: Add Sales Information, Purchase Information, and Inventory Tracking columns
-- Run this in your Supabase SQL Editor

-- =====================================================
-- CREATE SUPPLIERS TABLE FIRST (if it doesn't exist)
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  credit_limit DECIMAL(12, 2),
  current_balance DECIMAL(12, 2) DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- =====================================================
-- SALES INFORMATION COLUMNS
-- =====================================================

-- Add is_sellable column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='is_sellable') THEN
        ALTER TABLE items ADD COLUMN is_sellable BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add selling_price column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='selling_price') THEN
        ALTER TABLE items ADD COLUMN selling_price DECIMAL(12, 2);
    END IF;
END $$;

-- Add sales_account column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='sales_account') THEN
        ALTER TABLE items ADD COLUMN sales_account TEXT;
    END IF;
END $$;

-- Add sales_description column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='sales_description') THEN
        ALTER TABLE items ADD COLUMN sales_description TEXT;
    END IF;
END $$;

-- =====================================================
-- PURCHASE INFORMATION COLUMNS
-- =====================================================

-- Add is_purchasable column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='is_purchasable') THEN
        ALTER TABLE items ADD COLUMN is_purchasable BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add purchase_account column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='purchase_account') THEN
        ALTER TABLE items ADD COLUMN purchase_account TEXT;
    END IF;
END $$;

-- Add purchase_description column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='purchase_description') THEN
        ALTER TABLE items ADD COLUMN purchase_description TEXT;
    END IF;
END $$;

-- Add preferred_vendor_id column (foreign key to suppliers table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='preferred_vendor_id') THEN
        ALTER TABLE items ADD COLUMN preferred_vendor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- INVENTORY TRACKING COLUMNS
-- =====================================================

-- Add track_inventory column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='track_inventory') THEN
        ALTER TABLE items ADD COLUMN track_inventory BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add track_bin_location column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='track_bin_location') THEN
        ALTER TABLE items ADD COLUMN track_bin_location BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add advanced_tracking_type column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='advanced_tracking_type') THEN
        ALTER TABLE items ADD COLUMN advanced_tracking_type TEXT CHECK (advanced_tracking_type IN ('none', 'serial', 'batch'));
    END IF;
END $$;

-- Add inventory_account column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='inventory_account') THEN
        ALTER TABLE items ADD COLUMN inventory_account TEXT;
    END IF;
END $$;

-- Add valuation_method column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='items' AND column_name='valuation_method') THEN
        ALTER TABLE items ADD COLUMN valuation_method TEXT CHECK (valuation_method IN ('FIFO', 'LIFO', 'Weighted Average'));
    END IF;
END $$;

-- =====================================================
-- CREATE INDEX FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_items_preferred_vendor ON items(preferred_vendor_id);
CREATE INDEX IF NOT EXISTS idx_items_sellable ON items(is_sellable);
CREATE INDEX IF NOT EXISTS idx_items_purchasable ON items(is_purchasable);
CREATE INDEX IF NOT EXISTS idx_items_track_inventory ON items(track_inventory);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all columns were added successfully:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'items'
-- ORDER BY ordinal_position;
