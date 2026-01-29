-- Create delivery_challans table
CREATE TABLE IF NOT EXISTS public.delivery_challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    challan_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100),
    challan_date DATE NOT NULL,
    challan_type VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    adjustment DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_challan_items table
CREATE TABLE IF NOT EXISTS public.delivery_challan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_challan_id UUID NOT NULL,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_of_measurement VARCHAR(50),
    rate DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    stock_on_hand DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_delivery_challan FOREIGN KEY (delivery_challan_id) REFERENCES public.delivery_challans(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_challans_organization_id ON public.delivery_challans(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_customer_id ON public.delivery_challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_challan_number ON public.delivery_challans(challan_number);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_status ON public.delivery_challans(status);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_challan_date ON public.delivery_challans(challan_date);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_items_delivery_challan_id ON public.delivery_challan_items(delivery_challan_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_items_item_id ON public.delivery_challan_items(item_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_delivery_challans_updated_at ON public.delivery_challans;
CREATE TRIGGER update_delivery_challans_updated_at
    BEFORE UPDATE ON public.delivery_challans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_challan_items_updated_at ON public.delivery_challan_items;
CREATE TRIGGER update_delivery_challan_items_updated_at
    BEFORE UPDATE ON public.delivery_challan_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to customers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.delivery_challans
        ADD CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES public.customers(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint to items table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items') THEN
        ALTER TABLE public.delivery_challan_items
        ADD CONSTRAINT fk_item
        FOREIGN KEY (item_id)
        REFERENCES public.items(id)
        ON DELETE SET NULL;
    END IF;
END $$;
