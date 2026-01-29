import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search } from 'lucide-react';
import { deliveryChallansService, DeliveryChallan, DeliveryChallanItem } from '../../services/delivery-challans.service';
import apiClient from '../../services/api.client';

interface Item {
  id: string;
  item_name: string;
  unit_price: number;
  unit_of_measurement: string;
  current_stock: number;
}

const NewDeliveryChallanForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [challanNumber, setChallanNumber] = useState('');
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  // Form Data
  const [formData, setFormData] = useState({
    customer_name: '',
    location: 'Head Office',
    reference_number: '',
    challan_date: new Date().toISOString().split('T')[0],
    challan_type: 'Supply of Liquid Gas',
    notes: ''
  });

  // Items
  const [items, setItems] = useState<DeliveryChallanItem[]>([
    {
      item_name: '',
      description: '',
      quantity: 0,
      unit_of_measurement: 'pcs',
      rate: 0,
      amount: 0
    }
  ]);

  const [adjustment, setAdjustment] = useState<number>(0);

  useEffect(() => {
    fetchChallanNumber();
    fetchItems();
  }, []);

  const fetchChallanNumber = async () => {
    try {
      const response = await deliveryChallansService.generateChallanNumber();
      if (response.success && response.data) {
        setChallanNumber(response.data.challan_number);
      }
    } catch (error) {
      console.error('Error fetching challan number:', error);
      setChallanNumber('DC-00001');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await apiClient.get('/items');
      if (response.data.success && response.data.data) {
        setAvailableItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemSelect = (index: number, item: Item) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      item_id: item.id,
      item_name: item.item_name,
      rate: item.unit_price,
      unit_of_measurement: item.unit_of_measurement,
      stock_on_hand: item.current_stock,
      amount: updatedItems[index].quantity * item.unit_price
    };
    setItems(updatedItems);
    setShowItemDropdown(null);
    setItemSearchQuery('');
  };

  const handleItemChange = (index: number, field: keyof DeliveryChallanItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate amount if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        description: '',
        quantity: 0,
        unit_of_measurement: 'pcs',
        rate: 0,
        amount: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + adjustment;
  };

  const filteredItems = (index: number) => {
    if (!itemSearchQuery && showItemDropdown === index) {
      return availableItems;
    }
    return availableItems.filter(item =>
      item.item_name.toLowerCase().includes(itemSearchQuery.toLowerCase())
    );
  };

  const handleSubmit = async (status: 'draft' | 'confirmed') => {
    try {
      setLoading(true);

      // Validation
      if (!formData.customer_name || formData.customer_name.trim() === '') {
        alert('Please enter customer name');
        setLoading(false);
        return;
      }

      if (!formData.challan_date) {
        alert('Please select challan date');
        setLoading(false);
        return;
      }

      const validItems = items.filter(item => item.item_name && item.quantity > 0);
      if (validItems.length === 0) {
        alert('Please add at least one item with quantity');
        setLoading(false);
        return;
      }

      const challanData: DeliveryChallan = {
        ...formData,
        challan_number: challanNumber,
        status: status,
        subtotal: calculateSubtotal(),
        adjustment: adjustment,
        total_amount: calculateTotal(),
        items: validItems
      };

      console.log('Submitting delivery challan:', challanData);

      const response = await deliveryChallansService.createDeliveryChallan(challanData);

      if (response.success) {
        alert(`Delivery Challan ${challanNumber} ${status === 'draft' ? 'saved as draft' : 'confirmed'} successfully!`);
        navigate('/logistics/delivery-challan');
      }
    } catch (error: any) {
      console.error('Error creating delivery challan:', error);
      const errorMessage = error.message || 'Failed to create delivery challan';
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
          <div>
            <h1 className="text-3xl font-bold text-slate-800">New Delivery Challan</h1>
            <p className="text-slate-600 mt-1">Create a new delivery challan for goods movement</p>
          </div>
          <button
            onClick={() => navigate('/logistics/delivery-challan')}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Header Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  placeholder="Select or add a customer"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-2.5 text-slate-400" size={20} />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Head Office">Head Office</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Branch Office">Branch Office</option>
                <option value="Factory">Factory</option>
              </select>
            </div>

            {/* Delivery Challan Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Delivery Challan# <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={challanNumber}
                disabled
                className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700"
              />
            </div>

            {/* Reference# */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reference#
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                placeholder="Enter reference number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Delivery Challan Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Delivery Challan Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.challan_date}
                onChange={(e) => handleInputChange('challan_date', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Challan Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Challan Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.challan_type}
                onChange={(e) => handleInputChange('challan_type', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Supply of Liquid Gas">Supply of Liquid Gas</option>
                <option value="Job Work">Job Work</option>
                <option value="Supply on Approval">Supply on Approval</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Item Table</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Item Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 relative">
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => {
                            handleItemChange(index, 'item_name', e.target.value);
                            setItemSearchQuery(e.target.value);
                          }}
                          onFocus={() => setShowItemDropdown(index)}
                          placeholder="Type or click to select"
                          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        {showItemDropdown === index && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setShowItemDropdown(null);
                                setItemSearchQuery('');
                              }}
                            />
                            <div className="absolute left-0 top-full mt-1 w-80 max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-lg z-20">
                              {filteredItems(index).length > 0 ? (
                                filteredItems(index).map((availItem) => (
                                  <button
                                    key={availItem.id}
                                    onClick={() => handleItemSelect(index, availItem)}
                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-slate-800 text-sm">{availItem.item_name}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      Stock: {availItem.current_stock} {availItem.unit_of_measurement} | Rate: ₹{availItem.unit_price}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-slate-500">No items found</div>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 border border-slate-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          step="0.01"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.unit_of_measurement}
                          onChange={(e) => handleItemChange(index, 'unit_of_measurement', e.target.value)}
                          className="w-24 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="ltr">ltr</option>
                          <option value="mtr">mtr</option>
                          <option value="box">box</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-28 px-3 py-2 border border-slate-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 text-sm">
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="mt-6 flex justify-end">
              <div className="w-full md:w-96 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Sub Total</span>
                  <span className="text-slate-800 font-semibold">
                    ₹{calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-700 font-medium">Adjustment</span>
                  <input
                    type="number"
                    value={adjustment || ''}
                    onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-slate-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center py-3 border-t-2 border-slate-300">
                  <span className="text-lg font-bold text-slate-800">Total ( ₹ )</span>
                  <span className="text-xl font-bold text-slate-800">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any additional notes..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={() => navigate('/logistics/delivery-challan')}
              disabled={loading}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSubmit('confirmed')}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Saving...' : 'Save and Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDeliveryChallanForm;
