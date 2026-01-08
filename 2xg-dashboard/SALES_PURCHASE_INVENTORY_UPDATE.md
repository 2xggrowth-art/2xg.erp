# Sales, Purchase & Inventory Tracking Update

## What's New

Added three major sections to the Item creation form:

### 1. Sales Information
- **Sellable** checkbox - Mark if this item can be sold
- **Selling Price** - Item selling price in INR
- **Account** - Sales account (Sales/Other Income)
- **Sales Description** - Description for sales transactions

### 2. Purchase Information
- **Purchasable** checkbox - Mark if this item can be purchased
- **Cost Price** - Item cost/purchase price in INR
- **Account** - Purchase account (Cost of Goods Sold/Purchases)
- **Purchase Description** - Description for purchase transactions
- **Preferred Vendor** - Default vendor for this item

### 3. Advanced Inventory Tracking
- **Track Inventory** - Enable/disable inventory tracking
- **Track Bin Location** - Track specific storage locations
- **Advanced Tracking** - Choose between None, Serial Number, or Batches
- **Inventory Account** - Account for inventory valuation
- **Valuation Method** - FIFO, LIFO, or Weighted Average
- **Reorder Point** - Minimum stock level before reordering

## Database Migration Required

### Step 1: Run the SQL Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor** in the left sidebar
4. Copy the entire contents of `backend/src/utils/add-sales-purchase-inventory-columns.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. You should see success messages for each column added

### Step 2: Verify the Migration

Run this query in the SQL Editor to verify all columns were added:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'items'
ORDER BY ordinal_position;
```

You should see the following new columns:
- `is_sellable` (BOOLEAN)
- `selling_price` (DECIMAL)
- `sales_account` (TEXT)
- `sales_description` (TEXT)
- `is_purchasable` (BOOLEAN)
- `purchase_account` (TEXT)
- `purchase_description` (TEXT)
- `preferred_vendor_id` (UUID)
- `track_inventory` (BOOLEAN)
- `track_bin_location` (BOOLEAN)
- `advanced_tracking_type` (TEXT)
- `inventory_account` (TEXT)
- `valuation_method` (TEXT)

## Testing the New Features

### 1. Ensure Servers are Running

Make sure both backend and frontend servers are running:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Test Item Creation

1. Navigate to http://localhost:3000/items
2. Click the **+ New** button
3. Fill in the required fields:
   - **Type**: Goods
   - **Name**: Test Product with Sales Info
   - **SKU**: TEST-SALES-001
   - **Unit**: pcs

4. Scroll down to **Sales Information**:
   - Keep **Sellable** checked
   - Enter **Selling Price**: 1000
   - Select **Account**: Sales
   - Enter **Sales Description**: Premium quality product for retail

5. Scroll to **Purchase Information**:
   - Keep **Purchasable** checked
   - Enter **Cost Price**: 750
   - Select **Account**: Cost of Goods Sold
   - Enter **Purchase Description**: Sourced from trusted supplier

6. Scroll to **Advanced Inventory Tracking**:
   - Keep **Track Inventory** checked
   - Check **Track Bin Location** if you want location tracking
   - Select **Advanced Tracking**: Serial Number (or None)
   - Enter **Inventory Account**: Inventory Asset
   - Select **Valuation Method**: FIFO
   - Enter **Reorder Point**: 10

7. Click **Save** button at the bottom

8. You should be redirected to the item detail page showing all the saved information

### 3. Verify in Database

Check the Supabase dashboard to verify the data was saved correctly:

```sql
SELECT
  item_name,
  sku,
  selling_price,
  cost_price,
  sales_account,
  purchase_account,
  track_inventory,
  valuation_method,
  reorder_point
FROM items
WHERE sku = 'TEST-SALES-001';
```

## What Was Updated

### Backend Changes

**File:** [backend/src/services/items.service.ts](backend/src/services/items.service.ts)
- Added handling for all new fields in `createItem()` method
- Sales Information: `is_sellable`, `selling_price`, `sales_account`, `sales_description`
- Purchase Information: `is_purchasable`, `purchase_account`, `purchase_description`, `preferred_vendor_id`
- Inventory Tracking: `track_inventory`, `track_bin_location`, `advanced_tracking_type`, `inventory_account`, `valuation_method`

### Frontend Changes

**File:** [frontend/src/components/items/NewItemForm.tsx](frontend/src/components/items/NewItemForm.tsx)
- Added three new sections to the form UI
- Added 15 new fields to form state
- Updated `handleSubmit()` to send all new fields to the API
- Save button moved to bottom of form after all sections

### Database Changes

**File:** [backend/src/utils/add-sales-purchase-inventory-columns.sql](backend/src/utils/add-sales-purchase-inventory-columns.sql)
- Added 13 new columns to the `items` table
- Added indexes for performance optimization
- All migrations are safe and check if columns exist before adding

## Common Issues & Solutions

### Error: "column does not exist"
**Solution:** Run the migration SQL in Supabase SQL Editor

### Error: "invalid input syntax for type uuid"
**Solution:** Leave the Preferred Vendor field empty for now (vendor selection to be implemented)

### Frontend shows old form
**Solution:** Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

### Backend not accepting new fields
**Solution:** Restart the backend server to load the updated code

## Next Steps (Optional Enhancements)

1. **Vendor Dropdown** - Populate preferred vendor field with actual vendors from the database
2. **Item Detail Page** - Update to display all the new fields
3. **Edit Form** - Add ability to edit items with all new fields
4. **Validation** - Add form validation for required fields when sellable/purchasable

## Need Help?

If you encounter any issues:
1. Check the browser console for frontend errors
2. Check the backend terminal for API errors
3. Verify the migration ran successfully in Supabase
4. Ensure both servers are running on the correct ports (Backend: 5000, Frontend: 3000)
