import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveryChallansService, DeliveryChallan } from '../../services/delivery-challans.service';

const NewDeliveryChallanForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [challanNumber, setChallanNumber] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_number: '',
    alternate_phone: '',
    delivery_location_type: 'delivery in bangalore', // 'delivery in bangalore' or 'outside bangalore'
    delivery_address: '',
    product_name: '',
    pincode: '',
    free_accessories: '',
    salesperson_name: '',
    estimated_delivery_day: '',
    reverse_pickup: '',
    location: 'Head Office',
    reference_number: '',
    challan_date: new Date().toISOString().split('T')[0],
    challan_type: 'Supply of Liquid Gas',
    notes: ''
  });

  useEffect(() => {
    fetchChallanNumber();
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (status: 'draft' | 'confirmed') => {
    try {
      setLoading(true);

      // Validation
      if (!formData.invoice_number || formData.invoice_number.trim() === '') {
        alert('Please enter invoice number');
        setLoading(false);
        return;
      }

      if (!formData.alternate_phone || formData.alternate_phone.trim() === '') {
        alert('Please enter alternate phone number');
        setLoading(false);
        return;
      }

      if (formData.delivery_location_type === 'delivery in bangalore') {
        if (!formData.pincode || formData.pincode.trim() === '') {
          alert('Please enter pincode');
          setLoading(false);
          return;
        }
        if (!formData.reverse_pickup || formData.reverse_pickup.trim() === '') {
          alert('Please enter reverse pickup information');
          setLoading(false);
          return;
        }
      } else if (formData.delivery_location_type === 'outside bangalore') {
        if (!formData.delivery_address || formData.delivery_address.trim() === '') {
          alert('Please enter delivery address');
          setLoading(false);
          return;
        }
      }

      if (!formData.salesperson_name || formData.salesperson_name.trim() === '') {
        alert('Please enter sales person name');
        setLoading(false);
        return;
      }

      if (!formData.estimated_delivery_day || formData.estimated_delivery_day.trim() === '') {
        alert('Please enter estimated delivery day');
        setLoading(false);
        return;
      }

      if (!formData.free_accessories || formData.free_accessories.trim() === '') {
        alert('Please enter list of free accessories');
        setLoading(false);
        return;
      }

      const challanData: DeliveryChallan = {
        ...formData,
        challan_number: challanNumber,
        status: status,
        customer_name: formData.invoice_number, // Using invoice number as customer name for now
        subtotal: 0,
        total_amount: 0,
        items: []
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
          {/* BCH-AFS Sales Form Header */}
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-semibold text-slate-800">Fill BCH-AFS salesform</h2>
          </div>

          {/* Invoice Number - FIRST FIELD */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.invoice_number}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              placeholder="Empty"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Delivery Location Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Delivery Location Type
            </label>
            <select
              value={formData.delivery_location_type}
              onChange={(e) => handleInputChange('delivery_location_type', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="delivery in bangalore">delivery in bangalore</option>
              <option value="outside bangalore">outside bangalore</option>
            </select>
          </div>

          {/* Header Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Alternate Phone */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter Alternate Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                <div className="px-3 py-3 bg-slate-50 border-r border-slate-300 flex items-center gap-2">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-slate-700 font-medium">91</span>
                </div>
                <input
                  type="tel"
                  value={formData.alternate_phone}
                  onChange={(e) => handleInputChange('alternate_phone', e.target.value)}
                  placeholder="Enter Phone Number"
                  className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Conditional Fields Based on Location Type */}
            {formData.delivery_location_type === 'outside bangalore' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter delivery address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.delivery_address}
                  onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                  placeholder="Empty"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter Product Name {formData.delivery_location_type === 'outside bangalore' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                placeholder="Empty"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {formData.delivery_location_type === 'delivery in bangalore' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="Empty"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* List of Free Accessories */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter List of Free Accessories <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.free_accessories}
                onChange={(e) => handleInputChange('free_accessories', e.target.value)}
                placeholder="Empty"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sales Person Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter Sales Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.salesperson_name}
                onChange={(e) => handleInputChange('salesperson_name', e.target.value)}
                placeholder="Empty"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Estimated Delivery Day */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.delivery_location_type === 'outside bangalore' ? 'Estimated Delivery Day' : 'Enter Estimated Delivery Day'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.estimated_delivery_day}
                onChange={(e) => handleInputChange('estimated_delivery_day', e.target.value)}
                placeholder="Empty"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {formData.delivery_location_type === 'delivery in bangalore' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter reverse pick up <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.reverse_pickup}
                  onChange={(e) => handleInputChange('reverse_pickup', e.target.value)}
                  placeholder="Empty"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

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
