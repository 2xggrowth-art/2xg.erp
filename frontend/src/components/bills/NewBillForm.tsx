import { useState, useEffect } from 'react';
import { X, Plus, Upload, Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ItemSelector from '../shared/ItemSelector';
import { billsService, BillItem, BinAllocation } from '../../services/bills.service';
import { vendorsService, Vendor } from '../../services/vendors.service';
import { itemsService, Item } from '../../services/items.service';
import SelectBinsModal from './SelectBinsModal';

interface Location {
  id: string;
  name: string;
  address?: string;
}

/**
 * NewBillForm Component - Dynamic Item Table with ERP-like functionality
 *
 * KEY FEATURES:
 *
 * 1. STATE MANAGEMENT:
 *    - billItems: Array of item rows, each containing:
 *      • item_id: Selected item reference
 *      • item_name: Item display name
 *      • account: Account category (Inventory Asset, Cost of Goods Sold, Operating Expense)
 *      • quantity: Number of units
 *      • unit_price: Rate per unit
 *      • tax_rate: Tax percentage
 *      • discount: Discount amount
 *      • total: Calculated amount (Quantity × Rate - Discount + Tax)
 *
 * 2. AUTOMATIC POPULATION ON ITEM SELECTION:
 *    When user selects item from dropdown:
 *    - Item name is populated
 *    - Rate (unit_price) is set from item's cost_price
 *    - Account is automatically set:
 *      • "Inventory Asset" if item has inventory tracking
 *      • "Cost of Goods Sold" otherwise
 *    - Quantity defaults to 1
 *    - Unit of measurement is set
 *
 * 3. REAL-TIME CALCULATIONS:
 *    - Amount updates instantly on any change to:
 *      • Quantity
 *      • Rate (unit_price)
 *      • Tax Rate
 *      • Discount
 *    - Formula: Amount = (Quantity × Rate) - Discount + ((Quantity × Rate - Discount) × Tax%)
 *    - Sub Total automatically sums all row amounts
 *
 * 4. ROW MANAGEMENT:
 *    - Add New Row: Appends empty item object to state
 *    - Remove Row: Deletes specific row (minimum 1 row required)
 *
 * 5. RUNNING TOTALS:
 *    - calculateSubtotal(): Sums all item amounts
 *    - calculateTotal(): Includes discounts, TDS/TCS, adjustments
 */
const NewBillForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations] = useState<Location[]>([
    { id: '1', name: 'Head Office', address: 'Karnataka, Bangalore, Karnataka, India - 560001' }
  ]);

  // Bin allocation modal state
  const [binModalOpen, setBinModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);


  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_name: '',
    vendor_email: '',
    vendor_phone: '',
    bill_number: '',
    auto_bill_number: false,
    reference_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'due_on_receipt',
    subject: '',
    location_id: '1',
    discount_type: 'percentage' as 'percentage' | 'amount',
    discount_value: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    adjustment: 0,
    notes: '',
    status: 'draft'
  });

  const [billItems, setBillItems] = useState<Array<Omit<BillItem, 'id' | 'bill_id' | 'created_at'>>>([
    {
      item_id: '',
      item_name: '',
      account: 'Cost of Goods Sold',
      description: '',
      quantity: 0,
      unit_of_measurement: 'pcs',
      unit_price: 0,
      tax_rate: 0,
      discount: 0,
      total: 0
    }
  ]);

  // Track last saved serial number per item_id (from DB)
  const [serialOffsets, setSerialOffsets] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchVendors();
    fetchItems();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorsService.getAllVendors({ isActive: true });
      const apiResponse = response.data;
      if (apiResponse.success && apiResponse.data) {
        setVendors(apiResponse.data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemsService.getAllItems({ isActive: true });
      const apiResponse = response.data;
      if (apiResponse.success && apiResponse.data) {
        setItems(apiResponse.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    const selectedVendor = vendors.find(v => v.id === vendorId);

    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: selectedVendor?.supplier_name || '',
      vendor_email: selectedVendor?.email || '',
      vendor_phone: selectedVendor?.phone || ''
    }));
  };

  // Helper to regenerate serial numbers for all rows of a given item
  const regenerateSerials = (updatedItems: typeof billItems, itemId: string, dbOffset: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.sku) return;
    let counter = dbOffset;
    for (let i = 0; i < updatedItems.length; i++) {
      if (updatedItems[i].item_id === itemId) {
        const rowQty = updatedItems[i].quantity;
        if (rowQty > 0) {
          updatedItems[i].serial_numbers = Array.from({ length: rowQty }, (_, j) => `${item.sku}/${counter + j + 1}`);
          counter += rowQty;
        } else {
          updatedItems[i].serial_numbers = [];
        }
      }
    }
  };

  const handleItemChange = async (index: number, field: string, value: any) => {
    const updatedItems = [...billItems];

    // Update the specific field
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // If item selected from dropdown, auto-populate all fields
    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index].item_name = selectedItem.item_name;
        updatedItems[index].unit_price = selectedItem.cost_price || selectedItem.unit_price || 0;
        updatedItems[index].unit_of_measurement = selectedItem.unit_of_measurement || 'pcs';
        updatedItems[index].description = selectedItem.description || '';
        updatedItems[index].account = selectedItem.current_stock !== undefined && selectedItem.current_stock >= 0
          ? 'Inventory Asset'
          : 'Cost of Goods Sold';

        if (updatedItems[index].quantity === 0) {
          updatedItems[index].quantity = 1;
        }

        // Fetch last serial number from DB if not cached
        if (!(value in serialOffsets)) {
          try {
            const lastSerial = await billsService.getLastSerialNumber(value);
            setSerialOffsets(prev => ({ ...prev, [value]: lastSerial }));
            regenerateSerials(updatedItems, value, lastSerial);
          } catch {
            regenerateSerials(updatedItems, value, 0);
          }
        } else {
          regenerateSerials(updatedItems, value, serialOffsets[value]);
        }
      }
    }

    // Real-time calculation
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate' || field === 'discount' || field === 'item_id') {
      const quantity = updatedItems[index].quantity;
      const unitPrice = updatedItems[index].unit_price;
      const taxRate = updatedItems[index].tax_rate || 0;
      const discount = updatedItems[index].discount || 0;

      const subtotal = quantity * unitPrice;
      const afterDiscount = subtotal - discount;
      const tax = (afterDiscount * taxRate) / 100;
      updatedItems[index].total = afterDiscount + tax;

      // Regenerate serial numbers for all rows with same item
      if (field === 'quantity') {
        const currentItemId = updatedItems[index].item_id;
        if (currentItemId) {
          const offset = serialOffsets[currentItemId] || 0;
          regenerateSerials(updatedItems, currentItemId, offset);
        }
      }
    }

    setBillItems(updatedItems);
  };

  const addItem = () => {
    setBillItems([
      ...billItems,
      {
        item_id: '',
        item_name: '',
        account: 'Cost of Goods Sold',
        description: '',
        quantity: 0,
        unit_of_measurement: 'pcs',
        unit_price: 0,
        tax_rate: 0,
        discount: 0,
        total: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter((_, i) => i !== index));
    }
  };

  const openBinModal = (index: number) => {
    const item = billItems[index];
    if (!item.item_id || item.quantity <= 0) {
      alert('Please select an item and enter a quantity first');
      return;
    }
    setSelectedItemIndex(index);
    setBinModalOpen(true);
  };

  const handleBinAllocationSave = (allocations: BinAllocation[]) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...billItems];
      updatedItems[selectedItemIndex].bin_allocations = allocations;
      setBillItems(updatedItems);
    }
  };

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (formData.discount_type === 'percentage') {
      return (subtotal * formData.discount_value) / 100;
    }
    return formData.discount_value;
  };

  const calculateTax = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount();
    const cgst = (afterDiscount * (formData.cgst_rate || 0)) / 100;
    const sgst = (afterDiscount * (formData.sgst_rate || 0)) / 100;
    const igst = (afterDiscount * (formData.igst_rate || 0)) / 100;
    return cgst + sgst + igst;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax + (formData.adjustment || 0);
  };

  const handleSubmit = async (status: 'draft' | 'open') => {
    if (status === 'open' && !formData.vendor_id) {
      alert('Please select a vendor');
      return;
    }

    setLoading(true);

    try {
      const billData: any = {
        vendor_id: formData.vendor_id,
        vendor_name: formData.vendor_name,
        vendor_email: formData.vendor_email,
        vendor_phone: formData.vendor_phone,
        bill_number: formData.bill_number,
        reference_number: formData.reference_number,
        bill_date: formData.bill_date,
        due_date: formData.due_date || undefined,
        status,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        discount_amount: calculateDiscount(),
        adjustment: formData.adjustment,
        total_amount: calculateTotal(),
        notes: formData.notes,
        items: billItems.map(item => ({
          item_id: item.item_id || undefined,
          item_name: item.item_name,
          account: item.account,
          description: item.description,
          quantity: item.quantity,
          unit_of_measurement: item.unit_of_measurement,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount: item.discount,
          total: item.total,
          serial_numbers: item.serial_numbers || [],
          bin_allocations: item.bin_allocations || []
        }))
      };

      const response = await billsService.createBill(billData);

      if (response.success) {
        navigate('/purchases/bills');
      } else {
        alert('Failed to create bill');
      }
    } catch (error: any) {
      console.error('Error creating bill:', error);
      alert(error.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded">
              <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">New Bill</h1>
          </div>
          <button
            onClick={() => navigate('/purchases/bills')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-[98%] mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Vendor and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Vendor Name*
              </label>
              <div className="flex gap-2">
                <select
                  name="vendor_id"
                  value={formData.vendor_id}
                  onChange={handleVendorChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.supplier_name}
                    </option>
                  ))}
                </select>
                <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Search className="h-5 w-5 text-blue-600" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bill Number and Order Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Bill#*
              </label>
              <input
                type="text"
                name="bill_number"
                value={formData.bill_number}
                onChange={handleInputChange}
                placeholder="Enter bill number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleInputChange}
                placeholder="Reference/PO Number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dates and Payment Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Bill Date*
              </label>
              <input
                type="date"
                name="bill_date"
                value={formData.bill_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_45">Net 45</option>
                <option value="net_60">Net 60</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <textarea
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              rows={2}
              placeholder="Enter a subject within 250 characters"
              maxLength={250}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Warehouse Location and Transaction Level */}
          <div className="flex items-center gap-6 py-3 border-y border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Warehouse Location</span>
              <select className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
                <option>Head Office</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">At Transaction Level</span>
            </div>
          </div>

          {/* Item Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Item Table</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Bulk Actions
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase min-w-[300px]">Item Details</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Account</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Rate</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Customer Details</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-3 py-2.5 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-2 p-2 bg-gray-100 rounded">
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <ItemSelector
                              items={items}
                              value={item.item_id}
                              inputValue={item.item_name}
                              onSelect={(selectedItem) => handleItemChange(index, 'item_id', selectedItem.id)}
                              onInputChange={(value) => handleItemChange(index, 'item_name', value)}
                              placeholder="Type or click to select an item."
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={item.account}
                          onChange={(e) => handleItemChange(index, 'account', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option>Cost of Goods Sold</option>
                          <option>Inventory Asset</option>
                          <option>Operating Expense</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.quantity > 0 ? item.quantity : ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          min="1"
                          step="1"
                          onKeyDown={(e) => {
                            if (e.key === '.' || e.key === 'e') {
                              e.preventDefault();
                            }
                          }}
                          className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                          placeholder="Qty"
                        />
                        {/* Select Bins Button */}
                        {item.quantity > 0 && item.item_id && (
                          <button
                            type="button"
                            onClick={() => openBinModal(index)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mx-auto"
                          >
                            <MapPin size={12} />
                            {item.bin_allocations && item.bin_allocations.length > 0 ? (
                              <span className="font-medium">
                                {item.bin_allocations.length} bin{item.bin_allocations.length > 1 ? 's' : ''} selected
                              </span>
                            ) : (
                              <span>⚠ Select Bins</span>
                            )}
                          </button>
                        )}
                        {item.serial_numbers && item.serial_numbers.length > 0 && (
                          <div className="mt-2 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                              {item.serial_numbers.length === 1
                                ? item.serial_numbers[0]
                                : `${item.serial_numbers[0]} → ${item.serial_numbers[item.serial_numbers.length - 1]}`
                              }
                              {item.serial_numbers.length > 1 && (
                                <span className="ml-1 text-blue-500">({item.serial_numbers.length})</span>
                              )}
                            </span>
                          </div>
                        )}
                        {item.quantity > 0 && (!item.serial_numbers || item.serial_numbers.length === 0) && !item.item_id && (
                          <div className="mt-1 text-[10px] text-orange-500 text-center">
                            Select item with SKU
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-500">
                          <option>Select Customer</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-medium text-gray-900">{item.total.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
                            disabled={billItems.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add New Row
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Plus className="h-4 w-4" />
                Add Landed Cost
              </button>
            </div>
          </div>

          {/* Calculations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            {/* Left side - Notes and Attachments */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Add any additional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">It will not be shown in PDF</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach File(s) to Bill
                </label>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                  <Upload className="h-4 w-4 text-gray-600" />
                  <span>Upload File</span>
                </button>
                <p className="mt-1 text-xs text-gray-500">You can upload a maximum of 5 files, 10MB each</p>
              </div>
            </div>

            {/* Right side - Totals */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-700">Sub Total</span>
                <span className="font-medium text-gray-900">{calculateSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Discount</span>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">₹</option>
                  </select>
                </div>
                <span className="font-medium text-gray-900">{calculateDiscount().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 w-12">CGST</span>
                  <select
                    value={formData.cgst_rate}
                    onChange={(e) => setFormData({ ...formData, cgst_rate: parseFloat(e.target.value) || 0 })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm bg-white w-20"
                  >
                    <option value={0}>0%</option>
                    <option value={2.5}>2.5%</option>
                    <option value={9}>9%</option>
                  </select>
                </div>
                <span className="font-medium text-gray-900">
                  {((calculateSubtotal() - calculateDiscount()) * (formData.cgst_rate || 0) / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 w-12">SGST</span>
                  <select
                    value={formData.sgst_rate}
                    onChange={(e) => setFormData({ ...formData, sgst_rate: parseFloat(e.target.value) || 0 })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm bg-white w-20"
                  >
                    <option value={0}>0%</option>
                    <option value={2.5}>2.5%</option>
                    <option value={9}>9%</option>
                  </select>
                </div>
                <span className="font-medium text-gray-900">
                  {((calculateSubtotal() - calculateDiscount()) * (formData.sgst_rate || 0) / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 w-12">IGST</span>
                  <select
                    value={formData.igst_rate}
                    onChange={(e) => setFormData({ ...formData, igst_rate: parseFloat(e.target.value) || 0 })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm bg-white w-20"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
                <span className="font-medium text-gray-900">
                  {((calculateSubtotal() - calculateDiscount()) * (formData.igst_rate || 0) / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Adjustment</span>
                  <input
                    type="number"
                    name="adjustment"
                    value={formData.adjustment}
                    onChange={(e) => setFormData({ ...formData, adjustment: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                </div>
                <span className="font-medium text-gray-900">{formData.adjustment.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Additional Fields: Start adding custom fields for your payments made by going to{' '}
              <span className="italic">Settings</span> → <span className="italic">Purchases</span> → <span className="italic">Bills</span>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              PDF Template: <span className="text-blue-600">'Standard Template'</span>{' '}
              <button className="text-blue-600 hover:underline">Change</button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/purchases/bills')}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit('draft')}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit('open')}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                disabled={loading || !formData.vendor_id}
              >
                Save as Open
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bin Selection Modal */}
      {selectedItemIndex !== null && (
        <SelectBinsModal
          isOpen={binModalOpen}
          onClose={() => {
            setBinModalOpen(false);
            setSelectedItemIndex(null);
          }}
          itemName={billItems[selectedItemIndex].item_name}
          itemSku={items.find(i => i.id === billItems[selectedItemIndex].item_id)?.sku}
          totalQuantity={billItems[selectedItemIndex].quantity}
          unitOfMeasurement={billItems[selectedItemIndex].unit_of_measurement || 'pcs'}
          currentAllocations={billItems[selectedItemIndex].bin_allocations || []}
          serialNumbers={billItems[selectedItemIndex].serial_numbers || []}
          onSave={handleBinAllocationSave}
        />
      )}
    </div>
  );
};

export default NewBillForm;
