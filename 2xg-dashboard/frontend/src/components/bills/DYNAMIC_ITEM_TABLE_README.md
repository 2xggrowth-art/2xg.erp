# Dynamic Item Table - ERP-Style Implementation

## 📋 Overview

This implementation provides a complete **Dynamic Item Table** system for purchase bills with automatic calculations, item selection, and real-time updates - similar to professional ERP systems like Zoho, SAP, or QuickBooks.

## 🎯 Key Features

### 1. **State Management**
Each item row contains:
- `item_id`: Reference to selected item
- `item_name`: Display name
- `account`: Account category (auto-selected)
- `quantity`: Number of units
- `unit_price`: Rate per unit
- `tax_rate`: Tax percentage
- `discount`: Discount amount
- `total`: **Auto-calculated** amount

### 2. **Automatic Population on Item Selection**

When a user selects an item from the dropdown:

```typescript
// BEFORE selection
{
  item_id: '',
  item_name: '',
  account: 'Cost of Goods Sold',
  quantity: 1,
  unit_price: 0,
  total: 0
}

// AFTER selecting "Laptop" item
{
  item_id: 'abc-123',
  item_name: 'Laptop',
  account: 'Inventory Asset',  // ✅ Auto-selected based on item type
  quantity: 1,
  unit_price: 45000,            // ✅ Auto-filled from item's cost_price
  total: 45000                  // ✅ Auto-calculated
}
```

**Smart Account Selection Logic:**
- Items with inventory tracking → **"Inventory Asset"**
- Items without inventory → **"Cost of Goods Sold"**

### 3. **Real-Time Calculations**

Amount updates **instantly** when you change:
- ✅ Quantity
- ✅ Rate (unit_price)
- ✅ Tax Rate
- ✅ Discount

**Calculation Formula:**
```
Subtotal = Quantity × Rate
After Discount = Subtotal - Discount
Tax Amount = After Discount × (Tax Rate / 100)
Total = After Discount + Tax Amount
```

**Example Calculation:**
```
Quantity: 5
Rate: ₹1,000
Discount: ₹500
Tax Rate: 18%

Calculation:
Subtotal = 5 × 1000 = ₹5,000
After Discount = 5000 - 500 = ₹4,500
Tax = 4500 × 0.18 = ₹810
Total = 4500 + 810 = ₹5,310
```

### 4. **Row Management**

**Add New Row:**
```typescript
const addItem = () => {
  setBillItems([
    ...billItems,
    {
      item_id: '',
      item_name: '',
      account: 'Cost of Goods Sold',
      quantity: 1,
      unit_of_measurement: 'pcs',
      unit_price: 0,
      tax_rate: 0,
      discount: 0,
      total: 0
    }
  ]);
};
```

**Remove Row:**
```typescript
const removeItem = (index: number) => {
  if (billItems.length > 1) {
    setBillItems(billItems.filter((_, i) => i !== index));
  }
};
```

### 5. **Running Sub Total**

Automatically sums all row amounts:

```typescript
const calculateSubtotal = () => {
  return billItems.reduce((sum, item) => sum + item.total, 0);
};
```

## 🚀 How to Use

### Option 1: Use the Existing NewBillForm Component

The functionality is already built into `NewBillForm.tsx`:

```tsx
import NewBillForm from './components/bills/NewBillForm';

function App() {
  return <NewBillForm />;
}
```

### Option 2: Use the Standalone DynamicItemTable Component

For use in other forms:

```tsx
import DynamicItemTable, { ItemRow, AvailableItem } from './components/bills/DynamicItemTable';
import { useState, useEffect } from 'react';

function MyCustomForm() {
  const [items, setItems] = useState<ItemRow[]>([
    {
      item_id: '',
      item_name: '',
      account: 'Cost of Goods Sold',
      quantity: 1,
      unit_of_measurement: 'pcs',
      unit_price: 0,
      tax_rate: 0,
      discount: 0,
      total: 0
    }
  ]);

  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);

  useEffect(() => {
    // Fetch your items from API
    fetchItemsFromAPI().then(setAvailableItems);
  }, []);

  return (
    <DynamicItemTable
      items={items}
      onItemsChange={setItems}
      availableItems={availableItems}
    />
  );
}
```

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  USER SELECTS ITEM FROM DROPDOWN                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTOMATIC POPULATION TRIGGERS                              │
│  ✓ Item Name                                                │
│  ✓ Rate (from item.cost_price)                             │
│  ✓ Account (based on inventory tracking)                   │
│  ✓ Unit of Measurement                                      │
│  ✓ Description                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AMOUNT CALCULATION TRIGGERED                               │
│  Formula: (Qty × Rate) - Discount + Tax                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ROW TOTAL UPDATED INSTANTLY                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  SUB TOTAL RECALCULATED                                     │
│  Sums all row totals                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Implementation Details

