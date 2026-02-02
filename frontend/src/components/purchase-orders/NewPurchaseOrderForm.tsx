import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Send, Plus, Trash2, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseOrdersService, PurchaseOrderItem } from '../../services/purchase-orders.service';
import { vendorsService, Vendor } from '../../services/vendors.service';
import { itemsService, Item } from '../../services/items.service';
import VendorCombobox from '../vendors/VendorCombobox';

interface Location {
  id: string;
  name: string;
  address?: string;
}

const NewPurchaseOrderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearchQueries, setItemSearchQueries] = useState<{ [key: number]: string }>({});
  const [showItemDropdowns, setShowItemDropdowns] = useState<{ [key: number]: boolean }>({});
  const [locations] = useState<Location[]>([
    { id: '1', name: 'Head Office', address: 'Karnataka, Bangalore, Karnataka, India - 560001' }
  ]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_name: '',
    vendor_email: '',
    po_number: '',
    auto_po_number: true,
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    location_id: '',
    delivery_address_type: 'location' as 'location' | 'customer',
    delivery_address: '',
    discount_type: 'percentage' as 'percentage' | 'amount',
    discount_value: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    tds_tcs_type: '',
    tds_tcs_rate: 0,
    adjustment: 0,
    // Order Details
    payment_terms: '',
    other_references: '',
    terms_of_delivery: '',
    // Receipt Details
    dispatch_through: '',
    destination: '',
    carrier_name_agent: '',
    bill_of_lading_no: '',
    bill_of_lading_date: '',
    motor_vehicle_no: '',
    terms_and_conditions: `Prices are as per this PO and are final.

Delivery must be completed on or before the agreed date.

Goods are subject to quality inspection and approval.

Rejected or damaged items must be replaced by the supplier.

Proper packaging and PO reference are mandatory.

Payment will be made after successful delivery and acceptance.`,
    status: 'draft'
  });

  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([
    {
      item_id: '',
      item_name: '',
      account: 'Cost of Goods Sold',
      description: '',
      quantity: 1,
      unit_of_measurement: 'pcs',
      rate: 0,
      amount: 0
    }
  ]);

  useEffect(() => {
    fetchVendors();
    fetchItems();
    generatePONumber();

    // Close dropdowns when clicking outside
    const handleClickOutside = () => {
      setShowItemDropdowns({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorsService.getAllVendors({ isActive: true });
      if (response.data.success && response.data.data) {
        setVendors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemsService.getAllItems({ isActive: true });
      if (response.data.success && response.data.data) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const generatePONumber = async () => {
    if (formData.auto_po_number) {
      try {
        const response = await purchaseOrdersService.generatePONumber();
        if (response.success && response.data) {
          setFormData(prev => ({ ...prev, po_number: response.data.po_number }));
        }
      } catch (error) {
        console.error('Error generating PO number:', error);
      }
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

  const handleVendorSelect = (vendor: Vendor | null, manualName?: string) => {
    if (vendor) {
      // Selected an existing vendor
      setFormData(prev => ({
        ...prev,
        vendor_id: vendor.id,
        vendor_name: vendor.supplier_name,
        vendor_email: vendor.email || ''
      }));
    } else if (manualName) {
      // Manual entry - one-time vendor
      setFormData(prev => ({
        ...prev,
        vendor_id: '',
        vendor_name: manualName,
        vendor_email: ''
      }));
    } else {
      // Cleared
      setFormData(prev => ({
        ...prev,
        vendor_id: '',
        vendor_name: '',
        vendor_email: ''
      }));
    }
  };

  const handleSaveAsNewVendor = async (vendorName: string) => {
    try {
      const response = await vendorsService.createVendor({
        display_name: vendorName
      });

      if (response.data.success && response.data.data) {
        const newVendor = response.data.data;
        // Add to local vendors list
        setVendors(prev => [...prev, newVendor]);
        // Update form with the new vendor
        setFormData(prev => ({
          ...prev,
          vendor_id: newVendor.id,
          vendor_name: newVendor.supplier_name,
          vendor_email: newVendor.email || ''
        }));
        alert(`Vendor "${vendorName}" saved successfully!`);
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor. You can still proceed with the manual entry.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemSearchChange = (index: number, searchQuery: string) => {
    setItemSearchQueries(prev => ({ ...prev, [index]: searchQuery }));
    setShowItemDropdowns(prev => ({ ...prev, [index]: true }));
  };

  const handleItemSelect = (index: number, selectedItem: Item) => {
    const updatedItems = [...poItems];
    updatedItems[index] = {
      ...updatedItems[index],
      item_id: selectedItem.id,
      item_name: selectedItem.item_name,
      rate: Math.round(selectedItem.cost_price || 0), // Round to integer
      unit_of_measurement: selectedItem.unit_of_measurement,
      description: selectedItem.description || '',
    };

    // Calculate amount
    updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;

    setPoItems(updatedItems);
    setItemSearchQueries(prev => ({ ...prev, [index]: selectedItem.item_name }));
    setShowItemDropdowns(prev => ({ ...prev, [index]: false }));
  };

  const getFilteredItems = (index: number) => {
    const searchQuery = itemSearchQueries[index] || '';
    if (!searchQuery) return items;

    return items.filter(item =>
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...poItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Calculate amount
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }

    setPoItems(updatedItems);
  };

  const addItem = () => {
    setPoItems([
      ...poItems,
      {
        item_id: '',
        item_name: '',
        account: 'Cost of Goods Sold',
        description: '',
        quantity: 1,
        unit_of_measurement: 'pcs',
        rate: 0,
        amount: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return poItems.reduce((sum, item) => sum + item.amount, 0);
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

    // Calculate GST
    const cgst = (afterDiscount * (formData.cgst_rate || 0)) / 100;
    const sgst = (afterDiscount * (formData.sgst_rate || 0)) / 100;
    const igst = (afterDiscount * (formData.igst_rate || 0)) / 100;
    const gstTotal = cgst + sgst + igst;

    // Calculate TDS/TCS
    let tdsTcs = 0;
    if (formData.tds_tcs_type && formData.tds_tcs_rate) {
      tdsTcs = (afterDiscount * formData.tds_tcs_rate) / 100;
    }

    return gstTotal + tdsTcs;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax + formData.adjustment;
  };

  const handleSubmit = async (status: 'draft' | 'issued') => {
    setLoading(true);

    try {
      // Prepare data and clean up empty/invalid fields
      const poData: any = {
        ...formData,
        status,
        items: poItems.map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          account: item.account,
          description: item.description,
          quantity: item.quantity,
          unit_of_measurement: item.unit_of_measurement,
          rate: item.rate
        })),
        // Include attached file names (for now, just store file names)
        // In production, you'd upload these to storage first and use URLs
        attachment_urls: attachedFiles.map(file => file.name)
      };

      // Remove location_id if empty or not a valid UUID
      if (!poData.location_id || poData.location_id === '' || poData.location_id === '1') {
        delete poData.location_id;
      }

      // Remove empty expected_delivery_date
      if (!poData.expected_delivery_date || poData.expected_delivery_date === '') {
        delete poData.expected_delivery_date;
      }

      const response = await purchaseOrdersService.createPurchaseOrder(poData);

      if (response.success) {
        navigate('/purchase-orders');
      } else {
        alert('Failed to create purchase order');
      }
    } catch (error: any) {
      console.error('Error creating PO:', error);
      alert(error.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">New Purchase Order</h1>
            <p className="text-slate-600 mt-1">Create a new purchase order for your vendor</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Vendor Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <VendorCombobox
                vendors={vendors}
                selectedVendorId={formData.vendor_id}
                selectedVendorName={formData.vendor_name}
                onVendorSelect={handleVendorSelect}
                onSaveAsNewVendor={handleSaveAsNewVendor}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Purchase Order# <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="po_number"
                  value={formData.po_number}
                  onChange={handleInputChange}
                  disabled={formData.auto_po_number}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                  required
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="auto_po_number"
                    checked={formData.auto_po_number}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  Auto
                </label>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Purchase Order Date
              </label>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="expected_delivery_date"
                value={formData.expected_delivery_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location
            </label>
            <select
              name="location_id"
              value={formData.location_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Deliver To
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="delivery_address_type"
                  value="location"
                  checked={formData.delivery_address_type === 'location'}
                  onChange={handleInputChange}
                  className="text-blue-600"
                />
                <span className="text-sm text-slate-700">Location</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="delivery_address_type"
                  value="customer"
                  checked={formData.delivery_address_type === 'customer'}
                  onChange={handleInputChange}
                  className="text-blue-600"
                />
                <span className="text-sm text-slate-700">Customer</span>
              </label>
            </div>
            {formData.delivery_address_type === 'customer' && (
              <textarea
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter delivery address"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Item Table</h3>
            <div className="overflow-visible border border-slate-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Item Details</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Account</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Amount</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {poItems.map((item, index) => (
                    <tr key={index} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <div className="relative mb-2">
                          <input
                            type="text"
                            value={itemSearchQueries[index] || item.item_name || ''}
                            onChange={(e) => handleItemSearchChange(index, e.target.value)}
                            onFocus={() => setShowItemDropdowns(prev => ({ ...prev, [index]: true }))}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Search for an item..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          {showItemDropdowns[index] && getFilteredItems(index).length > 0 && (
                            <div
                              className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                              style={{ minWidth: '300px' }}
                            >
                              {getFilteredItems(index).map(filteredItem => (
                                <div
                                  key={filteredItem.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemSelect(index, filteredItem);
                                  }}
                                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                                >
                                  <div className="font-medium text-gray-900">{filteredItem.item_name}</div>
                                  {filteredItem.sku && (
                                    <div className="text-xs text-gray-500 mt-1">SKU: {filteredItem.sku}</div>
                                  )}
                                  <div className="text-xs text-gray-600 mt-1">Rate: ₹{Math.round(filteredItem.cost_price || 0)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.account}
                          onChange={(e) => handleItemChange(index, 'account', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option>Cost of Goods Sold</option>
                          <option>Inventory Asset</option>
                          <option>Operating Expense</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={(e) => handleItemChange(index, 'rate', parseInt(e.target.value) || 0)}
                          step="1"
                          min="0"
                          className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          disabled={poItems.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addItem}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add another line
            </button>
          </div>

          {/* Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Order Details */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2 underline">Order Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Mode/Terms of Payment</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="payment_terms"
                      value={formData.payment_terms}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Other References</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="other_references"
                      value={formData.other_references}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Terms of Delivery</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="terms_of_delivery"
                      value={formData.terms_of_delivery}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2 underline">Receipt Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Dispatch through</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="dispatch_through"
                      value={formData.dispatch_through}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Destination</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Carrier Name/Agent</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="carrier_name_agent"
                      value={formData.carrier_name_agent}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Bill of Lading/LR-RR No.</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="bill_of_lading_no"
                      value={formData.bill_of_lading_no}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <label className="ml-4 text-sm text-slate-600">Date:</label>
                    <input
                      type="date"
                      name="bill_of_lading_date"
                      value={formData.bill_of_lading_date}
                      onChange={handleInputChange}
                      className="ml-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm text-slate-600">Motor Vehicle No.</label>
                    <span className="mr-2">:</span>
                    <input
                      type="text"
                      name="motor_vehicle_no"
                      value={formData.motor_vehicle_no}
                      onChange={handleInputChange}
                      placeholder=""
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions - Display Only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Terms & Conditions
                </label>
                <div className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-700">
                  <ul className="space-y-2">
                    <li>• Prices are as per this PO and are final.</li>
                    <li>• Delivery must be completed on or before the agreed date.</li>
                    <li>• Goods are subject to quality inspection and approval.</li>
                    <li>• Rejected or damaged items must be replaced by the supplier.</li>
                    <li>• Proper packaging and PO reference are mandatory.</li>
                    <li>• Payment will be made after successful delivery and acceptance.</li>
                  </ul>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Attach File(s) to Purchase Order
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Upload size={16} />
                  <span className="text-sm">Upload File</span>
                </button>

                {/* Display attached files */}
                {attachedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Upload size={14} className="text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-700">Sub Total</span>
                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700">Discount</span>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="px-2 py-1 border border-slate-300 rounded text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">₹</option>
                  </select>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                  />
                </div>
                <span className="font-medium">-₹{calculateDiscount().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm w-12 ${formData.igst_rate ? 'text-slate-400' : 'text-slate-700'}`}>CGST</span>
                  <select
                    value={formData.cgst_rate}
                    onChange={(e) => setFormData({ ...formData, cgst_rate: parseFloat(e.target.value) || 0, igst_rate: 0 })}
                    disabled={!!formData.igst_rate}
                    className={`px-2 py-1 border border-slate-300 rounded text-sm w-20 ${formData.igst_rate ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value={0}>0%</option>
                    <option value={2.5}>2.5%</option>
                    <option value={6}>6%</option>
                    <option value={9}>9%</option>
                  </select>
                </div>
                <span className="font-medium text-slate-900">
                  ₹{((calculateSubtotal() - calculateDiscount()) * (formData.cgst_rate || 0) / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm w-12 ${formData.igst_rate ? 'text-slate-400' : 'text-slate-700'}`}>SGST</span>
                  <select
                    value={formData.sgst_rate}
                    onChange={(e) => setFormData({ ...formData, sgst_rate: parseFloat(e.target.value) || 0, igst_rate: 0 })}
                    disabled={!!formData.igst_rate}
                    className={`px-2 py-1 border border-slate-300 rounded text-sm w-20 ${formData.igst_rate ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value={0}>0%</option>
                    <option value={2.5}>2.5%</option>
                    <option value={6}>6%</option>
                    <option value={9}>9%</option>
                  </select>
                </div>
                <span className="font-medium text-slate-900">
                  ₹{((calculateSubtotal() - calculateDiscount()) * (formData.sgst_rate || 0) / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm w-12 ${(formData.cgst_rate || formData.sgst_rate) ? 'text-slate-400' : 'text-slate-700'}`}>IGST</span>
                  <select
                    value={formData.igst_rate}
                    onChange={(e) => setFormData({ ...formData, igst_rate: parseFloat(e.target.value) || 0, cgst_rate: 0, sgst_rate: 0 })}
                    disabled={!!(formData.cgst_rate || formData.sgst_rate)}
                    className={`px-2 py-1 border border-slate-300 rounded text-sm w-20 ${(formData.cgst_rate || formData.sgst_rate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
                <span className="font-medium text-slate-900">
                  ₹{((calculateSubtotal() - calculateDiscount()) * (formData.igst_rate || 0) / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  <select
                    name="tds_tcs_type"
                    value={formData.tds_tcs_type}
                    onChange={handleInputChange}
                    className="px-2 py-1 border border-slate-300 rounded text-sm"
                  >
                    <option value="">None</option>
                    <option value="TDS">TDS</option>
                    <option value="TCS">TCS</option>
                  </select>
                  {formData.tds_tcs_type && (
                    <input
                      type="number"
                      name="tds_tcs_rate"
                      value={formData.tds_tcs_rate}
                      onChange={(e) => setFormData({ ...formData, tds_tcs_rate: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      placeholder="Rate %"
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                  )}
                </div>
                <span className="font-medium">
                  {formData.tds_tcs_type && `${formData.tds_tcs_type === 'TDS' ? '-' : '+'}₹${calculateTax().toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700">Adjustment</span>
                  <input
                    type="number"
                    name="adjustment"
                    value={formData.adjustment}
                    onChange={(e) => setFormData({ ...formData, adjustment: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                  />
                </div>
                <span className="font-medium">₹{formData.adjustment.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-800">Total (₹)</span>
                  <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={() => navigate('/purchase-orders')}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-2 px-6 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              disabled={loading || !formData.vendor_name}
            >
              <Save size={18} />
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('issued')}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              disabled={loading || !formData.vendor_name}
            >
              <Send size={18} />
              Save and Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchaseOrderForm;
