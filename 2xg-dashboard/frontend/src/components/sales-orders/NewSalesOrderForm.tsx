import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesOrdersService, SalesOrderItem } from '../../services/sales-orders.service';
import { itemsService, Item } from '../../services/items.service';
import { customersService, Customer } from '../../services/customers.service';

interface Salesperson {
  id: string;
  name: string;
  email: string;
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

const NewSalesOrderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState<{ [key: number]: string }>({});

  const [salespersons, setSalespersons] = useState<Salesperson[]>([
    { id: '1', name: 'Zaheer', email: 'mohd.zaheer@gmail.com' },
    { id: '2', name: 'Rahul Kumar', email: 'rahul@gmail.com' },
    { id: '3', name: 'Priya Sharma', email: 'priya@gmail.com' }
  ]);
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const [showAddSalespersonForm, setShowAddSalespersonForm] = useState(false);
  const [newSalesperson, setNewSalesperson] = useState({ name: '', email: '' });

  const [deliveryMethods] = useState<string[]>([
    'Standard Shipping',
    'Express Shipping',
    'Same Day Delivery',
    'Pick Up',
    'Courier Service'
  ]);

  // TDS/TCS State
  const [showTDSModal, setShowTDSModal] = useState(false);
  const [showTCSModal, setShowTCSModal] = useState(false);
  const [tdsTaxes, _setTdsTaxes] = useState<TDSTax[]>([
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
  const [tcsTaxes, _setTcsTaxes] = useState<TCSTax[]>([]);
  const [selectedTDSTax, setSelectedTDSTax] = useState<string>('');
  const [selectedTCSTax, setSelectedTCSTax] = useState<string>('');

  const [formData, setFormData] = useState({
    customer_name: '',
    sales_order_number: '',
    auto_sales_order_number: true,
    reference_number: '',
    sales_order_date: new Date().toISOString().split('T')[0],
    expected_shipment_date: '',
    payment_terms: 'due_on_receipt',
    salesperson_id: '',
    salesperson_name: '',
    delivery_method: '',
    status: 'draft',
    discount_type: 'percentage',
    discount_value: 0,
    tds_tcs_type: '',
    tds_tcs_rate: 0,
    shipping_charges: 0,
    adjustment: 0,
    customer_notes: '',
    terms_and_conditions: ''
  });

  const [salesOrderItems, setSalesOrderItems] = useState<SalesOrderItem[]>([
    {
      item_id: '',
      item_name: '',
      description: '',
      quantity: 1,
      unit_of_measurement: 'pcs',
      rate: 0,
      amount: 0,
      stock_on_hand: 0
    }
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [itemsRes, salesOrderNumberRes, customersRes] = await Promise.all([
        itemsService.getAllItems({ isActive: true }),
        salesOrdersService.generateSalesOrderNumber(),
        customersService.getAllCustomers({ isActive: true })
      ]);

      const itemsApiResponse = itemsRes.data;
      if (itemsApiResponse.success && itemsApiResponse.data) {
        setItems(itemsApiResponse.data);
      }

      // salesOrderNumberRes returns { success, data } directly (not wrapped in .data)
      if (salesOrderNumberRes.success && salesOrderNumberRes.data) {
        setFormData(prev => ({
          ...prev,
          sales_order_number: salesOrderNumberRes.data.sales_order_number
        }));
      }

      const customersApiResponse = customersRes.data;
      if (customersApiResponse.success && customersApiResponse.data) {
        setCustomers(customersApiResponse.data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleItemSelect = (index: number, item: Item) => {
    const updatedItems = [...salesOrderItems];
    updatedItems[index] = {
      item_id: item.id,
      item_name: item.item_name || '',
      description: item.description || '',
      quantity: 1,
      unit_of_measurement: item.unit_of_measurement || 'pcs',
      rate: Number(item.unit_price) || 0,
      amount: Number(item.unit_price) || 0,
      stock_on_hand: Number(item.current_stock) || 0
    };
    setSalesOrderItems(updatedItems);
    setShowItemDropdown(null);
    setItemSearchQuery({ ...itemSearchQuery, [index]: item.item_name || '' });
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: any) => {
    const updatedItems = [...salesOrderItems];

    let processedValue = value;
    if (value === undefined || value === null) {
      if (field === 'quantity' || field === 'rate' || field === 'amount' || field === 'stock_on_hand') {
        processedValue = 0;
      } else {
        processedValue = '';
      }
    }

    (updatedItems[index] as any)[field] = processedValue;

    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(processedValue) : Number(updatedItems[index].quantity);
      const rate = field === 'rate' ? Number(processedValue) : Number(updatedItems[index].rate);
      updatedItems[index].amount = quantity * rate;
    }

    setSalesOrderItems(updatedItems);
  };

  const getFilteredItems = (index: number) => {
    const query = itemSearchQuery[index] || '';
    if (!query) return items;
    return items.filter(item =>
      item.item_name?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const addNewItem = () => {
    setSalesOrderItems([
      ...salesOrderItems,
      {
        item_id: '',
        item_name: '',
        description: '',
        quantity: 1,
        unit_of_measurement: 'pcs',
        rate: 0,
        amount: 0,
        stock_on_hand: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (salesOrderItems.length > 1) {
      setSalesOrderItems(salesOrderItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = salesOrderItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    const discountAmount = formData.discount_type === 'percentage'
      ? (subtotal * formData.discount_value) / 100
      : formData.discount_value;

    const taxableAmount = subtotal - discountAmount;

    const tdsTcsAmount = formData.tds_tcs_type
      ? (taxableAmount * formData.tds_tcs_rate) / 100
      : 0;

    const total = formData.tds_tcs_type === 'TDS'
      ? taxableAmount + formData.shipping_charges + formData.adjustment + tdsTcsAmount
      : taxableAmount + formData.shipping_charges + formData.adjustment + tdsTcsAmount;

    return {
      subtotal,
      discountAmount,
      tdsTcsAmount,
      total
    };
  };

  const totals = calculateTotals();

  const handleAddSalesperson = () => {
    if (newSalesperson.name && newSalesperson.email) {
      const newId = (salespersons.length + 1).toString();
      const salesperson = { id: newId, ...newSalesperson };
      setSalespersons([...salespersons, salesperson]);
      setFormData({ ...formData, salesperson_id: newId, salesperson_name: newSalesperson.name });
      setNewSalesperson({ name: '', email: '' });
      setShowAddSalespersonForm(false);
      setShowSalespersonModal(false);
    }
  };

  const handleTDSSelection = (taxId: string) => {
    const tax = tdsTaxes.find(t => t.id === taxId);
    if (tax) {
      setSelectedTDSTax(taxId);
      setFormData({
        ...formData,
        tds_tcs_type: 'TDS',
        tds_tcs_rate: tax.rate
      });
    }
    setShowTDSModal(false);
  };

  const handleTCSSelection = (taxId: string) => {
    const tax = tcsTaxes.find(t => t.id === taxId);
    if (tax) {
      setSelectedTCSTax(taxId);
      setFormData({
        ...formData,
        tds_tcs_type: 'TCS',
        tds_tcs_rate: tax.rate
      });
    }
    setShowTCSModal(false);
  };

  const getSelectedTaxName = () => {
    if (formData.tds_tcs_type === 'TDS' && selectedTDSTax) {
      const tax = tdsTaxes.find(t => t.id === selectedTDSTax);
      return tax ? tax.name : '';
    } else if (formData.tds_tcs_type === 'TCS' && selectedTCSTax) {
      const tax = tcsTaxes.find(t => t.id === selectedTCSTax);
      return tax ? tax.name : '';
    }
    return '';
  };

  const handleSubmit = async (status: 'draft' | 'confirmed') => {
    try {
      setLoading(true);
      console.log('=== SUBMIT STARTED ===');
      console.log('Status:', status);

      if (!formData.customer_name || formData.customer_name.trim() === '') {
        alert('Please enter customer name');
        setLoading(false);
        return;
      }

      if (salesOrderItems.filter(item => item.item_name && item.quantity > 0).length === 0) {
        alert('Please add at least one item');
        setLoading(false);
        return;
      }

      const salesOrderData: any = {
        customer_id: null,
        customer_name: formData.customer_name.trim(),
        customer_email: null,
        customer_phone: null,
        sales_order_number: formData.sales_order_number,
        reference_number: formData.reference_number || null,
        sales_order_date: formData.sales_order_date,
        expected_shipment_date: formData.expected_shipment_date || null,
        payment_terms: formData.payment_terms,
        salesperson_id: formData.salesperson_id || null,
        salesperson_name: formData.salesperson_name || null,
        delivery_method: formData.delivery_method || null,
        status: status,
        subtotal: totals.subtotal,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        discount_amount: totals.discountAmount,
        tax_amount: 0,
        tds_tcs_type: formData.tds_tcs_type || null,
        tds_tcs_rate: formData.tds_tcs_rate || 0,
        tds_tcs_amount: totals.tdsTcsAmount,
        shipping_charges: formData.shipping_charges,
        adjustment: formData.adjustment,
        total_amount: totals.total,
        customer_notes: formData.customer_notes || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        items: salesOrderItems
          .filter(item => (item.item_id || item.item_name) && item.quantity > 0)
          .map(item => ({
            item_id: item.item_id || null,
            item_name: item.item_name || '',
            description: item.description || null,
            quantity: Number(item.quantity) || 0,
            unit_of_measurement: item.unit_of_measurement || 'pcs',
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0,
            stock_on_hand: Number(item.stock_on_hand) || 0
          }))
      };

      console.log('Sales Order Data to Submit:', salesOrderData);

      const response = await salesOrdersService.createSalesOrder(salesOrderData);

      console.log('Response from API:', response);

      if (response.success) {
        alert(`Sales Order ${status === 'draft' ? 'saved as draft' : 'confirmed'} successfully!`);
        navigate('/sales/sales-orders');
      }
    } catch (error: any) {
      console.error('Error creating sales order:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to create sales order';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sales/sales-orders')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">New Sales Order</h1>
              <p className="text-slate-600 mt-1">Create a new sales order for your customer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/sales/sales-orders')}
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              <Save size={20} />
              <span>Save as Draft</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('confirmed')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              <Send size={20} />
              <span>Confirm Order</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Phase 1: Customer Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Customer Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.customer_name}>
                      {customer.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sales Order Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sales Order# <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sales_order_number}
                  onChange={(e) => setFormData({ ...formData, sales_order_number: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                  readOnly={formData.auto_sales_order_number}
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reference#
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="Enter reference number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sales Order Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sales Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.sales_order_date}
                  onChange={(e) => setFormData({ ...formData, sales_order_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Expected Shipment Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expected Shipment Date
                </label>
                <input
                  type="date"
                  value={formData.expected_shipment_date}
                  onChange={(e) => setFormData({ ...formData, expected_shipment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Terms
                </label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="due_on_receipt">Due on Receipt</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                  <option value="net_60">Net 60</option>
                </select>
              </div>
            </div>
          </div>

          {/* Phase 2: Salesperson and Logistics */}
          <div className="mb-8 pt-8 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Salesperson & Delivery</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Salesperson */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Salesperson
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.salesperson_id}
                    onChange={(e) => {
                      const sp = salespersons.find(s => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        salesperson_id: e.target.value,
                        salesperson_name: sp?.name || ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a salesperson</option>
                    {salespersons.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowSalespersonModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Delivery Method
                </label>
                <select
                  value={formData.delivery_method}
                  onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select delivery method</option>
                  {deliveryMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Phase 3: Items Table with Searchable Dropdown */}
          <div className="mb-8 pt-8 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Items</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">ITEM DETAILS</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">QUANTITY</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">RATE</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">STOCK</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">AMOUNT</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {salesOrderItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={itemSearchQuery[index] || item.item_name || ''}
                            onChange={(e) => {
                              setItemSearchQuery({ ...itemSearchQuery, [index]: e.target.value });
                              setShowItemDropdown(index);
                            }}
                            onFocus={() => setShowItemDropdown(index)}
                            placeholder="Click to select item"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {showItemDropdown === index && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowItemDropdown(null)}
                              />
                              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-lg">
                                {getFilteredItems(index).map((availableItem) => (
                                  <div
                                    key={availableItem.id}
                                    onClick={() => handleItemSelect(index, availableItem)}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                                  >
                                    <div className="font-medium text-slate-800">{availableItem.item_name}</div>
                                    <div className="text-sm text-slate-600">
                                      Stock: {availableItem.current_stock || 0} {availableItem.unit_of_measurement || 'pcs'} | Rate: ₹{availableItem.unit_price || 0}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity || 0}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="1"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate || 0}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">
                          {item.stock_on_hand || 0} {item.unit_of_measurement || 'pcs'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-slate-800">
                          ₹{(item.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={salesOrderItems.length === 1}
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
              type="button"
              onClick={addNewItem}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span>Add New Line</span>
            </button>
          </div>

          {/* Financial Adjustments with TDS/TCS Modals */}
          <div className="mb-8 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Taxes & Discounts */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Adjustments</h3>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'amount' })}
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="percentage">%</option>
                      <option value="amount">₹</option>
                    </select>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* TDS/TCS with Modal Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    TDS/TCS
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTDSModal(true)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        {formData.tds_tcs_type === 'TDS' && getSelectedTaxName() ? getSelectedTaxName() : 'Select TDS Tax'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTCSModal(true)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        {formData.tds_tcs_type === 'TCS' && getSelectedTaxName() ? getSelectedTaxName() : 'Select TCS Tax'}
                      </button>
                    </div>
                    {formData.tds_tcs_type && (
                      <div className="text-sm text-slate-600">
                        {formData.tds_tcs_type} Rate: {formData.tds_tcs_rate}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Charges */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Shipping Charges
                  </label>
                  <input
                    type="number"
                    value={formData.shipping_charges}
                    onChange={(e) => setFormData({ ...formData, shipping_charges: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Adjustment */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Adjustment
                  </label>
                  <input
                    type="number"
                    value={formData.adjustment}
                    onChange={(e) => setFormData({ ...formData, adjustment: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium text-slate-800">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {formData.discount_value > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount:</span>
                      <span className="font-medium text-slate-800">-₹{totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {formData.tds_tcs_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{formData.tds_tcs_type} ({formData.tds_tcs_rate}%):</span>
                      <span className="font-medium text-slate-800">₹{totals.tdsTcsAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {formData.shipping_charges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Shipping:</span>
                      <span className="font-medium text-slate-800">₹{formData.shipping_charges.toFixed(2)}</span>
                    </div>
                  )}
                  {formData.adjustment !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Adjustment:</span>
                      <span className="font-medium text-slate-800">₹{formData.adjustment.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-300">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-slate-800">Total:</span>
                      <span className="text-lg font-bold text-blue-600">₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 4: Additional Information */}
          <div className="pt-8 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Additional Information</h2>

            <div className="space-y-4">
              {/* Customer Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer Notes
                </label>
                <textarea
                  value={formData.customer_notes}
                  onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                  rows={3}
                  placeholder="Add notes for the customer (visible on sales order)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Terms and Conditions
                </label>
                <textarea
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  rows={3}
                  placeholder="Enter terms and conditions"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-8 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/sales/sales-orders')}
              className="px-8 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              <Save size={20} />
              <span>Save as Draft</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('confirmed')}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              <Send size={20} />
              <span>Save and Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* TDS Modal */}
      {showTDSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Select TDS Tax</h2>
              <button
                onClick={() => setShowTDSModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {tdsTaxes.map((tax) => (
                <div
                  key={tax.id}
                  onClick={() => handleTDSSelection(tax.id)}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-800">{tax.name}</div>
                    <div className="text-sm text-slate-600">{tax.section}</div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">{tax.rate}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TCS Modal */}
      {showTCSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Select TCS Tax</h2>
              <button
                onClick={() => setShowTCSModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {tcsTaxes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No TCS taxes available. Add TCS taxes from settings.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tcsTaxes.map((tax) => (
                  <div
                    key={tax.id}
                    onClick={() => handleTCSSelection(tax.id)}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{tax.name}</div>
                      <div className="text-sm text-slate-600">{tax.natureOfCollection}</div>
                    </div>
                    <div className="text-lg font-semibold text-blue-600">{tax.rate}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salesperson Management Modal */}
      {showSalespersonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Manage Salespersons</h2>
              <button
                onClick={() => {
                  setShowSalespersonModal(false);
                  setShowAddSalespersonForm(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!showAddSalespersonForm ? (
              <>
                <div className="space-y-2 mb-4">
                  {salespersons.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-800">{sp.name}</div>
                        <div className="text-sm text-slate-600">{sp.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddSalespersonForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>New Salesperson</span>
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newSalesperson.name}
                    onChange={(e) => setNewSalesperson({ ...newSalesperson, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newSalesperson.email}
                    onChange={(e) => setNewSalesperson({ ...newSalesperson, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddSalespersonForm(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSalesperson}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Salesperson
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSalesOrderForm;
