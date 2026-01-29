# Transfer Orders Setup Guide

## Issue
When trying to save a transfer order, you're getting the error:
```
Error: Could not find the table 'public.transfer_orders' in the schema cache
```

This is because the database tables haven't been created yet.

## Solution

You need to run the SQL migration to create the `transfer_orders` and `transfer_order_items` tables in your Supabase database.

### Steps to Fix:

#### 1. Open Supabase SQL Editor
Go to: https://ulubfvmxtqmsoyumdwvg.supabase.co

#### 2. Navigate to SQL Editor
Click on **"SQL Editor"** in the left sidebar

#### 3. Create a New Query
Click on **"New Query"** button

#### 4. Copy and Paste the SQL
Copy the entire SQL script from `backend/src/utils/create-transfer-orders-table.sql`

Or copy this SQL directly:

```sql
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
```

#### 5. Execute the SQL
Click the **"Run"** button (or press Ctrl+Enter)

You should see a success message like: "Success. No rows returned"

#### 6. Verify Tables Created
You can verify the tables were created by running:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('transfer_orders', 'transfer_order_items');
```

You should see both tables listed.

#### 7. Restart Backend Server (if needed)
If your backend server is running, you may want to restart it:

```bash
# Stop the backend (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

#### 8. Test the Transfer Order Form
1. Go to: http://localhost:3002/inventory/transfer-orders/new
2. Fill in the form with transfer order details
3. Click "Initiate Transfer" or "Save as Draft"
4. The transfer order should now save successfully!

## Database Schema

### transfer_orders table
- Stores main transfer order information
- Tracks source and destination locations
- Supports workflow statuses: draft, initiated, in_transit, received, cancelled
- Includes automatic timestamp tracking

### transfer_order_items table
- Stores line items for each transfer order
- Linked to transfer_orders via foreign key (cascade delete)
- Tracks item availability at both locations
- Includes quantity and unit of measurement

## Features Included

✅ Auto-generated transfer order numbers (TO-0001 format)
✅ Source and destination location selection
✅ Item selection from inventory
✅ Availability tracking (source and destination)
✅ Transfer quantity management
✅ Multiple status workflow
✅ Notes and attachments support
✅ Data validations (same location check, zero quantity check)
✅ Automatic timestamp management
✅ Performance-optimized indexes

## Troubleshooting

### Still seeing "table not found" error?
1. Make sure you ran the SQL in the correct Supabase project
2. Check that tables were created: Run `\dt public.transfer*` in SQL Editor
3. Restart your backend server
4. Clear your browser cache and reload

### Foreign key constraint errors?
Make sure the `items` table exists before creating transfer orders

### Need to reset?
To drop and recreate tables:
```sql
DROP TABLE IF EXISTS public.transfer_order_items CASCADE;
DROP TABLE IF EXISTS public.transfer_orders CASCADE;
-- Then run the create script again
```

## Next Steps

After setting up the tables, you can:
1. Create transfer orders from the UI
2. View transfer orders list
3. Edit and update transfer orders
4. Track transfer order status through the workflow
5. Generate reports on inventory movements

---

**Need Help?** Check the backend logs for more detailed error messages.
