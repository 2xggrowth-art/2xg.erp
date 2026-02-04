import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import { vendorCreditsService, CreateVendorCreditData, VendorCreditItem } from '../../services/vendor-credits.service';
import { vendorsService } from '../../services/vendors.service';
import { itemsService, Item } from '../../services/items.service';
import { openVendorCreditPDFInNewTab } from '../../utils/pdfGenerators/vendorCreditPDF';

interface Vendor {
  id: string;
  supplier_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

const NewVendorCreditForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [creditNumber, setCreditNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_name: '',
    credit_date: new Date().toISOString().split('T')[0],
    location: 'Head Office',
    order_number: '',
    reference_number: '',
    subject: '',
    discount_type: 'percentage' as 'percentage' | 'amount',
    discount_value: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    tds_tcs_type: '' as 'TDS' | 'TCS' | '',
    tds_tcs_rate: 0,
    adjustment: 0,
    notes: '',
  });

  const [creditItems, setCreditItems] = useState<Omit<VendorCreditItem, 'id' | 'credit_id'>[]>([
    {
      item_id: '',
      item_name: '',
      description: '',
      account: 'Cost of Goods Sold',
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ]);

  const accounts = [
    'Cost of Goods Sold',
    'Inventory Asset',
    'Purchase Returns',
    'Vendor Credits',
    'Other Current Assets',
  ];

  const locations = ['Head Office', 'Warehouse', 'Branch Office'];

  useEffect(() => {
    fetchVendors();
    fetchItems();
    generateCreditNumber();
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

  const generateCreditNumber = async () => {
    try {
      const response = await vendorCreditsService.generateCreditNumber();
      setCreditNumber(response.data.credit_number);
    } catch (error) {
      console.error('Error generating credit number:', error);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData({
        ...formData,
        vendor_id: vendorId,
        vendor_name: vendor.supplier_name,
      });
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...creditItems];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // If item selected from dropdown, auto-populate all fields
    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index].item_name = selectedItem.item_name;
        updatedItems[index].rate = selectedItem.cost_price || selectedItem.unit_price || 0;
        updatedItems[index].description = selectedItem.description || '';

        // Auto-populate account based on item type
        updatedItems[index].account = selectedItem.current_stock !== undefined && selectedItem.current_stock >= 0
          ? 'Inventory Asset'
          : 'Cost of Goods Sold';

        // Set default quantity if not set
        if (updatedItems[index].quantity === 0) {
          updatedItems[index].quantity = 1;
        }
      }
    }

    // Real-time calculation: Update amount whenever quantity or rate changes
    if (field === 'quantity' || field === 'rate' || field === 'item_id') {
      const quantity = updatedItems[index].quantity;
      const rate = updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }

    setCreditItems(updatedItems);
  };

  const addNewItem = () => {
    setCreditItems([
      ...creditItems,
      {
        item_id: '',
        item_name: '',
        description: '',
        account: 'Cost of Goods Sold',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (creditItems.length > 1) {
      const updatedItems = creditItems.filter((_, i) => i !== index);
      setCreditItems(updatedItems);
    }
  };

  const calculateSubtotal = () => {
    return creditItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (formData.discount_type === 'percentage') {
      return (subtotal * formData.discount_value) / 100;
    }
    return formData.discount_value;
  };

  const calculateGST = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount();
    const cgst = (afterDiscount * (formData.cgst_rate || 0)) / 100;
    const sgst = (afterDiscount * (formData.sgst_rate || 0)) / 100;
    const igst = (afterDiscount * (formData.igst_rate || 0)) / 100;
    return { cgst, sgst, igst, total: cgst + sgst + igst };
  };

  const calculateTdsTcs = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount();
    if (formData.tds_tcs_type && formData.tds_tcs_rate) {
      return (afterDiscount * formData.tds_tcs_rate) / 100;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const gst = calculateGST().total;
    const tdsTcs = calculateTdsTcs();

    let total = subtotal - discount + gst;
    if (formData.tds_tcs_type === 'TDS') {
      total -= tdsTcs;
    } else if (formData.tds_tcs_type === 'TCS') {
      total += tdsTcs;
    }
    return total + formData.adjustment;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor_id) {
      newErrors.vendor = 'Please select a vendor';
    }

    if (!creditNumber) {
      newErrors.credit_number = 'Credit number is required';
    }

    const hasValidItems = creditItems.some(item => item.item_name && item.quantity > 0 && item.rate > 0);
    if (!hasValidItems) {
      newErrors.items = 'Please add at least one valid item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (saveType: 'draft' | 'open', shouldGeneratePDF: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscount();
      const gst = calculateGST();
      const taxAmount = gst.total;
      const totalAmount = calculateTotal();

      const creditData: CreateVendorCreditData = {
        vendor_id: formData.vendor_id,
        vendor_name: formData.vendor_name,
        credit_number: creditNumber,
        credit_date: formData.credit_date,
        location: formData.location,
        order_number: formData.order_number,
        reference_number: formData.reference_number,
        subject: formData.subject,
        status: saveType,
        subtotal,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        discount_amount: discountAmount,
        cgst_rate: formData.cgst_rate,
        cgst_amount: gst.cgst,
        sgst_rate: formData.sgst_rate,
        sgst_amount: gst.sgst,
        igst_rate: formData.igst_rate,
        igst_amount: gst.igst,
        tax_amount: taxAmount,
        adjustment: formData.adjustment,
        total_amount: totalAmount,
        notes: formData.notes,
        items: creditItems.filter(item => item.item_name && item.quantity > 0),
      };

      const response = await vendorCreditsService.createVendorCredit(creditData);

      if (shouldGeneratePDF && response.data) {
        // Generate and open PDF in a new tab
        try {
          openVendorCreditPDFInNewTab(response.data);
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          alert('Vendor credit saved successfully, but there was an error generating the PDF.');
        }
      }

      alert(`Vendor credit ${saveType === 'draft' ? 'saved as draft' : 'created'} successfully!`);
      navigate('/purchases/vendor-credits');
    } catch (error: any) {
      console.error('Error creating vendor credit:', error);
      alert(error.response?.data?.message || 'Failed to create vendor credit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">New Vendor Credits</h1>
          <button
            onClick={() => navigate('/purchases/vendor-credits')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Vendor Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name<span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.vendor_id}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.supplier_name}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 text-blue-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Search className="w-5 h-5" />
              </button>
            </div>
            {errors.vendor && (
              <p className="mt-1 text-sm text-red-600">{errors.vendor}</p>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Credit Note# */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Note#<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={creditNumber}
                  onChange={(e) => setCreditNumber(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={generateCreditNumber}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Regenerate credit number"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
              {errors.credit_number && (
                <p className="mt-1 text-sm text-red-600">{errors.credit_number}</p>
              )}
            </div>

            {/* Order Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Vendor Credit Date and Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Credit Date
              </label>
              <input
                type="date"
                value={formData.credit_date}
                onChange={(e) => setFormData({ ...formData, credit_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Enter a subject within 250 characters"
              maxLength={250}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Item Table */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Table
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Account
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
                        >
                          <option value="">Select from items</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>{i.item_name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Type or click to select an item"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.account}
                          onChange={(e) => handleItemChange(index, 'account', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select an account</option>
                          {accounts.map((acc) => (
                            <option key={acc} value={acc}>
                              {acc}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {creditItems.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addNewItem}
              className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus size={18} />
              <span>Add New Row</span>
            </button>
            {errors.items && (
              <p className="mt-1 text-sm text-red-600">{errors.items}</p>
            )}
          </div>

          {/* Calculation Section */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="space-y-3">
              {/* Sub Total */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Sub Total</span>
                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Discount</span>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'amount' })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">₹</option>
                  </select>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <span className="font-medium">-₹{calculateDiscount().toFixed(2)}</span>
              </div>

              {/* CGST */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm w-12 ${formData.igst_rate ? 'text-gray-400' : 'text-gray-700'}`}>CGST</span>
                  <select
                    value={formData.cgst_rate}
                    onChange={(e) => setFormData({ ...formData, cgst_rate: parseFloat(e.target.value) || 0, igst_rate: 0 })}
                    disabled={!!formData.igst_rate}
                    className={`px-2 py-1 border border-gray-300 rounded text-sm w-20 ${formData.igst_rate ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value={0}>0%</option>
                    <option value={2.5}>2.5%</option>
                    <option value={6}>6%</option>
                    <option value={9}>9%</option>
                  </select>
                </div>
                <span className="font-medium text-gray-900">
                  ₹{calculateGST().cgst.toFixed(2)}
                </span>
              </div>

              {/* SGST */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm w-12 ${formData.igst_rate ? 'text-gray-400' : 'text-gray-700'}`}>SGST</span>
                  <select
                    value={formData.sgst_rate}
                    onChange={(e) => setFormData({ ...formData, sgst_rate: parseFloat(e.target.value) || 0, igst_rate: 0 })}
                    disabled={!!formData.igst_rate}
                    className={`px-2 py-1 border border-gray-300 rounded text-sm w-20 ${formData.igst_rate ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value={0}>0%</option>
                    <option value={2.5}>2.5%</option>
                    <option value={6}>6%</option>
                    <option value={9}>9%</option>
                  </select>
                </div>
                <span className="font-medium text-gray-900">
                  ₹{calculateGST().sgst.toFixed(2)}
                </span>
              </div>

              {/* IGST */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm w-12 ${(formData.cgst_rate || formData.sgst_rate) ? 'text-gray-400' : 'text-gray-700'}`}>IGST</span>
                  <select
                    value={formData.igst_rate}
                    onChange={(e) => setFormData({ ...formData, igst_rate: parseFloat(e.target.value) || 0, cgst_rate: 0, sgst_rate: 0 })}
                    disabled={!!(formData.cgst_rate || formData.sgst_rate)}
                    className={`px-2 py-1 border border-gray-300 rounded text-sm w-20 ${(formData.cgst_rate || formData.sgst_rate) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
                <span className="font-medium text-gray-900">
                  ₹{calculateGST().igst.toFixed(2)}
                </span>
              </div>

              {/* TDS/TCS */}
              <div className="flex justify-between items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  <select
                    value={formData.tds_tcs_type}
                    onChange={(e) => setFormData({ ...formData, tds_tcs_type: e.target.value as 'TDS' | 'TCS' | '' })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">None</option>
                    <option value="TDS">TDS</option>
                    <option value="TCS">TCS</option>
                  </select>
                  {formData.tds_tcs_type && (
                    <input
                      type="number"
                      value={formData.tds_tcs_rate}
                      onChange={(e) => setFormData({ ...formData, tds_tcs_rate: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      placeholder="Rate %"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  )}
                </div>
                <span className="font-medium">
                  {formData.tds_tcs_type && `${formData.tds_tcs_type === 'TDS' ? '-' : '+'}₹${calculateTdsTcs().toFixed(2)}`}
                </span>
              </div>

              {/* Adjustment */}
              <div className="flex justify-between items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Adjustment</span>
                  <input
                    type="number"
                    value={formData.adjustment}
                    onChange={(e) => setFormData({ ...formData, adjustment: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <span className="font-medium">₹{formData.adjustment.toFixed(2)}</span>
              </div>

              {/* Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total (₹)</span>
                  <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes here..."
            />
          </div>

          {/* File Attachment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach File(s) to Vendor Credits
            </label>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Upload File
            </button>
            <p className="text-xs text-gray-500 mt-1">
              You can upload a maximum of 5 files, 10MB each
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/purchases/vendor-credits')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmit('draft', false)}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('open', true)}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save as Open'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NewVendorCreditForm;