-- Enhancement: Add missing columns to purchase_orders and purchase_order_items tables
-- Run this in your Supabase SQL Editor

-- =====================================================
-- ENHANCE PURCHASE_ORDERS TABLE
-- =====================================================

-- Add missing columns to purchase_orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='location_id') THEN
        ALTER TABLE purchase_orders ADD COLUMN location_id UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='delivery_address_type') THEN
        ALTER TABLE purchase_orders ADD COLUMN delivery_address_type TEXT DEFAULT 'location';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='delivery_address') THEN
        ALTER TABLE purchase_orders ADD COLUMN delivery_address TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='discount_type') THEN
        ALTER TABLE purchase_orders ADD COLUMN discount_type TEXT DEFAULT 'percentage';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='discount_value') THEN
        ALTER TABLE purchase_orders ADD COLUMN discount_value DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='adjustment') THEN
        ALTER TABLE purchase_orders ADD COLUMN adjustment DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='tds_tcs_type') THEN
        ALTER TABLE purchase_orders ADD COLUMN tds_tcs_type TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='tds_tcs_rate') THEN
        ALTER TABLE purchase_orders ADD COLUMN tds_tcs_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='tds_tcs_amount') THEN
        ALTER TABLE purchase_orders ADD COLUMN tds_tcs_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='attachment_urls') THEN
        ALTER TABLE purchase_orders ADD COLUMN attachment_urls TEXT[];
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_orders' AND column_name='auto_po_number') THEN
        ALTER TABLE purchase_orders ADD COLUMN auto_po_number BOOLEAN DEFAULT true;
    END IF;
END $$;

-- =====================================================
-- ENHANCE PURCHASE_ORDER_ITEMS TABLE
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_order_items' AND column_name='account') THEN
        ALTER TABLE purchase_order_items ADD COLUMN account TEXT DEFAULT 'Cost of Goods Sold';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_order_items' AND column_name='description') THEN
        ALTER TABLE purchase_order_items ADD COLUMN description TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='purchase_order_items' AND column_name='unit_of_measurement') THEN
        ALTER TABLE purchase_order_items ADD COLUMN unit_of_measurement TEXT DEFAULT 'pcs';
    END IF;
END $$;

-- =====================================================
-- CREATE LOCATIONS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_locations_updated_at'
    ) THEN
        CREATE TRIGGER update_locations_updated_at
        BEFORE UPDATE ON locations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- INSERT SAMPLE LOCATION (for testing)
-- =====================================================

INSERT INTO locations (organization_id, name, address, city, state, country, postal_code)
SELECT
  id,
  'Head Office',
  'Karnataka',
  'Bangalore',
  'Karnataka',
  'India',
  '560001'
FROM organizations
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all columns were added successfully:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'purchase_orders'
-- ORDER BY ordinal_position;
