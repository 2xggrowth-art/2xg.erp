import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, Plus, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseOrdersService, PurchaseOrderItem } from '../../services/purchase-orders.service';
import { vendorsService, Vendor } from '../../services/vendors.service';
import { itemsService, Item } from '../../services/items.service';

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
  const [locations, setLocations] = useState<Location[]>([
    { id: '1', name: 'Head Office', address: 'Karnataka, Bangalore, Karnataka, India - 560001' }
  ]);

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
    tds_tcs_type: '',
    tds_tcs_rate: 0,
    adjustment: 0,
    notes: '',
    terms_and_conditions: '',
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
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorsService.getAllVendors({ isActive: true });
      if (response.success && response.data) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemsService.getAllItems({ isActive: true });
      if (response.success && response.data) {
        setItems(response.data);
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

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    const selectedVendor = vendors.find(v => v.id === vendorId);

    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: selectedVendor?.supplier_name || '',
      vendor_email: selectedVendor?.email || ''
    }));
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...poItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // If item selected, populate details
    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index].item_name = selectedItem.item_name;
        updatedItems[index].rate = selectedItem.cost_price || 0;
        updatedItems[index].unit_of_measurement = selectedItem.unit_of_measurement;
        updatedItems[index].description = selectedItem.description || '';
      }
    }

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
    if (formData.tds_tcs_type && formData.tds_tcs_rate) {
      return (afterDiscount * formData.tds_tcs_rate) / 100;
    }
    return 0;
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
        }))
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
              <select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleVendorChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select or add vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.supplier_name}
                  </option>
                ))}
              </select>
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
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
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
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
                        >
                          <option value="">Select Item</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>{i.item_name}</option>
                          ))}
                        </select>
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
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          step="0.01"
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
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any notes for the vendor"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Terms */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  name="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter payment and delivery terms"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Attach File(s) to Purchase Order
                </label>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                  <Upload size={16} />
                  <span className="text-sm">Upload File</span>
                </button>
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
              disabled={loading || !formData.vendor_id}
            >
              <Save size={18} />
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('issued')}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              disabled={loading || !formData.vendor_id}
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
