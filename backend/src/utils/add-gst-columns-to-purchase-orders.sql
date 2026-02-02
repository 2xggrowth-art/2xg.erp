-- Migration: Add GST columns to purchase_orders table
-- Run this in your Supabase SQL Editor

-- =====================================================
-- ADD GST COLUMNS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='cgst_rate') THEN
        ALTER TABLE purchase_orders ADD COLUMN cgst_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='cgst_amount') THEN
        ALTER TABLE purchase_orders ADD COLUMN cgst_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='sgst_rate') THEN
        ALTER TABLE purchase_orders ADD COLUMN sgst_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='sgst_amount') THEN
        ALTER TABLE purchase_orders ADD COLUMN sgst_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='igst_rate') THEN
        ALTER TABLE purchase_orders ADD COLUMN igst_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='igst_amount') THEN
        ALTER TABLE purchase_orders ADD COLUMN igst_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
