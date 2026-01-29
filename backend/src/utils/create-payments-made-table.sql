-- Create payments_made table
CREATE TABLE IF NOT EXISTS public.payments_made (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID,
    vendor_name VARCHAR(255) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL, -- ACH, Check, Cash, Bank Transfer, Credit Card, etc.
    reference_number VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL,
    bank_charges DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    exchange_rate DECIMAL(10, 4) DEFAULT 1,
    notes TEXT,
    payment_account VARCHAR(255), -- Bank account used for payment
    deposit_to VARCHAR(255), -- Account to deposit to
    bill_id UUID, -- If payment is for a specific bill
    bill_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'completed', -- completed, pending, failed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_allocations table (for splitting payment across multiple bills)
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    bill_id UUID,
    bill_number VARCHAR(50),
    amount_allocated DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_payment FOREIGN KEY (payment_id) REFERENCES public.payments_made(id) ON DELETE CASCADE
);

-- Add foreign key constraint to suppliers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        ALTER TABLE public.payments_made
        ADD CONSTRAINT fk_payment_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES public.suppliers(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON public.payments_made(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON public.payments_made(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON public.payments_made(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments_made(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments_made(status);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_bill_id ON public.payment_allocations(bill_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_payments_made_updated_at ON public.payments_made;
CREATE TRIGGER update_payments_made_updated_at
    BEFORE UPDATE ON public.payments_made
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
