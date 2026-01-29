-- Create bills table (without foreign key constraints for now)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_email VARCHAR(255),
    vendor_phone VARCHAR(50),
    bill_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'draft',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    adjustment DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    balance_due DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    terms_and_conditions TEXT,
    reference_number VARCHAR(100),
    purchase_order_id UUID,
    attachment_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_of_measurement VARCHAR(50),
    unit_price DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    discount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    account VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_bill FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE CASCADE
);

-- Add foreign key constraint to suppliers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        ALTER TABLE public.bills
        ADD CONSTRAINT fk_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES public.suppliers(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint to items table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items') THEN
        ALTER TABLE public.bill_items
        ADD CONSTRAINT fk_item
        FOREIGN KEY (item_id)
        REFERENCES public.items(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint to purchase_orders table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
        ALTER TABLE public.bills
        ADD CONSTRAINT fk_purchase_order
        FOREIGN KEY (purchase_order_id)
        REFERENCES public.purchase_orders(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bills_organization_id ON public.bills(organization_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON public.bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON public.bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_item_id ON public.bill_items(item_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_bills_updated_at ON public.bills;
CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bill_items_updated_at ON public.bill_items;
CREATE TRIGGER update_bill_items_updated_at
    BEFORE UPDATE ON public.bill_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, uncomment if needed)
-- ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed)
-- GRANT ALL ON public.bills TO authenticated;
-- GRANT ALL ON public.bill_items TO authenticated;
