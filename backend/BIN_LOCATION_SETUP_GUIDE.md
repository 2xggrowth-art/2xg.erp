# Bin Location Feature - Setup & Testing Guide

## Current Status
✅ Backend routes configured (`/api/bin-locations`)
✅ Frontend components integrated (NewBillForm, ItemDetailPage)
✅ `bin_locations` table exists (API returning data)
⚠️  Need to verify `bill_item_bin_allocations` table exists

## Step 1: Verify Database Tables

Run this query in **Supabase SQL Editor** to check if all tables exist:

```sql
-- Check which tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('bin_locations', 'bill_item_bin_allocations', 'bill_items')
ORDER BY table_name;
```

### Expected Result:
- `bin_locations` - should show (exists based on API logs)
- `bill_item_bin_allocations` - **MUST exist** for bin tracking to work
- `bill_items` - should already exist

---

## Step 2: If `bill_item_bin_allocations` Table is Missing

Run migration file: `backend/migrations/002_create_bill_item_bin_allocations.sql`

In **Supabase SQL Editor**, copy and paste the entire contents of that file, then click "Run".

After running, execute:
```sql
NOTIFY pgrst, 'reload schema';
```

---

## Step 3: Verify Bin Locations Data

Check if sample bins were created:

```sql
SELECT bin_code, warehouse, status FROM bin_locations ORDER BY bin_code;
```

### Expected Result:
```
bin_code  | warehouse            | status
----------|----------------------|--------
A-01-01   | Main Warehouse       | active
B-01-01   | Secondary Warehouse  | active
BIN-001   | Main Warehouse       | active
BIN-002   | Main Warehouse       | active
```

---

## Step 4: Test the Complete Flow

### 4.1 Navigate to Bills
1. Go to the Bills section in the ERP system
2. Click "New Bill" or "+ Create Bill"

### 4.2 Create a Test Bill
1. Select a vendor
2. Enter bill details (bill number, date, etc.)
3. Add an item to the bill:
   - Select an item from dropdown
   - Enter a quantity (e.g., 100 units)
   - **You should now see a "Select Bins" button** with ⚠ icon

### 4.3 Allocate to Bins
1. Click the "Select Bins" button
2. A modal should open showing available bin locations
3. Distribute the quantity across bins:
   - Example: 60 units to BIN-001
   - Example: 40 units to BIN-002
4. Save the bin allocations
5. Button should change to show "2 bin(s) selected"

### 4.4 Save the Bill
1. Complete any other required fields
2. Click "Save Bill"
3. Bill should be created with bin allocations

---

## Step 5: Verify Bin Locations on Item Detail

1. Go to Items/Inventory section
2. Find the item you just added to the bill
3. Click to view item details
4. **Scroll down to "Bin Locations" section**

### Expected Result:
You should see:
- Section header: "Bin Locations" with location count
- Cards for each bin showing:
  - Bin Code (e.g., "BIN-001")
  - Warehouse name
  - Quantity allocated
  - Status badge (Active/Inactive)
  - Transaction history (bill number, date, quantity)

---

## Step 6: API Verification

You can also test the API directly:

### Get All Bin Locations:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.erp.2xg.in/api/bin-locations
```

### Get Bin Locations for a Specific Item:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.erp.2xg.in/api/bin-locations/item/ITEM_UUID_HERE
```

---

## Troubleshooting

### "No Bin Locations" Message on Item Detail
**Cause**: No bills have been created that allocate this item to bins
**Solution**: Follow Step 4 to create a bill with bin allocations

### "Select Bins" Button Not Appearing
**Check**:
- Item must be selected (item_id must exist)
- Quantity must be > 0
- Frontend must be using latest code

### Empty Bins Dropdown in Modal
**Cause**: `bin_locations` table is empty
**Solution**: Run migration 001 to insert sample data, or create bins manually via API

### API Returns Empty Array `{"success":true,"data":[]}`
**Cause**: No `bill_item_bin_allocations` records exist yet
**Solution**: Create a bill with bin allocations (Step 4)

### Table Does Not Exist Error
**Cause**: Migrations not run
**Solution**: Run both migration files in Supabase SQL Editor

---

## Quick Test Checklist

- [ ] `bin_locations` table exists (4 sample bins)
- [ ] `bill_item_bin_allocations` table exists
- [ ] PostgREST schema reloaded (`NOTIFY pgrst, 'reload schema';`)
- [ ] Backend running without errors
- [ ] Frontend showing "Select Bins" button on new bill form
- [ ] Bin selection modal opens and shows bins
- [ ] Bill saved with bin allocations
- [ ] Item detail page shows bin location section with data

---

## Next Steps After Verification

Once bin locations are working:
1. Create more bins for your actual warehouse layout
2. Train staff on bin allocation during bill entry
3. Use bin location data for warehouse picking/packing
4. Consider adding bin location filtering on item list
5. Add bin location reports for warehouse management

---

## Files Reference

**Backend**:
- Routes: `backend/src/routes/binLocations.routes.ts`
- Controller: `backend/src/controllers/binLocations.controller.ts`
- Service: `backend/src/services/binLocations.service.ts`
- Migrations: `backend/migrations/001_*.sql`, `002_*.sql`

**Frontend**:
- Bin Selection Modal: `frontend/src/components/invoices/SelectBinsModal.tsx`
- Bill Form: `frontend/src/components/bills/NewBillForm.tsx`
- Item Detail: `frontend/src/pages/ItemDetailPage.tsx`
- Service: `frontend/src/services/binLocation.service.ts`
