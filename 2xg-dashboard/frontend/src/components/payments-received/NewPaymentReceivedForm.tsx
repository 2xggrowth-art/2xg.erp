import { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentsReceivedService } from '../../services/payments-received.service';
import { customersService, Customer } from '../../services/customers.service';

const NewPaymentReceivedForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showExcessPaymentModal, setShowExcessPaymentModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Check for passed invoice data
  const invoiceFromState = location.state?.invoice;
  console.log('NewPaymentReceivedForm initialized. Location State:', location.state);

  const [formData, setFormData] = useState({
    customer_name: invoiceFromState?.customer_name || '',
    payment_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount_received: invoiceFromState?.balance_due || 0,
    bank_charges: 0,
    payment_mode: 'Cash',
    deposit_to: 'Petty Cash',
    location: 'Head Office',
    reference_number: invoiceFromState ? `Payment for ${invoiceFromState.invoice_number}` : '',
    notes: invoiceFromState ? `Payment received for Invoice ${invoiceFromState.invoice_number}` : ''
  });

  const [paymentModes] = useState<string[]>([
    'Cash',
    'UPI',
    'Bank Transfer',
    'Cheque',
    'Card',
    'Net Banking'
  ]);

  const [depositAccounts] = useState<string[]>([
    'Petty Cash',
    'Main Bank Account',
    'HDFC Current Account',
    'ICICI Savings Account',
    'Cash on Hand'
  ]);

  const [locations] = useState<string[]>([
    'Head Office',
    'Branch Office',
    'Warehouse 1',
    'Warehouse 2',
    'Regional Office'
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [paymentNumberRes, customersRes] = await Promise.all([
        paymentsReceivedService.generatePaymentNumber(),
        customersService.getAllCustomers({ isActive: true })
      ]);

      if (paymentNumberRes.success) {
        setFormData(prev => ({
          ...prev,
          payment_number: paymentNumberRes.data.payment_number
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

  const calculateNetAmount = () => {
    const netAmount = formData.amount_received - formData.bank_charges;
    return Math.max(0, netAmount);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('=== SUBMIT STARTED ===');

      // Validation
      if (!formData.customer_name || formData.customer_name.trim() === '') {
        alert('Please enter customer name');
        setLoading(false);
        return;
      }

      if (formData.amount_received <= 0) {
        alert('Please enter a valid amount');
        setLoading(false);
        return;
      }

      const netAmount = calculateNetAmount();

      // Check if there's excess payment (no invoice to apply to)
      if (netAmount > 0) {
        setShowExcessPaymentModal(true);
        setLoading(false);
        return;
      }

      await savePayment();
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      alert(error.message || 'Failed to record payment');
      setLoading(false);
    }
  };

  const savePayment = async () => {
    try {
      const netAmount = calculateNetAmount();

      const paymentData: any = {
        customer_name: formData.customer_name.trim(),
        payment_number: formData.payment_number,
        payment_date: formData.payment_date,
        payment_mode: formData.payment_mode,
        amount_received: formData.amount_received,
        bank_charges: formData.bank_charges,
        deposit_to: formData.deposit_to,
        location: formData.location,
        reference_number: formData.reference_number || null,
        invoice_id: invoiceFromState?.id || null, // Link payment to invoice
        invoice_number: invoiceFromState?.invoice_number || null, // Create linkage
        amount_used: 0,
        amount_excess: netAmount,
        status: 'recorded',
        notes: formData.notes || null
      };

      console.log('Payment Data to Submit:', paymentData);
      console.log('Current invoiceFromState:', invoiceFromState); // Debugging

      const response = await paymentsReceivedService.createPaymentReceived(paymentData);

      console.log('Response from API:', response);

      if (response.success) {
        alert('Payment recorded successfully!');
        if (invoiceFromState?.id) {
          navigate(`/sales/invoices/${invoiceFromState.id}`);
        } else {
          navigate('/sales/payment-received');
        }
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to record payment';
      alert(errorMessage);
      throw error;
    }
  };

  const handleConfirmExcessPayment = async () => {
    setShowExcessPaymentModal(false);
    setLoading(true);
    try {
      await savePayment();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sales/payment-received')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Record Payment</h1>
              <p className="text-slate-600 mt-1">Record a new payment from customer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/sales/payment-received')}
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              <Save size={20} />
              <span>Save as Paid</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Phase 1: Customer and Payment Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Payment Information</h2>

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

              {/* Payment Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment# <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.payment_number}
                  readOnly
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Amount Received */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount Received <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount_received || ''}
                  onChange={(e) => setFormData({ ...formData, amount_received: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Bank Charges */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bank Charges (if any)
                </label>
                <input
                  type="number"
                  value={formData.bank_charges || ''}
                  onChange={(e) => setFormData({ ...formData, bank_charges: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deposit To */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deposit To
                </label>
                <select
                  value={formData.deposit_to}
                  onChange={(e) => setFormData({ ...formData, deposit_to: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {depositAccounts.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Number */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="Enter reference number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="mb-8 pt-8 border-t border-slate-200">
            <div className="bg-slate-50 p-6 rounded-lg max-w-md ml-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount Received:</span>
                  <span className="font-medium text-slate-800">₹{formData.amount_received.toFixed(2)}</span>
                </div>
                {formData.bank_charges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Bank Charges:</span>
                    <span className="font-medium text-slate-800">-₹{formData.bank_charges.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-300">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-800">Net Amount:</span>
                    <span className="text-lg font-bold text-green-600">₹{calculateNetAmount().toFixed(2)}</span>
                  </div>
                </div>
                {calculateNetAmount() > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <strong>Excess Payment:</strong> This payment will be recorded as unearned revenue since no invoice was selected.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-8 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Additional Notes</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Add any additional notes about this payment"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-8 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/sales/payment-received')}
              className="px-8 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              <Save size={20} />
              <span>Save as Paid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Excess Payment Modal */}
      {showExcessPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle size={24} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Excess Payment</h2>
                <p className="text-slate-600">
                  The amount ₹{calculateNetAmount().toFixed(2)} will be deposited as <strong>Unearned Revenue</strong> since no invoice is selected.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExcessPaymentModal(false);
                  setLoading(false);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmExcessPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPaymentReceivedForm;
