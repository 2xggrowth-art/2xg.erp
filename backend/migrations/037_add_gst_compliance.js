/**
 * Migration 037: Add GST Compliance columns to all transaction tables
 *
 * Adds: CGST/SGST/IGST fields to invoices, bills, invoice_items, bill_items
 *        GSTIN to suppliers, place_of_supply, reverse_charge, hsn on line items
 *        GST settings table, delivery challan GST fields
 */

const up = `
-- ============================================
-- 1. INVOICES: Add GST breakdown columns
-- ============================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cess_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(50),
  ADD COLUMN IF NOT EXISTS supply_type VARCHAR(20) DEFAULT 'intra_state',
  ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS irn VARCHAR(64),
  ADD COLUMN IF NOT EXISTS irn_ack_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS irn_ack_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS irn_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS eway_bill_number VARCHAR(15),
  ADD COLUMN IF NOT EXISTS itc_eligible BOOLEAN DEFAULT true;

-- ============================================
-- 2. INVOICE_ITEMS: Add per-item GST fields
-- ============================================
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(8),
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cess_amount DECIMAL(15,2) DEFAULT 0;

-- ============================================
-- 3. BILLS: Add GST breakdown columns
-- ============================================
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cess_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(50),
  ADD COLUMN IF NOT EXISTS supply_type VARCHAR(20) DEFAULT 'intra_state',
  ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vendor_gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS tds_tcs_type VARCHAR(5),
  ADD COLUMN IF NOT EXISTS tds_tcs_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_tcs_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS itc_eligible BOOLEAN DEFAULT true;

-- ============================================
-- 4. BILL_ITEMS: Add per-item GST fields
-- ============================================
ALTER TABLE bill_items
  ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(8),
  ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cess_amount DECIMAL(15,2) DEFAULT 0;

-- ============================================
-- 5. SUPPLIERS: Add GSTIN and GST treatment
-- ============================================
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS gst_treatment VARCHAR(30) DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS reverse_charge_applicable BOOLEAN DEFAULT false;

-- ============================================
-- 6. CUSTOMERS: Add GST treatment & state code
-- ============================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS gst_treatment VARCHAR(30) DEFAULT 'consumer',
  ADD COLUMN IF NOT EXISTS state_code VARCHAR(2);

-- ============================================
-- 7. DELIVERY_CHALLANS: Add GST & E-Way fields
-- ============================================
ALTER TABLE delivery_challans
  ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS supplier_gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS eway_bill_number VARCHAR(15),
  ADD COLUMN IF NOT EXISTS eway_bill_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(15),
  ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(20);

-- ============================================
-- 8. GST SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gst_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_gstin VARCHAR(15) NOT NULL,
  registered_state VARCHAR(50) NOT NULL DEFAULT 'Karnataka',
  state_code VARCHAR(2) NOT NULL DEFAULT '29',
  gst_registration_type VARCHAR(20) NOT NULL DEFAULT 'regular',
  financial_year_start INTEGER DEFAULT 4,
  e_invoice_enabled BOOLEAN DEFAULT false,
  e_invoice_username VARCHAR(100),
  e_invoice_password VARCHAR(255),
  eway_bill_enabled BOOLEAN DEFAULT false,
  composition_rate DECIMAL(5,2) DEFAULT 0,
  company_name VARCHAR(255),
  company_address TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO gst_settings (company_gstin, registered_state, state_code, company_name)
VALUES ('29AMVPI3949R1ZQ', 'Karnataka', '29', 'BHARAT CYCLE HUB')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. NOTIFY PostgREST to reload schema
-- ============================================
NOTIFY pgrst, 'reload schema';
`;

