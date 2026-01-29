-- 2XG Dashboard Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '2XG',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. PRODUCT CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_org ON product_categories(organization_id);

-- =====================================================
-- 3. SALES TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_amount DECIMAL(12, 2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('paid', 'partial', 'overdue')) DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_date ON sales_transactions(transaction_date DESC);
CREATE INDEX idx_sales_category ON sales_transactions(category_id);
CREATE INDEX idx_sales_org ON sales_transactions(organization_id);
CREATE INDEX idx_sales_payment_status ON sales_transactions(payment_status);

-- =====================================================
-- 4. INVENTORY ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  current_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 10,
  unit_price DECIMAL(10, 2),
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_stock ON inventory_items(current_stock, reorder_point);
CREATE INDEX idx_inventory_sales ON inventory_items(sales_count DESC);
CREATE INDEX idx_inventory_org ON inventory_items(organization_id);

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. SHIPMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  shipment_number TEXT UNIQUE NOT NULL,
  shipment_type TEXT CHECK (shipment_type IN ('regular', 'spare')) DEFAULT 'regular',
  status TEXT CHECK (status IN ('pending', 'received')) DEFAULT 'pending',
  expected_date DATE,
  received_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_type ON shipments(shipment_type);
CREATE INDEX idx_shipments_org ON shipments(organization_id);

-- =====================================================
-- 6. DELIVERIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  delivery_number TEXT UNIQUE NOT NULL,
  delivery_type TEXT CHECK (delivery_type IN ('cycle_delivered', 'pickup_pending', 'pickup_cleared', 'outside_delivery')) NOT NULL,
  delivery_date DATE,
  customer_name TEXT,
  address TEXT,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deliveries_type ON deliveries(delivery_type);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_org ON deliveries(organization_id);

-- =====================================================
-- 7. SERVICE TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  issue_category TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  raised_date DATE NOT NULL,
  resolved_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_category ON service_tickets(issue_category);
CREATE INDEX idx_tickets_date ON service_tickets(raised_date DESC);
CREATE INDEX idx_tickets_status ON service_tickets(status);
CREATE INDEX idx_tickets_org ON service_tickets(organization_id);

-- =====================================================
-- 8. CRM LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  lead_source TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')) DEFAULT 'new',
  expected_value DECIMAL(10, 2),
  lead_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON crm_leads(status);
CREATE INDEX idx_leads_date ON crm_leads(lead_date DESC);
CREATE INDEX idx_leads_org ON crm_leads(organization_id);

-- =====================================================
-- INSERT DEFAULT ORGANIZATION
-- =====================================================
INSERT INTO organizations (name, logo_url)
VALUES ('2XG', '/logo.png')
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS (if needed for RLS)
-- =====================================================
-- Note: Since we're using service role key, RLS is bypassed
-- But if you want to enable RLS later, you can add policies here