### handleItemChange Function

This is the core function that handles all updates:

```typescript
const handleItemChange = (index: number, field: string, value: any) => {
  const updatedItems = [...billItems];
  updatedItems[index] = {
    ...updatedItems[index],
    [field]: value
  };

  // AUTO-POPULATION: When item selected
  if (field === 'item_id' && value) {
    const selectedItem = items.find(item => item.id === value);
    if (selectedItem) {
      updatedItems[index].item_name = selectedItem.item_name;
      updatedItems[index].unit_price = selectedItem.cost_price || selectedItem.unit_price || 0;
      updatedItems[index].account = selectedItem.current_stock !== undefined
        ? 'Inventory Asset'
        : 'Cost of Goods Sold';
      if (updatedItems[index].quantity === 0) {
        updatedItems[index].quantity = 1;
      }
    }
  }

  // REAL-TIME CALCULATION: When quantity, rate, tax, or discount changes
  if (['quantity', 'unit_price', 'tax_rate', 'discount', 'item_id'].includes(field)) {
    const quantity = updatedItems[index].quantity;
    const unitPrice = updatedItems[index].unit_price;
    const taxRate = updatedItems[index].tax_rate || 0;
    const discount = updatedItems[index].discount || 0;

    const subtotal = quantity * unitPrice;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * taxRate) / 100;
    updatedItems[index].total = afterDiscount + tax;
  }

  setBillItems(updatedItems);
};
```

## 📝 Example Scenarios

### Scenario 1: Adding a New Item

1. **User Action:** Clicks "Add New Row"
2. **System:** Adds empty row with default values
3. **User Action:** Selects "Laptop (SKU: LAP-001)" from dropdown
4. **System Auto-Populates:**
   - Item Name: "Laptop"
   - Rate: ₹45,000
   - Account: "Inventory Asset"
   - Quantity: 1 (default)
5. **System Calculates:** Total = ₹45,000
6. **System Updates:** Sub Total = Previous Total + ₹45,000

### Scenario 2: Changing Quantity

1. **Current State:**
   - Quantity: 1
   - Rate: ₹45,000
   - Total: ₹45,000
2. **User Action:** Changes quantity to 3
3. **System Calculates:** 3 × 45,000 = ₹1,35,000
4. **System Updates:**
   - Row Total: ₹1,35,000
   - Sub Total: Recalculated automatically

### Scenario 3: Applying Discount and Tax

1. **Current State:**
   - Quantity: 5
   - Rate: ₹1,000
   - Total: ₹5,000
2. **User Action:** Adds 10% discount (₹500)
3. **System Calculates:** 5,000 - 500 = ₹4,500
4. **User Action:** Adds 18% GST
5. **System Calculates:** 4,500 + (4,500 × 0.18) = ₹5,310
6. **System Updates:** Total = ₹5,310

## 🎨 UI Components

### Item Details Column
- Text input for manual entry
- Dropdown for item selection (triggers auto-population)
- Item icon placeholder

### Account Column
- Dropdown with 3 options:
  - Cost of Goods Sold
  - Inventory Asset
  - Operating Expense

### Quantity Column
- Number input
- Minimum: 0.01
- Step: 0.01

### Rate Column
- Number input
- Displays in currency format
- Step: 0.01

### Amount Column
- **Read-only** display
- Auto-calculated
- Formatted as currency (₹)

## ✅ Validation Rules

1. **Minimum 1 Row:** Cannot delete if only one row exists
2. **Quantity > 0:** Must be positive number
3. **Rate ≥ 0:** Can be zero for free items
4. **Tax Rate:** Between 0-100%
5. **Item Name Required:** Must select or enter item

## 🔒 Best Practices

1. **Always use the handleItemChange function** for updates to ensure calculations trigger
2. **Don't manually update `total` field** - it's auto-calculated
3. **Debounce API calls** if implementing searchable item dropdown
4. **Validate before submission** - check all required fields
5. **Show loading states** when fetching items from API

## 🆘 Troubleshooting

### Problem: Amount not updating
**Solution:** Ensure you're using `handleItemChange` function, not directly modifying state

### Problem: Item not auto-populating
**Solution:** Check that `availableItems` array has correct structure with required fields

### Problem: Sub total incorrect
**Solution:** Verify each row's `total` is calculated correctly before summing

## 📦 Files Structure

```
frontend/src/components/bills/
├── NewBillForm.tsx              # Main form with integrated item table
├── DynamicItemTable.tsx         # Standalone reusable component
└── DYNAMIC_ITEM_TABLE_README.md # This documentation
```

## 🎓 Learning Resources

- [React useState Hook](https://react.dev/reference/react/useState)
- [Array Methods in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)

---

**Created for 2XG ERP Dashboard** | Last Updated: January 2026
