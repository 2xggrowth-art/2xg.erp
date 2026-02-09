/**
 * Migration 008: Drop and recreate transfer_orders + transfer_order_items tables
 *
 * Run the `up` SQL via Supabase Studio SQL Editor.
 */

module.exports = {
  up: `
    -- Drop existing tables if they exist
    DROP TABLE IF EXISTS transfer_order_items CASCADE;
    DROP TABLE IF EXISTS transfer_orders CASCADE;
    DROP FUNCTION IF EXISTS update_transfer_orders_updated_at() CASCADE;

    -- Recreate transfer_orders table
    CREATE TABLE public.transfer_orders (
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

    -- Recreate transfer_order_items table
    CREATE TABLE public.transfer_order_items (
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

    -- Indexes
    CREATE INDEX idx_transfer_orders_status ON public.transfer_orders(status);
    CREATE INDEX idx_transfer_orders_transfer_date ON public.transfer_orders(transfer_date);
    CREATE INDEX idx_transfer_orders_organization ON public.transfer_orders(organization_id);
    CREATE INDEX idx_transfer_order_items_transfer_id ON public.transfer_order_items(transfer_order_id);
    CREATE INDEX idx_transfer_order_items_item_id ON public.transfer_order_items(item_id);

    -- Trigger function for updated_at
    CREATE OR REPLACE FUNCTION update_transfer_orders_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger
    CREATE TRIGGER trigger_update_transfer_orders_updated_at
        BEFORE UPDATE ON public.transfer_orders
        FOR EACH ROW
        EXECUTE FUNCTION update_transfer_orders_updated_at();

    -- Reload PostgREST cache
    NOTIFY pgrst, 'reload schema';
  `,
  down: `
    DROP TABLE IF EXISTS transfer_order_items CASCADE;
    DROP TABLE IF EXISTS transfer_orders CASCADE;
    DROP FUNCTION IF EXISTS update_transfer_orders_updated_at() CASCADE;
    NOTIFY pgrst, 'reload schema';
  `
};
