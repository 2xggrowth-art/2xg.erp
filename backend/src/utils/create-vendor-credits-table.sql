-- Create vendor_credits table
CREATE TABLE IF NOT EXISTS public.vendor_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    credit_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_email VARCHAR(255),
    vendor_phone VARCHAR(50),
    credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(255) DEFAULT 'Head Office',
    order_number VARCHAR(100),
    reference_number VARCHAR(100),
    subject VARCHAR(250),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'cancelled')),
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_type VARCHAR(50) DEFAULT 'TDS',
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    adjustment DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_used DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    attachment_urls TEXT[],
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor_credit_items table
CREATE TABLE IF NOT EXISTS public.vendor_credit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id UUID NOT NULL REFERENCES public.vendor_credits(id) ON DELETE CASCADE,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    account VARCHAR(255),
    quantity DECIMAL(15, 3) NOT NULL DEFAULT 1,
    rate DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_credits_vendor_id ON public.vendor_credits(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_credits_status ON public.vendor_credits(status);
CREATE INDEX IF NOT EXISTS idx_vendor_credits_credit_date ON public.vendor_credits(credit_date);
CREATE INDEX IF NOT EXISTS idx_vendor_credits_organization ON public.vendor_credits(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendor_credit_items_credit_id ON public.vendor_credit_items(credit_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_vendor_credits_updated_at ON public.vendor_credits;
CREATE TRIGGER trigger_update_vendor_credits_updated_at
    BEFORE UPDATE ON public.vendor_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_credits_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.vendor_credits IS 'Stores vendor credit notes for refunds and adjustments from suppliers';
COMMENT ON TABLE public.vendor_credit_items IS 'Stores line items for each vendor credit';
COMMENT ON COLUMN public.vendor_credits.status IS 'Status: draft, open, closed, cancelled';
COMMENT ON COLUMN public.vendor_credits.amount_used IS 'Amount of credit already applied to bills';
COMMENT ON COLUMN public.vendor_credits.balance IS 'Remaining credit balance available';