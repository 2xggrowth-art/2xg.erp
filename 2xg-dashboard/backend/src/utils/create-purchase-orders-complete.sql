-- Complete Purchase Orders Setup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CREATE BASE PURCHASE_ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_phone TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'received', 'billed', 'cancelled')),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  shipping_cost DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE PURCHASE_ORDER_ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ADD INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_po_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id);

-- =====================================================
-- 4. CREATE TRIGGER
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_purchase_orders_updated_at'
    ) THEN
        CREATE TRIGGER update_purchase_orders_updated_at
        BEFORE UPDATE ON purchase_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 5. ADD NEW COLUMNS TO PURCHASE_ORDERS
-- =====================================================

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
                   WHERE table_name='purchase_orders' AND column_name='discount_amount') THEN
        ALTER TABLE purchase_orders ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0;
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
-- 6. ADD NEW COLUMNS TO PURCHASE_ORDER_ITEMS
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
-- 7. CREATE LOCATIONS TABLE (if not exists)
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
-- 8. INSERT SAMPLE LOCATION (for testing)
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
-- VERIFICATION
-- =====================================================
-- Run this query to verify all columns exist:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'purchase_orders'
-- ORDER BY ordinal_position;
