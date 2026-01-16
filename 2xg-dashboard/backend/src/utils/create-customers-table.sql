-- Customers Management Module Database Schema
-- Created: 2026-01-16
-- Similar structure to suppliers table but for customers

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,

    -- Customer Details
    customer_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_person VARCHAR(255),

    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    work_phone VARCHAR(50),

    -- Address Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),

    -- Business Information
    gst_treatment VARCHAR(50),
    gstin VARCHAR(50),
    pan VARCHAR(50),
    tax_id VARCHAR(50),
    source_of_supply VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'INR',

    -- Financial Information
    payment_terms VARCHAR(100) DEFAULT 'Due on Receipt',
    credit_limit DECIMAL(15, 2),
    current_balance DECIMAL(15, 2) DEFAULT 0,

    -- Additional Information
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);

-- =============================================
-- UPDATE TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE customers IS 'Stores customer information for sales transactions';
COMMENT ON COLUMN customers.customer_name IS 'Primary display name for the customer';
COMMENT ON COLUMN customers.current_balance IS 'Outstanding balance (receivables)';
COMMENT ON COLUMN customers.payment_terms IS 'Default payment terms for this customer';
