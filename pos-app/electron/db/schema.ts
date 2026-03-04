/**
 * 2XG POS - SQLite Database Schema
 *
 * All CREATE TABLE statements for the offline POS database.
 * Tables are ordered to respect foreign key dependencies.
 * This schema mirrors the cloud ERP schema (Supabase) but is
 * adapted for SQLite (TEXT instead of UUID, no RLS, etc.).
 */

export const SCHEMA_SQL = `
-- ============================================================
-- Internal tables
-- ============================================================

CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Organization settings
-- ============================================================

CREATE TABLE IF NOT EXISTS org_settings (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  company_name TEXT NOT NULL,
  tagline TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  gstin TEXT,
  pan TEXT,
  logo_url TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  org_code TEXT,
  invoice_prefix TEXT DEFAULT 'INV-',
  session_prefix TEXT DEFAULT 'SE1-',
  default_register TEXT DEFAULT 'billing desk',
  place_of_supply TEXT,
  default_notes TEXT,
  theme_color TEXT DEFAULT '#2563EB',
  synced_at TEXT
);

-- ============================================================
-- Master data
-- ============================================================

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  sku TEXT UNIQUE,
  unit_price REAL NOT NULL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  unit_of_measurement TEXT DEFAULT 'pcs',
  category_id TEXT,
  subcategory_id TEXT,
  item_type TEXT DEFAULT 'goods',
  size TEXT,
  color TEXT,
  variant TEXT,
  barcode TEXT,
  hsn_code TEXT,
  tax_rate REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  image_url TEXT,
  synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  gstin TEXT,
  pan TEXT,
  state_code TEXT,
  payment_terms TEXT DEFAULT 'Due on Receipt',
  current_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bin_locations (
  id TEXT PRIMARY KEY,
  bin_code TEXT NOT NULL UNIQUE,
  warehouse TEXT,
  location_name TEXT,
  status TEXT DEFAULT 'active',
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS bin_stock (
  bin_location_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (bin_location_id, item_id)
);

CREATE TABLE IF NOT EXISTS pos_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  employee_name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS salespersons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT
);

-- ============================================================
-- POS sessions
-- ============================================================

CREATE TABLE IF NOT EXISTS pos_sessions (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  session_number TEXT NOT NULL UNIQUE,
  register TEXT DEFAULT 'billing desk',
  opened_by TEXT NOT NULL,
  closed_by TEXT,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  status TEXT NOT NULL DEFAULT 'In-Progress',
  opening_balance REAL DEFAULT 0,
  closing_balance REAL,
  cash_in REAL DEFAULT 0,
  cash_out REAL DEFAULT 0,
  total_sales REAL DEFAULT 0,
  denomination_data TEXT,
  synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Invoices & line items
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  payment_terms TEXT,
  salesperson_id TEXT,
  salesperson_name TEXT,
  subject TEXT,
  status TEXT DEFAULT 'draft',
  pos_session_id TEXT REFERENCES pos_sessions(id),
  subtotal REAL,
  discount_type TEXT,
  discount_value REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  cgst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  place_of_supply TEXT,
  supply_type TEXT DEFAULT 'intra_state',
  customer_gstin TEXT,
  total_amount REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  balance_due REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'Unpaid',
  customer_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id TEXT,
  item_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  rate REAL NOT NULL,
  amount REAL NOT NULL,
  unit_of_measurement TEXT DEFAULT 'pcs',
  hsn_code TEXT,
  cgst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_item_bin_allocations (
  id TEXT PRIMARY KEY,
  invoice_item_id TEXT NOT NULL REFERENCES invoice_items(id) ON DELETE CASCADE,
  bin_location_id TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0)
);

-- ============================================================
-- Payments
-- ============================================================

CREATE TABLE IF NOT EXISTS payments_received (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  payment_number TEXT,
  payment_date TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  amount_received REAL NOT NULL,
  reference_number TEXT,
  invoice_id TEXT,
  invoice_number TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT
);

-- ============================================================
-- Sync queue (offline-first outbox)
-- ============================================================

CREATE TABLE IF NOT EXISTS _sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(item_name);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_invoices_session ON invoices(pos_session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON _sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_bin_stock_item ON bin_stock(item_id);
`;

// ---------------------------------------------------------------------------
// Seed data for development / first-run demo
// ---------------------------------------------------------------------------

export const SEED_SQL = `
-- ---------------------------------------------------------------------------
-- DEMO SEED DATA
-- This data is for first-run / development only.
-- In production, org_settings, items, customers, bins, and POS codes
-- should be pulled from the cloud ERP via sync.
-- DO NOT hardcode any client-specific data here.
-- ---------------------------------------------------------------------------

-- Organization settings (generic defaults — overwritten on first sync)
INSERT OR IGNORE INTO org_settings (
  id, organization_id, company_name, tagline,
  address_line1, address_line2, city, state, state_code, postal_code,
  phone, email, website, gstin, pan,
  invoice_prefix, session_prefix, default_register,
  place_of_supply, theme_color
) VALUES (
  'org-default',
  'org-default',
  '2XG POS',
  'Powered by 2XG ERP',
  '', '',
  '', '', '', '',
  '', '', '',
  '', '',
  'INV-', 'SE1-', 'billing desk',
  '', '#2563EB'
);

-- Walk-in customer (always needed)
INSERT OR IGNORE INTO customers (id, customer_name, company_name, phone, mobile, billing_address, state_code, payment_terms, is_active) VALUES
  ('cust-walkin', 'Walk-in Customer', NULL, NULL, NULL, '', '', 'Due on Receipt', 1);

-- Demo POS code (remove in production — should be synced from cloud)
INSERT OR IGNORE INTO pos_codes (id, code, employee_name, is_active) VALUES
  ('poscode-demo', '1234', 'DEMO OPERATOR', 1);

-- Default app settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('schema_version', '1'),
  ('last_sync', ''),
  ('sync_enabled', 'true'),
  ('printer_type', 'thermal'),
  ('printer_width', '80');

-- NOTE: Items, customers, bin locations, and bin stock are NOT seeded.
-- They should be pulled from the cloud ERP on first sync.
-- For local development/testing, run a sync pull or insert test data manually.
`;
