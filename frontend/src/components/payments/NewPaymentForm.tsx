import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { paymentsService, CreatePaymentData } from '../../services/payments.service';
import { vendorsService } from '../../services/vendors.service';
import { billsService, Bill } from '../../services/bills.service';

interface Vendor {
  id: string;
  supplier_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

type PaymentTab = 'bill' | 'advance';

interface BillSelection {
  bill_id: string;
  bill_number: string;
  bill_amount: number;
  amount_allocated: number;
}

const NewPaymentForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PaymentTab>('bill');
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState<CreatePaymentData>({
    vendor_id: '',
    vendor_name: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: '',
    reference_number: '',
    amount: 0,
    currency: 'INR',
    exchange_rate: 1,
    notes: '',
    payment_account: '',
    deposit_to: '',
  });

  const [selectedBills, setSelectedBills] = useState<BillSelection[]>([]);
  const [location, setLocation] = useState('Head Office');

  // Payment modes
  const paymentModes = [
    'Cash',
    'HDFC BANK',
    'ICICI BANK',
    'BAJAJ/ICICI',
    'D/B CREDIT CARD',
    'HDFC (Hub)',
    'HDFC (Center)',
    'ICICI',
    'Dhanalakhmi',
  ];

  const paymentAccounts = [
    'Petty Cash',
    'Operating Bank Account',
    'Savings Account',
    'Cash on Hand',
  ];

  useEffect(() => {
    fetchVendors();
    if (isEditMode) {
      fetchPaymentDetails();
    } else {
      generatePaymentNumber();
    }
  }, [id]);