const down = `
-- Reverse GST settings
DROP TABLE IF EXISTS gst_settings;

-- Remove delivery challan GST columns
ALTER TABLE delivery_challans
  DROP COLUMN IF EXISTS customer_gstin,
  DROP COLUMN IF EXISTS supplier_gstin,
  DROP COLUMN IF EXISTS eway_bill_number,
  DROP COLUMN IF EXISTS eway_bill_date,
  DROP COLUMN IF EXISTS vehicle_number,
  DROP COLUMN IF EXISTS transport_mode;

-- Remove customer GST columns
ALTER TABLE customers
  DROP COLUMN IF EXISTS gst_treatment,
  DROP COLUMN IF EXISTS state_code;

-- Remove supplier GST columns
ALTER TABLE suppliers
  DROP COLUMN IF EXISTS gstin,
  DROP COLUMN IF EXISTS gst_treatment,
  DROP COLUMN IF EXISTS reverse_charge_applicable;

-- Remove bill_items GST columns
ALTER TABLE bill_items
  DROP COLUMN IF EXISTS hsn_code,
  DROP COLUMN IF EXISTS cgst_rate,
  DROP COLUMN IF EXISTS cgst_amount,
  DROP COLUMN IF EXISTS sgst_rate,
  DROP COLUMN IF EXISTS sgst_amount,
  DROP COLUMN IF EXISTS igst_rate,
  DROP COLUMN IF EXISTS igst_amount,
  DROP COLUMN IF EXISTS cess_amount;

-- Remove bills GST columns
ALTER TABLE bills
  DROP COLUMN IF EXISTS cgst_rate,
  DROP COLUMN IF EXISTS cgst_amount,
  DROP COLUMN IF EXISTS sgst_rate,
  DROP COLUMN IF EXISTS sgst_amount,
  DROP COLUMN IF EXISTS igst_rate,
  DROP COLUMN IF EXISTS igst_amount,
  DROP COLUMN IF EXISTS cess_amount,
  DROP COLUMN IF EXISTS place_of_supply,
  DROP COLUMN IF EXISTS supply_type,
  DROP COLUMN IF EXISTS reverse_charge,
  DROP COLUMN IF EXISTS vendor_gstin,
  DROP COLUMN IF EXISTS tds_tcs_type,
  DROP COLUMN IF EXISTS tds_tcs_rate,
  DROP COLUMN IF EXISTS tds_tcs_amount,
  DROP COLUMN IF EXISTS itc_eligible;

-- Remove invoice_items GST columns
ALTER TABLE invoice_items
  DROP COLUMN IF EXISTS hsn_code,
  DROP COLUMN IF EXISTS tax_rate,
  DROP COLUMN IF EXISTS cgst_rate,
  DROP COLUMN IF EXISTS cgst_amount,
  DROP COLUMN IF EXISTS sgst_rate,
  DROP COLUMN IF EXISTS sgst_amount,
  DROP COLUMN IF EXISTS igst_rate,
  DROP COLUMN IF EXISTS igst_amount,
  DROP COLUMN IF EXISTS cess_amount;

-- Remove invoices GST columns
ALTER TABLE invoices
  DROP COLUMN IF EXISTS cgst_rate,
  DROP COLUMN IF EXISTS cgst_amount,
  DROP COLUMN IF EXISTS sgst_rate,
  DROP COLUMN IF EXISTS sgst_amount,
  DROP COLUMN IF EXISTS igst_rate,
  DROP COLUMN IF EXISTS igst_amount,
  DROP COLUMN IF EXISTS cess_amount,
  DROP COLUMN IF EXISTS place_of_supply,
  DROP COLUMN IF EXISTS supply_type,
  DROP COLUMN IF EXISTS reverse_charge,
  DROP COLUMN IF EXISTS customer_gstin,
  DROP COLUMN IF EXISTS irn,
  DROP COLUMN IF EXISTS irn_ack_number,
  DROP COLUMN IF EXISTS irn_ack_date,
  DROP COLUMN IF EXISTS irn_status,
  DROP COLUMN IF EXISTS eway_bill_number,
  DROP COLUMN IF EXISTS itc_eligible;

NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
