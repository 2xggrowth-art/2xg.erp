-- Create payments_received table
CREATE TABLE IF NOT EXISTS public.payments_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100),
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    amount_received DECIMAL(15, 2) NOT NULL,
    bank_charges DECIMAL(15, 2) DEFAULT 0,
    deposit_to VARCHAR(255),
    location VARCHAR(255),
    invoice_id UUID,
    invoice_number VARCHAR(50),
    amount_used DECIMAL(15, 2) DEFAULT 0,
    amount_excess DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'recorded',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_received_organization_id ON public.payments_received(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_customer_id ON public.payments_received(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_payment_number ON public.payments_received(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_received_payment_date ON public.payments_received(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_received_payment_mode ON public.payments_received(payment_mode);
CREATE INDEX IF NOT EXISTS idx_payments_received_invoice_id ON public.payments_received(invoice_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_payments_received_updated_at ON public.payments_received;
CREATE TRIGGER update_payments_received_updated_at
    BEFORE UPDATE ON public.payments_received
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to customers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.payments_received
        ADD CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES public.customers(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint to invoices table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        ALTER TABLE public.payments_received
        ADD CONSTRAINT fk_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES public.invoices(id)
        ON DELETE SET NULL;
    END IF;
END $$;