  useEffect(() => {
    if (formData.vendor_id) {
      fetchVendorBills(formData.vendor_id);
    }
  }, [formData.vendor_id]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentsService.getPaymentById(id!);
      if (response.success && response.data) {
        const payment = response.data;
        setFormData({
          vendor_id: payment.vendor_id || '',
          vendor_name: payment.vendor_name,
          payment_date: payment.payment_date.split('T')[0],
          payment_mode: payment.payment_mode,
          reference_number: payment.reference_number || '',
          amount: payment.amount,
          currency: payment.currency,
          exchange_rate: payment.exchange_rate,
          notes: payment.notes || '',
          payment_account: payment.payment_account || '',
          deposit_to: payment.deposit_to || '',
        });
        setPaymentNumber(payment.payment_number);
        // Note: Retrieving selected bills allocation is complex if not returned clearly by API.
        // For now, focusing on basic details editing.
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      alert('Failed to fetch payment details');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchVendorBills = async (vendorId: string) => {
    try {
      const response = await billsService.getAllBills({
        vendor_id: vendorId,
        status: 'open'  // Only fetch unpaid bills
      });
      setUnpaidBills(response.data);
    } catch (error) {
      console.error('Error fetching vendor bills:', error);
    }
  };

  const generatePaymentNumber = async () => {
    try {
      const response = await paymentsService.generatePaymentNumber();
      setPaymentNumber(response.data.payment_number);
    } catch (error) {
      console.error('Error generating payment number:', error);
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
      setSelectedBills([]);
    }
  };

  const handleBillSelection = (bill: Bill) => {
    const existingBill = selectedBills.find(b => b.bill_id === bill.id);
    if (existingBill) {
      // Remove bill
      setSelectedBills(selectedBills.filter(b => b.bill_id !== bill.id));
    } else {
      // Add bill
      setSelectedBills([...selectedBills, {
        bill_id: bill.id,
        bill_number: bill.bill_number,
        bill_amount: bill.balance_due || bill.total_amount,
        amount_allocated: bill.balance_due || bill.total_amount,
      }]);
    }
  };

  const handleAllocationChange = (billId: string, amount: number) => {
    setSelectedBills(selectedBills.map(bill =>
      bill.bill_id === billId ? { ...bill, amount_allocated: amount } : bill
    ));
  };

  // Sync total amount with selected bills
  useEffect(() => {
    if (activeTab === 'bill' && !isEditMode) { // Only sync in create mode to avoid overwriting fetched amount
      const totalAllocated = selectedBills.reduce((sum, bill) => sum + bill.amount_allocated, 0);
      setFormData(prev => ({ ...prev, amount: totalAllocated }));
    }
  }, [selectedBills, activeTab, isEditMode]);

  const calculateTotalAmount = () => {
    return formData.amount;
  };

  const validateForm = (saveType: 'draft' | 'paid'): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor_id) {
      newErrors.vendor = 'Please select a vendor';
    }

    // Relaxed validation for drafts
    if (saveType === 'paid') {
      if (!formData.payment_mode) {
        newErrors.payment_mode = 'Please select a payment mode';
      }

      if (!formData.payment_account) {
        newErrors.payment_account = 'Please select payment account';
      }

      const totalAmount = calculateTotalAmount();
      if (totalAmount <= 0) {
        newErrors.amount = "Amount entered doesn't seem right.";
      }

      if (activeTab === 'bill' && selectedBills.length === 0 && !isEditMode) {
        newErrors.bills = 'Please select at least one bill to pay';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (_saveType: 'draft' | 'paid') => {
    if (!validateForm(_saveType)) {
      return;
    }

    const totalAmount = calculateTotalAmount();

    // Check for excess payment
    if (activeTab === 'bill' && selectedBills.length > 0) {
      const totalBillAmount = selectedBills.reduce((sum, bill) => sum + bill.bill_amount, 0);
      if (totalAmount > totalBillAmount) {
        const confirmed = window.confirm(
          `You're about to record an excess payment\n\nThe amount you're recording is more than the total amount of the bills associated with this payment.\n\nThis will be stored as credits for the vendor.\n\nDo you want to continue?`
        );
        if (!confirmed) {
          return;
        }
      }
    }

    try {
      setLoading(true);

      const paymentData: CreatePaymentData = {
        ...formData,
        amount: totalAmount,
        allocations: activeTab === 'bill' ? selectedBills.map(bill => ({
          bill_id: bill.bill_id,
          bill_number: bill.bill_number,
          amount_allocated: bill.amount_allocated,
        })) : undefined,
        status: _saveType === 'paid' ? 'completed' : 'draft'
      };

      if (isEditMode) {
        await paymentsService.updatePayment(id!, paymentData);
        alert('Payment updated successfully');
      } else {
        await paymentsService.createPayment(paymentData);
        alert('The payment made to the vendor has been recorded.');
      }

      navigate('/purchases/payments-made');
    } catch (error: any) {
      console.error('Error saving payment:', error);
      alert(error.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Payment' : (activeTab === 'bill' ? 'Bill Payment' : 'Vendor Advance')}
          </h1>
          <button
            onClick={() => navigate('/purchases/payments-made')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('bill')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'bill'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Bill Payment
          </button>
          <button
            onClick={() => setActiveTab('advance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'advance'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Vendor Advance
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Vendor Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.supplier_name}
                </option>
              ))}
            </select>
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
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Head Office">Head Office</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Branch Office">Branch Office</option>
            </select>
          </div>

          {/* Payment Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment #<span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generatePaymentNumber}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Regenerate payment number"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Payment Mode</option>
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
            {errors.payment_mode && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_mode}</p>
            )}
          </div>

          {/* Paid Through */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid Through<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_account}
              onChange={(e) => setFormData({ ...formData, payment_account: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Account</option>
              {paymentAccounts.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
            {errors.payment_account && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_account}</p>
            )}
          </div>

          {/* Payment Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date<span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bills Selection (only for Bill Payment tab) */}
          {activeTab === 'bill' && unpaidBills.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bills to Pay
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bill Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Bill Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount to Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unpaidBills.map((bill) => {
                      const selected = selectedBills.find(b => b.bill_id === bill.id);
                      return (
                        <tr key={bill.id} className={selected ? 'bg-blue-50' : ''}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={() => handleBillSelection(bill)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600">
                            {bill.bill_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {bill.due_date ? new Date(bill.due_date).toLocaleDateString('en-IN') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ₹{(bill.balance_due || bill.total_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {selected ? (
                              <input
                                type="number"
                                value={selected.amount_allocated}
                                onChange={(e) => handleAllocationChange(bill.id, parseFloat(e.target.value) || 0)}
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                step="0.01"
                                min="0"
                                max={bill.balance_due || bill.total_amount}
                              />
                            ) : (
                              '₹0.00'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {errors.bills && (
                <p className="mt-1 text-sm text-red-600">{errors.bills}</p>
              )}
            </div>
          )}

          {/* Reference Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reference number"
            />
          </div>

          {/* Amount (Replaces Bank Charges) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
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

          {/* Total Amount Display */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-2xl">₹{calculateTotalAmount().toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/purchases/payments-made')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('paid')}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save as Paid'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPaymentForm;