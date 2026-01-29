# Setup Vendor Credits Database Tables

The vendor credits feature requires database tables that need to be created in Supabase.

## Error You're Seeing
You're getting a **500 Internal Server Error** when trying to save vendor credits because the database tables don't exist yet.

## How to Fix This

### Option 1: Run SQL Script in Supabase (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://ulubfvmxtqmsoyumdwvg.supabase.co
   - Click "SQL Editor" in the left sidebar

2. **Copy and Run the SQL Script**
   - Open the file: `backend/src/utils/create-vendor-credits-table.sql`
   - Copy ALL the content
   - Paste it into the Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Verify Tables Created**
   - Go to "Table Editor" in Supabase
   - You should now see two new tables:
     - `vendor_credits`
     - `vendor_credit_items`

4. **Restart Your Backend Server**
   - Stop the backend server (Ctrl+C in the terminal)
   - Restart it: `cd backend && npm run dev`

### Option 2: Quick SQL Copy-Paste

If you want to quickly copy the SQL, here it is:

```sql
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
```

## After Setup

Once you've created the tables, test the vendor credits feature:

1. Navigate to: http://localhost:3001/purchases/vendor-credits/new
2. Fill in the form with:
   - Select a vendor
   - Add items
   - Click "Save as Open"
3. The PDF should automatically generate and open in a new tab!

## What the PDF Feature Does

When you click **"Save as Open"**, the system will:
1. ✅ Save the vendor credit to the database
2. ✅ Generate a professional PDF with all credit details
3. ✅ Automatically open the PDF in a new browser tab
4. ✅ Navigate you back to the vendor credits list

The PDF includes:
- Company header and branding
- Vendor details
- Credit note number and date
- All line items with quantities and amounts
- Tax calculations (TDS/TCS)
- Discounts and adjustments
- Total amounts and balance
- Notes and footer

## Need Help?

If you still see errors after setting up the tables, check:
1. Is the backend server running? (`npm run dev` in the backend folder)
2. Is the frontend server running? (`npm run dev` in the frontend folder)
3. Check the backend console for any error messages
4. Verify the tables exist in Supabase Table Editor
