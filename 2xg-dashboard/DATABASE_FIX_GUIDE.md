# Database Fix Guide - Items Table Error

## Problem
The backend is throwing a 500 error when trying to create items because the `items` table is missing several columns:
- `brand`
- `hsn_code`
- `upc`
- `mpn`
- `ean`
- `isbn`
- `is_returnable`

## Solution

You have two options:

### Option 1: Run the Migration Script (If table already exists)

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `backend/src/utils/add-missing-columns.sql`
5. Click **Run** to execute the migration
6. Refresh the Items page in your application

### Option 2: Create the Table Fresh (If table doesn't exist)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. First, run the main schema if you haven't already:
   - Copy contents from `backend/src/utils/database-schema.sql`
   - Click **Run**
4. Then, run the additional schema:
   - Copy contents from `backend/src/utils/additional-schema.sql`
   - Click **Run**

### Option 3: Quick Fix - Drop and Recreate Table

**⚠️ WARNING: This will delete all existing items data!**

```sql
-- Drop the existing items table
DROP TABLE IF EXISTS items CASCADE;

-- Recreate with all columns
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  description TEXT,
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 10,
  max_stock INTEGER,
  unit_of_measurement TEXT DEFAULT 'pieces',
  barcode TEXT,
  supplier_id UUID,
  manufacturer TEXT,
  brand TEXT,
  weight DECIMAL(10, 2),
  dimensions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  image_url TEXT,
  hsn_code TEXT,
  upc TEXT,
  mpn TEXT,
  ean TEXT,
  isbn TEXT,
  is_returnable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_org ON items(organization_id);
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_category ON items(category_id);

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Verify the Fix

After running the migration, test it:

1. Go to http://localhost:3000/items
2. Click "+ New" button
3. Fill in:
   - Name: Test Item
   - SKU: TEST-001
   - Unit: pcs
4. Click "Save"
5. You should be redirected to the item detail page

If it works, the issue is resolved!

## Common Issues

### Error: "relation 'items' does not exist"
- The table hasn't been created yet
- Use Option 2 to create the full schema

### Error: "column does not exist"
- The table exists but is missing columns
- Use Option 1 to add missing columns

### Error: "relation 'organizations' does not exist"
- You need to run the main schema first (`database-schema.sql`)
- Then run the additional schema

## Need Help?

Check the backend logs for specific error messages:
```bash
# Check the running backend logs
cat C:\Users\Admin\AppData\Local\Temp\claude\e--2xg-2xg-dashboard\tasks\b5069ac.output
```
