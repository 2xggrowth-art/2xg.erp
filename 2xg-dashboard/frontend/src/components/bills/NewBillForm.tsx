import { useState, useEffect } from 'react';
import { X, Plus, Upload, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { billsService, BillItem } from '../../services/bills.service';
import { vendorsService, Vendor } from '../../services/vendors.service';
import { itemsService, Item } from '../../services/items.service';
import ManageTDSModal from './ManageTDSModal';
import ManageTCSModal from './ManageTCSModal';

interface Location {
  id: string;
  name: string;
  address?: string;
}

interface TDSTax {
  id: string;
  name: string;
  rate: number;
  section: string;
  status: 'Active' | 'Inactive';
}

interface TCSTax {
  id: string;
  name: string;
  rate: number;
  natureOfCollection: string;
  status: 'Active' | 'Inactive';
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
  const [showTDSModal, setShowTDSModal] = useState(false);
  const [selectedTDSTax, setSelectedTDSTax] = useState<string>('');
  const [showTCSModal, setShowTCSModal] = useState(false);
  const [selectedTCSTax, setSelectedTCSTax] = useState<string>('');

  // TDS Tax Options (matching Zoho Inventory)
  const [tdsTaxes, setTdsTaxes] = useState<TDSTax[]>([
    { id: '1', name: 'Commission or Brokerage [2%]', rate: 2, section: 'Section 194 H', status: 'Active' },
    { id: '2', name: 'Commission or Brokerage (Reduced) [3.75%]', rate: 3.75, section: 'Section 194 H', status: 'Active' },
    { id: '3', name: 'Dividend [10%]', rate: 10, section: 'Section 194', status: 'Active' },
    { id: '4', name: 'Dividend (Reduced) [7.5%]', rate: 7.5, section: 'Section 194', status: 'Active' },
    { id: '5', name: 'Other Interest than securities [10%]', rate: 10, section: 'Section 194 A', status: 'Active' },
    { id: '6', name: 'Other Interest than securities (Reduced) [7.5%]', rate: 7.5, section: 'Section 194 A', status: 'Active' },
    { id: '7', name: 'Payment of contractors for Others [2%]', rate: 2, section: 'Section 194 C', status: 'Active' },
    { id: '8', name: 'Payment of contractors for Others (Reduced) [1.5%]', rate: 1.5, section: 'Section 194 C', status: 'Active' },
    { id: '9', name: 'Payment of contractors HUF/Indiv [1%]', rate: 1, section: 'Section 194 C', status: 'Active' },
    { id: '10', name: 'Payment of contractors HUF/Indiv (Reduced) [0.75%]', rate: 0.75, section: 'Section 194 C', status: 'Active' },
    { id: '11', name: 'Professional Fees [10%]', rate: 10, section: 'Section 194J', status: 'Active' },
    { id: '12', name: 'Professional Fees (Reduced) [7.5%]', rate: 7.5, section: 'Section 194J', status: 'Active' },
    { id: '13', name: 'Rent on land or furniture etc [10%]', rate: 10, section: 'Section 194I', status: 'Active' },
    { id: '14', name: 'Rent on land or furniture etc (Reduced) [7.5%]', rate: 7.5, section: 'Section 194I', status: 'Active' },
    { id: '15', name: 'Technical Fees (2%) [2%]', rate: 2, section: 'Section 194J', status: 'Active' },
  ]);

  const handleAddTax = (newTax: TDSTax) => {
    setTdsTaxes([...tdsTaxes, newTax]);
  };

  // TCS Tax Options
  const [tcsTaxes, setTcsTaxes] = useState<TCSTax[]>([]);

  const handleAddTCSTax = (newTax: TCSTax) => {
    setTcsTaxes([...tcsTaxes, newTax]);
    // Auto-select the newly added tax
    setSelectedTCSTax(newTax.id);
    setFormData({ ...formData, tds_tcs_rate: newTax.rate });
  };

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
    tds_tcs_type: 'TDS' as 'TDS' | 'TCS' | '',
    tds_tcs_rate: 0,
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
      quantity: 1,
      unit_of_measurement: 'pcs',
      unit_price: 0,
      tax_rate: 0,
      discount: 0,
      total: 0
    }
  ]);

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

  const handleItemChange = (index: number, field: string, value: any) => {
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
        // Auto-populate item details
        updatedItems[index].item_name = selectedItem.item_name;
        updatedItems[index].unit_price = selectedItem.cost_price || selectedItem.unit_price || 0;
        updatedItems[index].unit_of_measurement = selectedItem.unit_of_measurement || 'pcs';
        updatedItems[index].description = selectedItem.description || '';

        // Auto-populate account based on item type
        // If item has inventory tracking, set to Inventory Asset, otherwise Cost of Goods Sold
        updatedItems[index].account = selectedItem.current_stock !== undefined && selectedItem.current_stock >= 0
          ? 'Inventory Asset'
          : 'Cost of Goods Sold';

        // Set default quantity if not set
        if (updatedItems[index].quantity === 0) {
          updatedItems[index].quantity = 1;
        }
      }
    }

    // Real-time calculation: Update amount whenever quantity, rate, tax, or discount changes
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate' || field === 'discount' || field === 'item_id') {
      const quantity = updatedItems[index].quantity;
      const unitPrice = updatedItems[index].unit_price;
      const taxRate = updatedItems[index].tax_rate || 0;
      const discount = updatedItems[index].discount || 0;

      // Calculate: (Quantity × Rate) - Discount + Tax
      const subtotal = quantity * unitPrice;
      const afterDiscount = subtotal - discount;
      const tax = (afterDiscount * taxRate) / 100;
      updatedItems[index].total = afterDiscount + tax;
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
        quantity: 1,
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
    if (formData.tds_tcs_type && formData.tds_tcs_rate) {
      return (afterDiscount * formData.tds_tcs_rate) / 100;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();

    if (formData.tds_tcs_type === 'TDS') {
      return subtotal - discount - tax + formData.adjustment;
    } else if (formData.tds_tcs_type === 'TCS') {
      return subtotal - discount + tax + formData.adjustment;
    }
    return subtotal - discount + formData.adjustment;
  };

  const handleSubmit = async (status: 'draft' | 'open') => {
    if (!formData.vendor_id) {
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
          total: item.total
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
      <div className="max-w-6xl mx-auto p-6">
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
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Item Details</th>
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
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                              placeholder="Type or click to select an item."
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <select
                              value={item.item_id}
                              onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                              className="w-full mt-1 px-2 py-1 border-0 text-xs text-gray-600 focus:ring-0"
                            >
                              <option value="">Select from items</option>
                              {items.map(i => (
                                <option key={i.id} value={i.id}>{i.item_name}</option>
                              ))}
                            </select>
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
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0.01"
                          step="0.01"
                          className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                        />
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tds_tcs_type"
                      value="TDS"
                      checked={formData.tds_tcs_type === 'TDS'}
                      onChange={handleInputChange}
                      className="text-blue-600"
                    />
                    <label className="text-sm text-gray-700">TDS</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tds_tcs_type"
                      value="TCS"
                      checked={formData.tds_tcs_type === 'TCS'}
                      onChange={handleInputChange}
                      className="text-blue-600"
                    />
                    <label className="text-sm text-gray-700">TCS</label>
                  </div>
                  {formData.tds_tcs_type === 'TDS' && (
                    <select
                      value={selectedTDSTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'manage_tds') {
                          // Open Manage TDS modal
                          setShowTDSModal(true);
                          setSelectedTDSTax('');
                        } else {
                          setSelectedTDSTax(value);
                          const tax = tdsTaxes.find(t => t.id === value);
                          if (tax) {
                            setFormData({ ...formData, tds_tcs_rate: tax.rate });
                          }
                        }
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm min-w-[200px]"
                    >
                      <option value="">Select a Tax</option>
                      <optgroup label="Taxes">
                        {tdsTaxes.map(tax => (
                          <option key={tax.id} value={tax.id}>
                            {tax.name}
                          </option>
                        ))}
                      </optgroup>
                      <option value="manage_tds" className="text-blue-600 font-medium">
                        ⚙ Manage TDS
                      </option>
                    </select>
                  )}
                  {formData.tds_tcs_type === 'TCS' && (
                    <select
                      value={selectedTCSTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'manage_tcs') {
                          // Open Manage TCS modal
                          setShowTCSModal(true);
                          setSelectedTCSTax('');
                        } else {
                          setSelectedTCSTax(value);
                          const tax = tcsTaxes.find(t => t.id === value);
                          if (tax) {
                            setFormData({ ...formData, tds_tcs_rate: tax.rate });
                          }
                        }
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm min-w-[200px]"
                    >
                      <option value="">Select a Tax</option>
                      {tcsTaxes.length > 0 ? (
                        <optgroup label="Taxes">
                          {tcsTaxes.map(tax => (
                            <option key={tax.id} value={tax.id}>
                              {tax.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option value="" disabled>No TCS Taxes Available</option>
                      )}
                      <option value="manage_tcs" className="text-blue-600 font-medium">
                        ⚙ Manage TCS
                      </option>
                    </select>
                  )}
                </div>
                <span className="font-medium text-gray-900">
                  {formData.tds_tcs_type === 'TDS' ? '-' : ''}
                  {calculateTax().toFixed(2)}
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
                disabled={loading || !formData.vendor_id}
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

      {/* Manage TDS Modal */}
      <ManageTDSModal
        isOpen={showTDSModal}
        onClose={() => setShowTDSModal(false)}
        taxes={tdsTaxes}
        onAddTax={handleAddTax}
      />

      <ManageTCSModal
        isOpen={showTCSModal}
        onClose={() => setShowTCSModal(false)}
        taxes={tcsTaxes}
        onAddTax={handleAddTCSTax}
      />
    </div>
  );
};

export default NewBillForm;
