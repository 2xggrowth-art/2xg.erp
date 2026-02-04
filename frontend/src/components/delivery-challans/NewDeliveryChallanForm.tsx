import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { deliveryChallansService, DeliveryChallan } from '../../services/delivery-challans.service';
import { invoicesService } from '../../services/invoices.service';
import { salespersonService, Salesperson } from '../../services/salesperson.service';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  status: string;
  items?: any[];
}

const NewDeliveryChallanForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [challanNumber, setChallanNumber] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Salesperson state
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const [showAddSalespersonForm, setShowAddSalespersonForm] = useState(false);
  const [newSalesperson, setNewSalesperson] = useState({ name: '', email: '' });
  const [salespersonSearch, setSalespersonSearch] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_number: '',
    invoice_id: '',
    alternate_phone: '',
    delivery_location_type: 'delivery in bangalore',
    delivery_address: '',
    product_name: '',
    pincode: '',
    free_accessories: '',
    salesperson_id: '',
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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch challan number
      const challanRes = await deliveryChallansService.generateChallanNumber();
      if (challanRes.success && challanRes.data) {
        setChallanNumber(challanRes.data.challan_number);
      }

      // Fetch invoices
      const invoicesRes = await invoicesService.getAllInvoices({});
      if (invoicesRes.success && invoicesRes.data?.invoices) {
        setInvoices(invoicesRes.data.invoices);
      }

      // Fetch salespersons
      const allSalespersons = salespersonService.getAllSalespersons();
      setSalespersons(allSalespersons);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setChallanNumber('DC-00001');
    }
  };

  const handleInvoiceSelect = async (invoiceId: string) => {
    if (!invoiceId) {
      setSelectedInvoice(null);
      setFormData(prev => ({
        ...prev,
        invoice_id: '',
        invoice_number: '',
        customer_name: '',
        product_name: '',
        alternate_phone: ''
      }));
      return;
    }

    try {
      const response = await invoicesService.getInvoiceById(invoiceId);
      if (response.success && response.data) {
        const invoice = response.data;
        setSelectedInvoice(invoice);

        // Get product names from invoice items
        const productNames = invoice.items?.map((item: any) => item.item_name).join(', ') || '';

        setFormData(prev => ({
          ...prev,
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name || '',
          product_name: productNames,
          alternate_phone: invoice.customer_phone || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalespersonSelect = (salespersonId: string) => {
    const selectedSalesperson = salespersons.find(s => s.id === salespersonId);
    setFormData(prev => ({
      ...prev,
      salesperson_id: salespersonId,
      salesperson_name: selectedSalesperson?.name || ''
    }));
  };

  const handleAddSalesperson = () => {
    if (newSalesperson.name && newSalesperson.email) {
      const addedSalesperson = salespersonService.addSalesperson(newSalesperson);
      setSalespersons([...salespersons, addedSalesperson]);

      // Auto-select the newly added salesperson
      setFormData(prev => ({
        ...prev,
        salesperson_id: addedSalesperson.id,
        salesperson_name: addedSalesperson.name
      }));

      setNewSalesperson({ name: '', email: '' });
      setShowAddSalespersonForm(false);
      setShowSalespersonModal(false);
    }
  };

  const filteredSalespersons = salespersons.filter(person =>
    person.name.toLowerCase().includes(salespersonSearch.toLowerCase()) ||
    person.email.toLowerCase().includes(salespersonSearch.toLowerCase())
  );

  const handleSubmit = async (status: 'draft' | 'confirmed') => {
    try {
      setLoading(true);

      // Validation
      if (!formData.invoice_number || formData.invoice_number.trim() === '') {
        alert('Please select an invoice');
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
        alert('Please select a sales person');
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
        subtotal: selectedInvoice?.total_amount || 0,
        total_amount: selectedInvoice?.total_amount || 0,
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

          {/* Invoice Number - Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Invoice <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.invoice_id}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an invoice</option>
              {invoices.map(invoice => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - {invoice.customer_name} (Rs {invoice.total_amount?.toFixed(2)})
                </option>
              ))}
            </select>
            {selectedInvoice && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                <p><strong>Customer:</strong> {selectedInvoice.customer_name}</p>
                <p><strong>Amount:</strong> Rs {selectedInvoice.total_amount?.toFixed(2)}</p>
              </div>
            )}
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
                Product Name {formData.delivery_location_type === 'outside bangalore' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                placeholder="Auto-filled from invoice or enter manually"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
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

            {/* Sales Person Name - Dropdown with Manage */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sales Person <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.salesperson_id}
                  onChange={(e) => handleSalespersonSelect(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a salesperson</option>
                  {salespersons.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowSalespersonModal(true)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm whitespace-nowrap"
                >
                  Manage
                </button>
              </div>
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

      {/* Salesperson Management Modal */}
      {showSalespersonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Manage Salespersons</h2>
              <button
                onClick={() => {
                  setShowSalespersonModal(false);
                  setShowAddSalespersonForm(false);
                  setSalespersonSearch('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!showAddSalespersonForm ? (
              <>
                {/* Search */}
                <input
                  type="text"
                  value={salespersonSearch}
                  onChange={(e) => setSalespersonSearch(e.target.value)}
                  placeholder="Search salespersons..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4"
                />

                {/* List */}
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {filteredSalespersons.map((sp) => (
                    <div
                      key={sp.id}
                      onClick={() => {
                        handleSalespersonSelect(sp.id);
                        setShowSalespersonModal(false);
                      }}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <div>
                        <div className="font-medium text-slate-800">{sp.name}</div>
                        <div className="text-sm text-slate-600">{sp.email}</div>
                      </div>
                    </div>
                  ))}
                  {filteredSalespersons.length === 0 && (
                    <p className="text-center text-slate-500 py-4">No salespersons found</p>
                  )}
                </div>

                <button
                  onClick={() => setShowAddSalespersonForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>Add New Salesperson</span>
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
                    placeholder="Enter name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newSalesperson.email}
                    onChange={(e) => setNewSalesperson({ ...newSalesperson, email: e.target.value })}
                    placeholder="Enter email"
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

export default NewDeliveryChallanForm;
