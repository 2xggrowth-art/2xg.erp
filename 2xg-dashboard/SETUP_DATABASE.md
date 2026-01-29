# Database Setup Instructions

## Problem
The `bills` and `payments_made` tables don't exist in your Supabase database, causing 500 errors when trying to create bills.

## Solution - Run SQL Scripts in Supabase

### Step 1: Open Supabase SQL Editor
1. Go to: https://ulubfvmxtqmsoyumdwvg.supabase.co
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Create Bills Tables
Copy the ENTIRE content from this file:
```
backend/src/utils/create-bills-tables.sql
```

Paste it into the SQL Editor and click **"Run"** (or press Ctrl+Enter)

### Step 3: Create Payments Tables
Create another new query, then copy the ENTIRE content from this file:
```
backend/src/utils/create-payments-made-table.sql
```

Paste it into the SQL Editor and click **"Run"** (or press Ctrl+Enter)

### Step 4: Verify Tables Were Created
Run this query to verify:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('bills', 'bill_items', 'payments_made', 'payment_allocations');
```

You should see 4 tables listed.

### Step 5: Reload Schema Cache
After creating the tables, you may need to reload Supabase's schema cache:
1. Go to **Settings** → **API** in your Supabase dashboard
2. Or just wait 1-2 minutes for the cache to refresh automatically

### Step 6: Test
Try creating a bill again in your application. The error should be gone!

---

## Alternative: Quick SQL (Copy This Entire Block)

If you want to do it all at once, copy this entire block and run it in Supabase SQL Editor:

```sql
-- Create bills table
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

-- Create payments_made table
CREATE TABLE IF NOT EXISTS public.payments_made (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID,
    vendor_name VARCHAR(255) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL,
    bank_charges DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    exchange_rate DECIMAL(10, 4) DEFAULT 1,
    notes TEXT,
    payment_account VARCHAR(255),
    deposit_to VARCHAR(255),
    bill_id UUID,
    bill_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_allocations table
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    bill_id UUID,
    bill_number VARCHAR(50),
    amount_allocated DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_payment FOREIGN KEY (payment_id) REFERENCES public.payments_made(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bills_organization_id ON public.bills(organization_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON public.bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON public.payments_made(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON public.payments_made(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON public.payment_allocations(payment_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
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

DROP TRIGGER IF EXISTS update_payments_made_updated_at ON public.payments_made;
CREATE TRIGGER update_payments_made_updated_at
    BEFORE UPDATE ON public.payments_made
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

After running this, your bills feature will work perfectly!