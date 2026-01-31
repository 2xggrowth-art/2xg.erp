import React from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DYNAMIC ITEM TABLE COMPONENT
 *
 * This is a standalone, reusable component that implements ERP-like item table functionality
 * with automatic calculations, item selection, and dynamic row management.
 *
 * USAGE:
 * ```tsx
 * import DynamicItemTable from './DynamicItemTable';
 *
 * function MyForm() {
 *   const [items, setItems] = useState([]);
 *
 *   return (
 *     <DynamicItemTable
 *       items={items}
 *       onItemsChange={setItems}
 *       availableItems={yourItemsList}
 *     />
 *   );
 * }
 * ```
 */

// Type definitions
export interface ItemRow {
  id?: string;
  item_id: string;
  item_name: string;
  account: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
}

export interface AvailableItem {
  id: string;
  item_name: string;
  cost_price: number;
  unit_price: number;
  unit_of_measurement: string;
  description?: string;
  current_stock?: number;
}

interface DynamicItemTableProps {
  items: ItemRow[];
  onItemsChange: (items: ItemRow[]) => void;
  availableItems: AvailableItem[];
}

const DynamicItemTable: React.FC<DynamicItemTableProps> = ({
  items,
  onItemsChange,
  availableItems
}) => {
  const { user } = useAuth();

  // Check if user is admin or super_admin to show purchase price (case-insensitive)
  const userRole = user?.role?.toLowerCase() || '';
  const canViewPurchasePrice = userRole === 'admin' || userRole === 'super_admin' || userRole === 'super admin';

  /**
   * AUTOMATIC ITEM SELECTION LOGIC
   * When user selects an item from dropdown:
   * 1. Auto-populate item name
   * 2. Set rate from item's purchase price
   * 3. Auto-select appropriate account based on item type
   * 4. Update amount immediately
   */
  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = availableItems.find(item => item.id === itemId);
    if (!selectedItem) return;

    const updatedItems = [...items];

    // Auto-populate all fields
    updatedItems[index] = {
      ...updatedItems[index],
      item_id: itemId,
      item_name: selectedItem.item_name,
      unit_price: selectedItem.cost_price || selectedItem.unit_price || 0,
      unit_of_measurement: selectedItem.unit_of_measurement || 'pcs',
      description: selectedItem.description || '',

      // Smart account selection based on item type
      account: selectedItem.current_stock !== undefined && selectedItem.current_stock >= 0
        ? 'Inventory Asset'
        : 'Cost of Goods Sold',

      // Set default quantity to 1 if not already set
      quantity: updatedItems[index].quantity || 1
    };

    // Calculate amount immediately
    calculateAmount(updatedItems, index);
    onItemsChange(updatedItems);
  };

  /**
   * REAL-TIME CALCULATION ENGINE
   * Formula: Amount = (Quantity × Rate) - Discount + Tax
   * Triggers on any change to quantity, rate, tax, or discount
   */
  const calculateAmount = (itemsArray: ItemRow[], index: number) => {
    const item = itemsArray[index];
    const subtotal = item.quantity * item.unit_price;
    const afterDiscount = subtotal - (item.discount || 0);
    const taxAmount = (afterDiscount * (item.tax_rate || 0)) / 100;
    itemsArray[index].total = afterDiscount + taxAmount;
  };

  /**
   * FIELD CHANGE HANDLER
   * Updates specific field and recalculates amount in real-time
   */
  const handleFieldChange = (index: number, field: keyof ItemRow, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate if numeric fields changed
    if (['quantity', 'unit_price', 'tax_rate', 'discount'].includes(field)) {
      calculateAmount(updatedItems, index);
    }

    onItemsChange(updatedItems);
  };

  /**
   * ROW MANAGEMENT
   */
  const addNewRow = () => {
    const newRow: ItemRow = {
      item_id: '',
      item_name: '',
      account: 'Cost of Goods Sold',
      description: '',
      quantity: 1,
      unit_of_measurement: 'pcs',
      unit_price: 0,
      tax_rate: 0,
      discount: 0,
      total: 0
    };
    onItemsChange([...items, newRow]);
  };

  const removeRow = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      onItemsChange(updatedItems);
    }
  };

  /**
   * RUNNING SUB TOTAL
   * Automatically sums all row amounts
   */
  const calculateSubTotal = () => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  return (
    <div className="space-y-4">
      {/* Item Table Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Item Table</h3>
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Bulk Actions
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">
                Item Details
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">
                Account
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">
                Quantity
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">
                Rate
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">
                Tax %
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase">
                Amount
              </th>
              <th className="px-3 py-2.5 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                {/* Item Details Column */}
                <td className="px-3 py-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      {/* Item Name Input */}
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => handleFieldChange(index, 'item_name', e.target.value)}
                        placeholder="Type or click to select an item."
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {/* Item Dropdown - Triggers auto-population */}
                      <select
                        value={item.item_id}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="w-full mt-1 px-2 py-1 border-0 text-xs text-gray-600 focus:ring-0"
                      >
                        <option value="">Select from items</option>
                        {availableItems.map(availItem => (
                          <option key={availItem.id} value={availItem.id}>
                            {availItem.item_name}{canViewPurchasePrice ? ` (₹${availItem.cost_price})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </td>

                {/* Account Column - Auto-populated */}
                <td className="px-3 py-3">
                  <select
                    value={item.account}
                    onChange={(e) => handleFieldChange(index, 'account', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  >
                    <option>Cost of Goods Sold</option>
                    <option>Inventory Asset</option>
                    <option>Operating Expense</option>
                  </select>
                </td>

                {/* Quantity Column - Triggers calculation */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                  />
                </td>

                {/* Rate Column - Auto-populated, triggers calculation */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleFieldChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                  />
                </td>

                {/* Tax Rate Column - Triggers calculation */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    value={item.tax_rate}
                    onChange={(e) => handleFieldChange(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                  />
                </td>

                {/* Amount Column - Auto-calculated */}
                <td className="px-3 py-3 text-right">
                  <span className="font-medium text-gray-900">
                    ₹{item.total.toFixed(2)}
                  </span>
                </td>

                {/* Remove Button */}
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="p-1 hover:bg-red-50 rounded text-red-600"
                    disabled={items.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Row Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={addNewRow}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Row
        </button>
      </div>

      {/* Running Sub Total */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <div className="w-64">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Sub Total</span>
            <span className="text-lg font-semibold text-gray-900">
              ₹{calculateSubTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicItemTable;

/**
 * IMPLEMENTATION EXAMPLE:
 *
 * ```tsx
 * import DynamicItemTable, { ItemRow, AvailableItem } from './DynamicItemTable';
 *
 * function PurchaseBillForm() {
 *   const [billItems, setBillItems] = useState<ItemRow[]>([
 *     {
 *       item_id: '',
 *       item_name: '',
 *       account: 'Cost of Goods Sold',
 *       quantity: 1,
 *       unit_of_measurement: 'pcs',
 *       unit_price: 0,
 *       tax_rate: 0,
 *       discount: 0,
 *       total: 0
 *     }
 *   ]);
 *
 *   const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
 *
 *   // Fetch items from your API
 *   useEffect(() => {
 *     fetchItems().then(setAvailableItems);
 *   }, []);
 *
 *   return (
 *     <form>
 *       <DynamicItemTable
 *         items={billItems}
 *         onItemsChange={setBillItems}
 *         availableItems={availableItems}
 *       />
 *     </form>
 *   );
 * }
 * ```
 *
 * KEY BENEFITS:
 * - ✅ Automatic account selection based on item type
 * - ✅ Real-time amount calculation (Quantity × Rate + Tax - Discount)
 * - ✅ Running sub-total that updates instantly
 * - ✅ Add/Remove rows dynamically
 * - ✅ All calculations happen in state, no manual updates needed
 * - ✅ Fully typed with TypeScript
 * - ✅ Reusable across different forms
 */
