import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import { vendorCreditsService, CreateVendorCreditData, VendorCreditItem } from '../../services/vendor-credits.service';
import { vendorsService } from '../../services/vendors.service';
import { itemsService, Item } from '../../services/items.service';
import ManageTDSModal from '../bills/ManageTDSModal';
import ManageTCSModal from '../bills/ManageTCSModal';
import { openVendorCreditPDFInNewTab } from '../../utils/pdfGenerators/vendorCreditPDF';

interface Vendor {
  id: string;
  supplier_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
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

const NewVendorCreditForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [creditNumber, setCreditNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTDSModal, setShowTDSModal] = useState(false);
  const [selectedTDSTax, setSelectedTDSTax] = useState<string>('');
  const [showTCSModal, setShowTCSModal] = useState(false);
  const [selectedTCSTax, setSelectedTCSTax] = useState<string>('');

  // TDS Tax Options (matching Bills form)
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
    setSelectedTCSTax(newTax.id);
    setFormData({ ...formData, tds_tcs_rate: newTax.rate });
  };

  // Form data
  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_name: '',
    credit_date: new Date().toISOString().split('T')[0],
    location: 'Head Office',
    order_number: '',
    reference_number: '',
    subject: '',
    discount_amount: 0,
    tds_tcs_type: 'TDS' as 'TDS' | 'TCS' | '',
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

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - formData.discount_amount;
    if (formData.tds_tcs_type && formData.tds_tcs_rate) {
      return (afterDiscount * formData.tds_tcs_rate) / 100;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = formData.discount_amount;
    const tax = calculateTax();

    if (formData.tds_tcs_type === 'TDS') {
      return subtotal - discount - tax + formData.adjustment;
    } else if (formData.tds_tcs_type === 'TCS') {
      return subtotal - discount + tax + formData.adjustment;
    }
    return subtotal - discount + formData.adjustment;
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
      const taxAmount = calculateTax();
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
        discount_amount: formData.discount_amount,
        tax_type: formData.tds_tcs_type || undefined,
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
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-700">Sub Total</span>
              <span className="text-sm font-medium">₹{calculateSubtotal().toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-700">Discount</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
                <span className="text-sm font-medium">₹{formData.discount_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tds_tcs_type"
                    value="TDS"
                    checked={formData.tds_tcs_type === 'TDS'}
                    onChange={(e) => setFormData({ ...formData, tds_tcs_type: e.target.value as 'TDS' })}
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
                    onChange={(e) => setFormData({ ...formData, tds_tcs_type: e.target.value as 'TCS' })}
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
              <span className="text-sm font-medium">
                {formData.tds_tcs_type === 'TDS' ? '-' : ''}
                ₹{calculateTax().toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-700">Adjustment</span>
              <input
                type="number"
                value={formData.adjustment}
                onChange={(e) => setFormData({ ...formData, adjustment: parseFloat(e.target.value) || 0 })}
                className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
            </div>

            <div className="flex justify-between items-center text-lg font-semibold border-t pt-3">
              <span>Total</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
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

      {/* Manage TDS Modal */}
      <ManageTDSModal
        isOpen={showTDSModal}
        onClose={() => setShowTDSModal(false)}
        taxes={tdsTaxes}
        onAddTax={handleAddTax}
      />

      {/* Manage TCS Modal */}
      <ManageTCSModal
        isOpen={showTCSModal}
        onClose={() => setShowTCSModal(false)}
        taxes={tcsTaxes}
        onAddTax={handleAddTCSTax}
      />
    </div>
  );
};

export default NewVendorCreditForm;