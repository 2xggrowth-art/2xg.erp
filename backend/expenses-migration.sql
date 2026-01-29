-- =============================================
-- EXPENSE CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL DEFAULT 'c749c5f6-aee0-4191-8869-0e98db3c09ec',
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
-- EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL DEFAULT 'c749c5f6-aee0-4191-8869-0e98db3c09ec',

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

    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(approval_status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- =============================================
-- INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =============================================
-- Get a category ID for sample data
DO $$
DECLARE
    food_category_id UUID;
    fuel_category_id UUID;
    travel_category_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO food_category_id FROM expense_categories WHERE category_name = 'Food Expense' LIMIT 1;
    SELECT id INTO fuel_category_id FROM expense_categories WHERE category_name = 'Fuel Expense' LIMIT 1;
    SELECT id INTO travel_category_id FROM expense_categories WHERE category_name = 'Travel Expense' LIMIT 1;

    -- Insert sample expenses
    INSERT INTO expenses (
        expense_number, category_id, expense_item, amount,
        payment_mode, approval_status, expense_date,
        paid_by_id, paid_by_name, branch
    ) VALUES
    (
        'EXP-00001', food_category_id, 'Team Lunch Meeting', 1500.00,
        'UPI', 'Approved', CURRENT_DATE - INTERVAL '2 days',
        'c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Admin User', 'Head Office'
    ),
    (
        'EXP-00002', fuel_category_id, 'Vehicle Fuel - Delivery Van', 3500.00,
        'Cash', 'Approved', CURRENT_DATE - INTERVAL '1 day',
        'c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Admin User', 'Head Office'
    ),
    (
        'EXP-00003', travel_category_id, 'Client Visit - Mumbai', 5000.00,
        'Bank Transfer', 'Pending', CURRENT_DATE,
        'c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Admin User', 'Head Office'
    ),
    (
        'EXP-00004', food_category_id, 'Office Tea & Snacks', 800.00,
        'Cash', 'Pending', CURRENT_DATE,
        'c749c5f6-aee0-4191-8869-0e98db3c09ec', 'Admin User', 'Head Office'
    );
END $$;
