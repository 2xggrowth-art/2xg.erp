-- Create transfer_orders table
CREATE TABLE IF NOT EXISTS public.transfer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    transfer_order_number VARCHAR(50) UNIQUE NOT NULL,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source_location VARCHAR(255) NOT NULL,
    destination_location VARCHAR(255) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'initiated', 'in_transit', 'received', 'cancelled')),
    total_items INT DEFAULT 0,
    total_quantity DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    attachment_urls TEXT[],
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_locations CHECK (source_location <> destination_location)
);

-- Create transfer_order_items table
CREATE TABLE IF NOT EXISTS public.transfer_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_order_id UUID NOT NULL REFERENCES public.transfer_orders(id) ON DELETE CASCADE,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    source_availability DECIMAL(15, 2) DEFAULT 0,
    destination_availability DECIMAL(15, 2) DEFAULT 0,
    transfer_quantity DECIMAL(15, 2) NOT NULL,
    unit_of_measurement VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity_positive CHECK (transfer_quantity > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfer_orders_source_location ON public.transfer_orders(source_location);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_destination_location ON public.transfer_orders(destination_location);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status ON public.transfer_orders(status);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_transfer_date ON public.transfer_orders(transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_organization ON public.transfer_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_transfer_order_items_transfer_id ON public.transfer_order_items(transfer_order_id);
CREATE INDEX IF NOT EXISTS idx_transfer_order_items_item_id ON public.transfer_order_items(item_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transfer_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_transfer_orders_updated_at ON public.transfer_orders;
CREATE TRIGGER trigger_update_transfer_orders_updated_at
    BEFORE UPDATE ON public.transfer_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_transfer_orders_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.transfer_orders IS 'Stores transfer orders for moving stock between locations';
COMMENT ON TABLE public.transfer_order_items IS 'Stores line items for each transfer order';
COMMENT ON COLUMN public.transfer_orders.status IS 'Status: draft, initiated, in_transit, received, cancelled';
COMMENT ON CONSTRAINT chk_different_locations ON public.transfer_orders IS 'Ensures source and destination locations are different';
COMMENT ON CONSTRAINT chk_quantity_positive ON public.transfer_order_items IS 'Ensures transfer quantity is greater than zero';
