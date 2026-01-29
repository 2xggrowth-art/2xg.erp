-- Expenses Management Module Database Schema
-- Created: 2026-01-16

-- =============================================
-- 1. EXPENSE CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, category_name)
);

-- Insert default expense categories
INSERT INTO expense_categories (organization_id, category_name, description)
VALUES
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Food Expense', 'Meals, snacks, and refreshments'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Fuel Expense', 'Petrol, diesel, and vehicle fuel'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Tea Expense', 'Tea, coffee, and beverages'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Travel Expense', 'Transportation and travel costs'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Accommodation', 'Hotel and lodging expenses'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Office Supplies', 'Stationery and office materials'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Communication', 'Phone, internet, and postage'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Entertainment', 'Client entertainment and events'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Maintenance', 'Repairs and maintenance'),
    ('c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Miscellaneous', 'Other expenses')
ON CONFLICT (organization_id, category_name) DO NOTHING;

-- =============================================
-- 2. EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,

    -- Expense Details
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    expense_item VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),

    -- Payment Details
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer')),
    payment_voucher_number VARCHAR(100),
    voucher_file_url TEXT,
    voucher_file_name VARCHAR(255),

    -- Approval Details
    approval_status VARCHAR(20) DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    approved_by_id UUID,
    approved_by_name VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Additional Info
    remarks TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_by_id UUID NOT NULL,
    paid_by_name VARCHAR(100) NOT NULL,
    branch VARCHAR(100),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
);

-- =============================================
-- 3. EXPENSE APPROVAL LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expense_approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Submitted', 'Approved', 'Rejected', 'Modified')),
    performed_by_id UUID NOT NULL,
    performed_by_name VARCHAR(100) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. INDEXES FOR PERFORMANCE
-- =============================================

-- Expense Categories Indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);

-- Expenses Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(approval_status);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch);
CREATE INDEX IF NOT EXISTS idx_expenses_number ON expenses(expense_number);

-- Approval Logs Indexes
CREATE INDEX IF NOT EXISTS idx_approval_logs_expense ON expense_approval_logs(expense_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_performed_by ON expense_approval_logs(performed_by_id);

-- =============================================
-- 5. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for expenses table
DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;
CREATE TRIGGER expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- Trigger for expense_categories table
DROP TRIGGER IF EXISTS expense_categories_updated_at ON expense_categories;
CREATE TRIGGER expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- Function to generate expense number
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    expense_num TEXT;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(expense_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM expenses
    WHERE expense_number LIKE 'EXP-%';

    -- Format as EXP-00001
    expense_num := 'EXP-' || LPAD(next_number::TEXT, 5, '0');

    RETURN expense_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. VIEWS FOR REPORTING
-- =============================================

-- Expense Summary View
CREATE OR REPLACE VIEW expense_summary AS
SELECT
    e.id,
    e.expense_number,
    e.expense_item,
    e.amount,
    e.payment_mode,
    e.approval_status,
    e.expense_date,
    e.paid_by_name,
    e.branch,
    ec.category_name,
    e.created_at,
    e.approved_by_name,
    e.approved_at
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id;

-- Monthly Expense Report View
CREATE OR REPLACE VIEW monthly_expense_report AS
SELECT
    DATE_TRUNC('month', expense_date) as month,
    ec.category_name,
    e.branch,
    e.approval_status,
    COUNT(*) as expense_count,
    SUM(e.amount) as total_amount
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY DATE_TRUNC('month', expense_date), ec.category_name, e.branch, e.approval_status;

COMMENT ON TABLE expense_categories IS 'Stores expense category definitions';
COMMENT ON TABLE expenses IS 'Stores all expense records with approval workflow';
COMMENT ON TABLE expense_approval_logs IS 'Maintains audit trail of all expense approval actions';
