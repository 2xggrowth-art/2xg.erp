import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ItemSelector from '../shared/ItemSelector';
import { salesOrdersService, SalesOrderItem } from '../../services/sales-orders.service';
import { itemsService, Item } from '../../services/items.service';
import { customersService, Customer } from '../../services/customers.service';
import { salespersonService, Salesperson } from '../../services/salesperson.service';

const NewSalesOrderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState<{ [key: number]: string }>({});

  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
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

  const [formData, setFormData] = useState({
    customer_name: '',
    sales_order_number: '',
    auto_sales_order_number: true,
    sales_order_date: new Date().toISOString().split('T')[0],
    expected_shipment_date: '',
    status: 'draft',
    discount_type: 'percentage' as 'percentage' | 'amount',
    discount_value: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    shipping_charges: 0,
    adjustment: 0,
    notes: '',
    terms_and_conditions: ''
  });

  const [salesOrderItems, setSalesOrderItems] = useState<SalesOrderItem[]>([
    {
      item_id: '',
      item_name: '',
      description: '',
      quantity: 0,
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
        customersService.getAllCustomers({})
      ]);

      const itemsApiResponse = itemsRes.data;
      if (itemsApiResponse.success && itemsApiResponse.data) {
        setItems(itemsApiResponse.data);
      }

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

      const allSalespersons = salespersonService.getAllSalespersons();
      setSalespersons(allSalespersons);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleItemSelect = (index: number, item: Item) => {
    const updatedItems = [...salesOrderItems];
    const newQuantity = 1;
    const newRate = Number(item.unit_price) || 0;
    updatedItems[index] = {
      item_id: item.id,
      item_name: item.item_name || '',
      description: item.description || '',
      quantity: newQuantity,
      unit_of_measurement: item.unit_of_measurement || 'pcs',
      rate: newRate,
      amount: newQuantity * newRate,
      stock_on_hand: item.current_stock || 0,
      serial_numbers: (item.sku && newQuantity > 0)
        ? Array.from({ length: newQuantity }, (_, i) => `${item.sku}/${i + 1}`)
        : []
    };
    setSalesOrderItems(updatedItems);
    setShowItemDropdown(null);
    setItemSearchQuery({ ...itemSearchQuery, [index]: '' });
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
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const rate = field === 'rate' ? value : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;

      if (field === 'quantity') {
        const item = items.find(i => i.id === updatedItems[index].item_id);
        if (item && item.sku && quantity > 0) {
          updatedItems[index].serial_numbers = Array.from({ length: quantity }, (_, i) => `${item.sku}/${i + 1}`);
        } else {
          updatedItems[index].serial_numbers = [];
        }
      }
    }

    setSalesOrderItems(updatedItems);
  };

  const addNewItem = () => {
    setSalesOrderItems([
      ...salesOrderItems,
      {
        item_id: '',
        item_name: '',
        description: '',
        quantity: 0,
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

  const calculateSubtotal = () => {
    return salesOrderItems.reduce((sum, item) => sum + (item.amount || 0), 0);
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

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const gst = calculateGST().total;
    return subtotal - discount + gst + formData.shipping_charges + formData.adjustment;
  };

  const handleAddSalesperson = () => {
    if (newSalesperson.name.trim() && newSalesperson.email.trim()) {
      const addedSalesperson = salespersonService.addSalesperson(newSalesperson);
      setSalespersons([...salespersons, addedSalesperson]);
      setNewSalesperson({ name: '', email: '' });
      setShowAddSalespersonForm(false);
      setShowSalespersonModal(false);
      alert('Salesperson added successfully!');
    } else {
      alert('Please fill in both name and email');
    }
  };

  const handleSubmit = async (status: 'draft' | 'confirmed') => {
    try {
      setLoading(true);

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

      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscount();
      const gst = calculateGST();
      const totalAmount = calculateTotal();

      const salesOrderData: any = {
        customer_id: null,
        customer_name: formData.customer_name.trim(),
        customer_email: null,
        sales_order_number: formData.sales_order_number,
        order_date: formData.sales_order_date,
        expected_shipment_date: formData.expected_shipment_date || null,
        status: status,
        subtotal: subtotal,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        discount_amount: discountAmount,
        cgst_rate: formData.cgst_rate,
        cgst_amount: gst.cgst,
        sgst_rate: formData.sgst_rate,
        sgst_amount: gst.sgst,
        igst_rate: formData.igst_rate,
        igst_amount: gst.igst,
        tax_amount: gst.total,
        shipping_charges: formData.shipping_charges,
        adjustment: formData.adjustment,
        total_amount: totalAmount,
        notes: formData.notes || null,
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

      const response = await salesOrdersService.createSalesOrder(salesOrderData);

      if (response.success) {
        alert(`Sales Order ${status === 'draft' ? 'saved as draft' : 'confirmed'} successfully!`);
        navigate('/sales/sales-orders');
      }
    } catch (error: any) {
      console.error('Error creating sales order:', error);
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
    <div className="max-w-[98%] mx-auto w-full p-6">
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
              <span>Save and Send</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Customer Information */}
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
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8 pt-8 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Items</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[300px]">ITEM DETAILS</th>
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
                          <ItemSelector
                            items={items}
                            value={item.item_id || ''}
                            inputValue={item.item_name || ''}
                            onSelect={(selectedItem) => handleItemSelect(index, selectedItem)}
                            onInputChange={(value) => handleItemChange(index, 'item_name', value)}
                            placeholder="Click to select item"
                          />
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
                          value={item.quantity > 0 ? item.quantity : ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          step="1"
                          placeholder="Qty"
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

          {/* Financial Adjustments with GST */}
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

                {/* GST Section */}
                <div className="space-y-3">
                  {/* CGST */}
                  <div className="flex items-center gap-4">
                    <label className={`text-sm font-medium w-16 ${formData.igst_rate ? 'text-slate-400' : 'text-slate-700'}`}>
                      CGST
                    </label>
                    <select
                      value={formData.cgst_rate}
                      onChange={(e) => setFormData({ ...formData, cgst_rate: parseFloat(e.target.value) || 0, igst_rate: 0 })}
                      disabled={!!formData.igst_rate}
                      className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.igst_rate ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value={0}>0%</option>
                      <option value={2.5}>2.5%</option>
                      <option value={6}>6%</option>
                      <option value={9}>9%</option>
                    </select>
                    <span className="w-32 text-right font-medium">₹{calculateGST().cgst.toFixed(2)}</span>
                  </div>

                  {/* SGST */}
                  <div className="flex items-center gap-4">
                    <label className={`text-sm font-medium w-16 ${formData.igst_rate ? 'text-slate-400' : 'text-slate-700'}`}>
                      SGST
                    </label>
                    <select
                      value={formData.sgst_rate}
                      onChange={(e) => setFormData({ ...formData, sgst_rate: parseFloat(e.target.value) || 0, igst_rate: 0 })}
                      disabled={!!formData.igst_rate}
                      className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.igst_rate ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value={0}>0%</option>
                      <option value={2.5}>2.5%</option>
                      <option value={6}>6%</option>
                      <option value={9}>9%</option>
                    </select>
                    <span className="w-32 text-right font-medium">₹{calculateGST().sgst.toFixed(2)}</span>
                  </div>

                  {/* IGST */}
                  <div className="flex items-center gap-4">
                    <label className={`text-sm font-medium w-16 ${(formData.cgst_rate || formData.sgst_rate) ? 'text-slate-400' : 'text-slate-700'}`}>
                      IGST
                    </label>
                    <select
                      value={formData.igst_rate}
                      onChange={(e) => setFormData({ ...formData, igst_rate: parseFloat(e.target.value) || 0, cgst_rate: 0, sgst_rate: 0 })}
                      disabled={!!(formData.cgst_rate || formData.sgst_rate)}
                      className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${(formData.cgst_rate || formData.sgst_rate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                    </select>
                    <span className="w-32 text-right font-medium">₹{calculateGST().igst.toFixed(2)}</span>
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
                    <span className="font-medium text-slate-800">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {formData.discount_value > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount:</span>
                      <span className="font-medium text-slate-800">-₹{calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  {calculateGST().cgst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">CGST ({formData.cgst_rate}%):</span>
                      <span className="font-medium text-slate-800">₹{calculateGST().cgst.toFixed(2)}</span>
                    </div>
                  )}
                  {calculateGST().sgst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">SGST ({formData.sgst_rate}%):</span>
                      <span className="font-medium text-slate-800">₹{calculateGST().sgst.toFixed(2)}</span>
                    </div>
                  )}
                  {calculateGST().igst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">IGST ({formData.igst_rate}%):</span>
                      <span className="font-medium text-slate-800">₹{calculateGST().igst.toFixed(2)}</span>
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
                      <span className="text-lg font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="pt-8 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Additional Information</h2>

            <div className="space-y-4">
              {/* Customer Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
