-- Migration: Add Order Details and Receipt Details fields to purchase_orders
-- Run this in your Supabase SQL Editor
-- SCRUM-53: Replace Notes field with Order Details and Receipt Details

-- =====================================================
-- ADD ORDER DETAILS COLUMNS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='payment_terms') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_terms TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='other_references') THEN
        ALTER TABLE purchase_orders ADD COLUMN other_references TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='terms_of_delivery') THEN
        ALTER TABLE purchase_orders ADD COLUMN terms_of_delivery TEXT;
    END IF;
END $$;

-- =====================================================
-- ADD RECEIPT DETAILS COLUMNS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='dispatch_through') THEN
        ALTER TABLE purchase_orders ADD COLUMN dispatch_through TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='destination') THEN
        ALTER TABLE purchase_orders ADD COLUMN destination TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='carrier_name_agent') THEN
        ALTER TABLE purchase_orders ADD COLUMN carrier_name_agent TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='bill_of_lading_no') THEN
        ALTER TABLE purchase_orders ADD COLUMN bill_of_lading_no TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='bill_of_lading_date') THEN
        ALTER TABLE purchase_orders ADD COLUMN bill_of_lading_date DATE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='motor_vehicle_no') THEN
        ALTER TABLE purchase_orders ADD COLUMN motor_vehicle_no TEXT;
    END IF;
END $$;

-- =====================================================
-- OPTIONAL: DROP NOTES COLUMN (uncomment if desired)
-- =====================================================
-- Note: Keep the notes column for backward compatibility
-- You can drop it later once migration is complete
-- ALTER TABLE purchase_orders DROP COLUMN IF EXISTS notes;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this query to verify all columns exist:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'purchase_orders'
-- AND column_name IN (
--   'payment_terms', 'other_references', 'terms_of_delivery',
--   'dispatch_through', 'destination', 'carrier_name_agent',
--   'bill_of_lading_no', 'bill_of_lading_date', 'motor_vehicle_no'
-- )
-- ORDER BY column_name;
