import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CreditCard, DollarSign } from 'lucide-react';

interface PaymentEntry {
  id: string;
  mode: string;
  amount: number;
  reference: string;
  note: string;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customerName: string;
  customerMobile?: string;
  onComplete: (payments: PaymentEntry[], totalPaid: number) => void;
}

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', shortcut: 'F1' },
  { id: 'HDFC', label: 'HDFC Bank', shortcut: 'F2' },
  { id: 'ICICI', label: 'ICICI Bank', shortcut: 'F3' },
  { id: 'BAJAJ/ICICI', label: 'Bajaj / ICICI Bank', shortcut: '' },
  { id: 'CREDIT SALE', label: 'Credit Sale', shortcut: 'F4' },
  { id: 'D/B CREDIT CARD / EM', label: 'D/B Credit Card / EM', shortcut: '' },
];

const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  customerName,
  customerMobile,
  onComplete,
}) => {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [currentReference, setCurrentReference] = useState('');
  const [currentNote, setCurrentNote] = useState('');

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - totalPaid;

  // Suggested amounts based on remaining
  const suggestedAmounts = [
    remaining,
    Math.ceil(remaining / 10) * 10,
    Math.ceil(remaining / 50) * 50,
    Math.ceil(remaining / 100) * 100,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v > 0).slice(0, 4);

  useEffect(() => {
    if (isOpen) {
      // Reset when modal opens
      setPayments([]);
      setSelectedMethod(null);
      setCurrentAmount('');
      setCurrentReference('');
      setCurrentNote('');
    }
  }, [isOpen]);

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethod(methodId);
    // Auto-fill with remaining amount
    setCurrentAmount(remaining.toFixed(2));
  };

  const handleAddPayment = () => {
    if (!selectedMethod || !currentAmount || parseFloat(currentAmount) <= 0) {
      alert('Please select a payment method and enter a valid amount');
      return;
    }

    const amount = parseFloat(currentAmount);

    if (amount > remaining) {
      alert(`Amount cannot exceed remaining balance of ₹${remaining.toFixed(2)}`);
      return;
    }

    // For non-cash and non-credit payments, reference is required
    if (selectedMethod !== 'Cash' && selectedMethod !== 'CREDIT SALE' && !currentReference.trim()) {
      alert('Reference number is required for this payment method');
      return;
    }

    const newPayment: PaymentEntry = {
      id: `payment-${Date.now()}`,
      mode: selectedMethod,
      amount: amount,
      reference: currentReference.trim(),
      note: currentNote.trim(),
    };

    setPayments([...payments, newPayment]);
    setSelectedMethod(null);
    setCurrentAmount('');
    setCurrentReference('');
    setCurrentNote('');
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleComplete = () => {
    if (remaining > 0) {
      const confirm = window.confirm(
        `Remaining balance: ₹${remaining.toFixed(2)}. Do you want to complete this as a partial payment?`
      );
      if (!confirm) return;
    }

    if (payments.length === 0) {
      alert('Please add at least one payment');
      return;
    }

    onComplete(payments, totalPaid);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[1100px] max-h-[90vh] flex shadow-2xl overflow-hidden">
        {/* Left Sidebar - Payment Methods */}
        <div className="w-64 bg-gray-800 text-white p-6 overflow-y-auto">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CreditCard size={20} />
            Payment Methods
          </h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => handleSelectMethod(method.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedMethod === method.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{method.label}</span>
                  {method.shortcut && (
                    <span className="text-xs opacity-75">[{method.shortcut}]</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Split Payment</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedMethod ? `${selectedMethod} - Amount to be paid: ${formatCurrency(remaining)}` : 'Select a payment method to begin'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex">
            {/* Center - Payment Entry */}
            <div className="flex-1 p-8">
              {selectedMethod ? (
                <div className="space-y-6">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={remaining}
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full px-4 py-3 text-lg font-semibold border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      autoFocus
                    />

                    {/* Suggested Amounts */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {suggestedAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCurrentAmount(amount.toFixed(2))}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          ₹{amount.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reference Number */}
                  {selectedMethod !== 'Cash' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Reference Number {selectedMethod !== 'CREDIT SALE' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={currentReference}
                        onChange={(e) => setCurrentReference(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter transaction reference"
                      />
                    </div>
                  )}

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Note
                    </label>
                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Add note"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleAddPayment}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Add Payment
                    </button>
                  </div>

                  {/* Still Remaining */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Still remaining:</span>
                      <span className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <DollarSign size={64} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Select a payment method from the left</p>
                    <p className="text-sm mt-2">to start recording payment</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Customer Info & Summary */}
            <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
              {/* Customer Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Customer Info
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-semibold text-gray-800">{customerName}</p>
                  </div>
                  {customerMobile && (
                    <div>
                      <p className="text-xs text-gray-500">Mobile</p>
                      <p className="text-sm font-semibold text-gray-800">{customerMobile}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  Sales Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-xl font-bold text-gray-800">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  Payment Summary
                </h3>

                {/* Added Payments */}
                {payments.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-blue-700 uppercase">
                              {payment.mode}
                            </span>
                            <span className="text-sm font-bold text-blue-700">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          {payment.reference && (
                            <p className="text-xs text-gray-600 truncate">
                              Ref: {payment.reference}
                            </p>
                          )}
                          {payment.note && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {payment.note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemovePayment(payment.id)}
                          className="ml-2 p-1 text-red-500 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total amount paid</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining amount to be paid</span>
                    <span className={`text-lg font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Complete Sale Button */}
              <button
                onClick={handleComplete}
                disabled={payments.length === 0}
                className="w-full mt-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg text-lg"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default SplitPaymentModal;
