import React, { useState } from 'react';
import { Search, User, X, Plus, Trash2, Check, Printer, Repeat, Lock } from 'lucide-react';
import { Customer, CreateCustomerData } from '../../services/customers.service';
import { Salesperson } from '../../services/salesperson.service';
import { PosSession } from '../../services/pos-sessions.service';
import { ExchangeItem } from '../../services/exchanges.service';
import { posCodesService } from '../../services/posCodes.service';
import SplitPaymentModal from './SplitPaymentModal';
import NewDeliveryChallanForm, { DeliveryFormData } from '../delivery-challans/NewDeliveryChallanForm';
import { CartItem } from './posTypes';

interface PosModalsProps {
  // Customer Search Modal
  showCustomerModal: boolean;
  customerSearch: string;
  filteredCustomers: Customer[];
  phoneNumberFromSearch: string;
  onCustomerSearchChange: (value: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onCloseCustomerModal: () => void;
  onOpenAddCustomerWithPhone: () => void;

  // Salesperson Search Modal
  showSalespersonModal: boolean;
  salespersonSearch: string;
  filteredSalespersons: Salesperson[];
  onSalespersonSearchChange: (value: string) => void;
  onSelectSalesperson: (salesperson: Salesperson) => void;
  onCloseSalespersonModal: () => void;
  onOpenManageSalesperson: () => void;

  // Manage Salesperson Modal
  showManageSalespersonModal: boolean;
  showAddSalespersonForm: boolean;
  salespersons: Salesperson[];
  newSalesperson: { name: string; email: string };
  onNewSalespersonChange: (data: { name: string; email: string }) => void;
  onShowAddSalespersonForm: (show: boolean) => void;
  onAddSalesperson: () => void;
  onDeleteSalesperson: (id: string) => void;
  onCloseManageSalespersonModal: () => void;

  // Payment Reference Modal
  showPaymentModal: boolean;
  selectedPaymentMode: string;
  referenceNumber: string;
  paidAmount: number;
  total: number;
  selectedCustomer: Customer | null;
  processingPayment: boolean;
  onReferenceNumberChange: (value: string) => void;
  onPaidAmountChange: (value: number) => void;
  onProcessPayment: (mode: string, refNumber: string, amountPaid: number) => void;
  onClosePaymentModal: () => void;

  // Bill Success Modal
  showBillSuccess: boolean;
  generatedInvoice: any;
  onPrintBill: () => void;
  onCompleteBill: () => void;

  // Add Customer Modal
  showAddCustomerModal: boolean;
  newCustomer: CreateCustomerData;
  gstTreatment: 'Consumer' | 'Registered';
  loading: boolean;
  onNewCustomerChange: (data: CreateCustomerData) => void;
  onGstTreatmentChange: (value: 'Consumer' | 'Registered') => void;
  onCreateCustomer: (e: React.FormEvent) => void;
  onCloseAddCustomerModal: () => void;

  // Delivery Challan Modal
  showDeliveryChallanModal: boolean;
  onSaveDeliveryData: (formData: DeliveryFormData, challanNumber: string) => void;
  onCloseDeliveryChallanModal: () => void;

  // Cash Movement Modal
  showCashMovementModal: boolean;
  activeSession: PosSession | null;
  cashMovementType: 'in' | 'out';
  cashMovementAmount: number;
  cashMovementLoading: boolean;
  onCashMovementAmountChange: (value: number) => void;
  onCashMovement: () => void;
  onCloseCashMovementModal: () => void;

  // Exchange Items Modal
  showExchangeModal: boolean;
  exchangeItems: ExchangeItem[];
  exchangeSearch: string;
  exchangeLoading: boolean;
  cart: CartItem[];
  onExchangeSearchChange: (value: string) => void;
  onSelectExchangeItem: (item: ExchangeItem) => void;
  onCloseExchangeModal: () => void;

  // Start Session Modal
  showStartSessionModal: boolean;
  startSessionData: { register: string; opened_by: string; opening_balance: number; opening_note: string };
  sessionLoading: boolean;
  onStartSessionDataChange: (data: { register: string; opened_by: string; opening_balance: number; opening_note: string }) => void;
  onStartSession: () => void;
  onCloseStartSessionModal: () => void;

  // Close Session Modal
  showCloseSessionModal: boolean;
  denominations: { note: number; count: number }[];
  onDenominationsChange: (denominations: { note: number; count: number }[]) => void;
  onCloseSession: () => void;
  onCloseCloseSessionModal: () => void;
  formatCurrency: (amount: number) => string;
  previousClosureAmount?: number;
  onCloseEmployeeVerified?: (name: string) => void;

  // Split Payment Modal
  showSplitPaymentModal: boolean;
  onCloseSplitPaymentModal: () => void;
  onSplitPaymentComplete: (payments: any[], totalPaid: number) => void;

  // Discount Modal
  showDiscountModal: boolean;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  subtotal: number;
  onDiscountTypeChange: (type: 'percentage' | 'amount') => void;
  onDiscountValueChange: (value: number) => void;
  onCloseDiscountModal: () => void;
  onRemoveDiscount: () => void;
}

const PosModals: React.FC<PosModalsProps> = ({
  // Customer Search Modal
  showCustomerModal,
  customerSearch,
  filteredCustomers,
  phoneNumberFromSearch,
  onCustomerSearchChange,
  onSelectCustomer,
  onCloseCustomerModal,
  onOpenAddCustomerWithPhone,

  // Salesperson Search Modal
  showSalespersonModal,
  salespersonSearch,
  filteredSalespersons,
  onSalespersonSearchChange,
  onSelectSalesperson,
  onCloseSalespersonModal,
  onOpenManageSalesperson,

  // Manage Salesperson Modal
  showManageSalespersonModal,
  showAddSalespersonForm,
  salespersons,
  newSalesperson,
  onNewSalespersonChange,
  onShowAddSalespersonForm,
  onAddSalesperson,
  onDeleteSalesperson,
  onCloseManageSalespersonModal,

  // Payment Reference Modal
  showPaymentModal,
  selectedPaymentMode,
  referenceNumber,
  paidAmount,
  total,
  selectedCustomer,
  processingPayment,
  onReferenceNumberChange,
  onPaidAmountChange,
  onProcessPayment,
  onClosePaymentModal,

  // Bill Success Modal
  showBillSuccess,
  generatedInvoice,
  onPrintBill,
  onCompleteBill,

  // Add Customer Modal
  showAddCustomerModal,
  newCustomer,
  gstTreatment,
  loading,
  onNewCustomerChange,
  onGstTreatmentChange,
  onCreateCustomer,
  onCloseAddCustomerModal,

  // Delivery Challan Modal
  showDeliveryChallanModal,
  onSaveDeliveryData,
  onCloseDeliveryChallanModal,

  // Cash Movement Modal
  showCashMovementModal,
  activeSession,
  cashMovementType,
  cashMovementAmount,
  cashMovementLoading,
  onCashMovementAmountChange,
  onCashMovement,
  onCloseCashMovementModal,

  // Exchange Items Modal
  showExchangeModal,
  exchangeItems,
  exchangeSearch,
  exchangeLoading,
  cart,
  onExchangeSearchChange,
  onSelectExchangeItem,
  onCloseExchangeModal,

  // Start Session Modal
  showStartSessionModal,
  startSessionData,
  sessionLoading,
  onStartSessionDataChange,
  onStartSession,
  onCloseStartSessionModal,

  // Close Session Modal
  showCloseSessionModal,
  denominations,
  onDenominationsChange,
  onCloseSession,
  onCloseCloseSessionModal,
  formatCurrency,
  previousClosureAmount,
  onCloseEmployeeVerified,

  // Split Payment Modal
  showSplitPaymentModal,
  onCloseSplitPaymentModal,
  onSplitPaymentComplete,

  // Discount Modal
  showDiscountModal,
  discountType,
  discountValue,
  subtotal,
  onDiscountTypeChange,
  onDiscountValueChange,
  onCloseDiscountModal,
  onRemoveDiscount,
}) => {
  // Employee code verification state for Start Session
  const [startCode, setStartCode] = useState('');
  const [startCodeError, setStartCodeError] = useState('');
  const [startCodeLoading, setStartCodeLoading] = useState(false);
  const [startCodeVerified, setStartCodeVerified] = useState(false);

  // Employee code verification state for Close Session
  const [closeCode, setCloseCode] = useState('');
  const [closeCodeError, setCloseCodeError] = useState('');
  const [closeCodeLoading, setCloseCodeLoading] = useState(false);
  const [closeCodeVerified, setCloseCodeVerified] = useState(false);
  const [closeEmployeeName, setCloseEmployeeName] = useState('');

  const handleStartCodeVerify = async () => {
    if (!startCode.trim()) {
      setStartCodeError('Please enter your employee code');
      return;
    }
    setStartCodeLoading(true);
    setStartCodeError('');
    try {
      const res = await posCodesService.verifyCode(startCode.trim());
      if (res.data.success) {
        setStartCodeVerified(true);
        onStartSessionDataChange({ ...startSessionData, opened_by: res.data.data.employee_name });
        setStartCodeError('');
      }
    } catch (error: any) {
      setStartCodeError(error.response?.data?.error || 'Invalid employee code');
    } finally {
      setStartCodeLoading(false);
    }
  };

  const handleCloseCodeVerify = async () => {
    if (!closeCode.trim()) {
      setCloseCodeError('Please enter your employee code');
      return;
    }
    setCloseCodeLoading(true);
    setCloseCodeError('');
    try {
      const res = await posCodesService.verifyCode(closeCode.trim());
      if (res.data.success) {
        setCloseCodeVerified(true);
        setCloseEmployeeName(res.data.data.employee_name);
        setCloseCodeError('');
        onCloseEmployeeVerified?.(res.data.data.employee_name);
      }
    } catch (error: any) {
      setCloseCodeError(error.response?.data?.error || 'Invalid employee code');
    } finally {
      setCloseCodeLoading(false);
    }
  };

  // Reset start code state when modal opens/closes
  const handleCloseStartModal = () => {
    setStartCode('');
    setStartCodeError('');
    setStartCodeVerified(false);
    onCloseStartSessionModal();
  };

  // Reset close code state when modal opens/closes
  const handleCloseCloseModal = () => {
    setCloseCode('');
    setCloseCodeError('');
    setCloseCodeVerified(false);
    setCloseEmployeeName('');
    onCloseCloseSessionModal();
  };

  return (
    <>
      {/* Customer Search Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[550px] max-h-[650px] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Select Customer</h2>
              <button onClick={onCloseCustomerModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>
            <div className="p-5 border-b border-gray-200">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or email..."
                  value={customerSearch}
                  onChange={(e) => onCustomerSearchChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <User size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-4">No customers found</p>
                  {phoneNumberFromSearch && (
                    <p className="text-xs text-blue-600">Searched number: {phoneNumberFromSearch}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => onSelectCustomer(customer)}
                      className="p-4 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-gray-800 text-sm">{customer.customer_name}</div>
                      <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                        {customer.mobile && <div>Mobile: {customer.mobile}</div>}
                        {customer.email && <div>Email: {customer.email}</div>}
                      </div>
                      {customer.current_balance && customer.current_balance > 0 && (
                        <div className="text-xs text-orange-600 mt-2 font-medium">
                          Outstanding: ₹{customer.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200">
              <button
                onClick={onOpenAddCustomerWithPhone}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add New Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salesperson Search Modal */}
      {showSalespersonModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[550px] max-h-[650px] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Select Salesperson</h2>
              <button onClick={onCloseSalespersonModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>
            <div className="p-5 border-b border-gray-200">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={salespersonSearch}
                  onChange={(e) => onSalespersonSearchChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {filteredSalespersons.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <User size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-4">No salesperson found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSalespersons.map((salesperson) => (
                    <div
                      key={salesperson.id}
                      onClick={() => onSelectSalesperson(salesperson)}
                      className="p-4 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-gray-800 text-sm">{salesperson.name}</div>
                      <div className="text-xs text-gray-500 mt-1.5">
                        Email: {salesperson.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200">
              <button
                onClick={onOpenManageSalesperson}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Manage Salesperson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Salesperson Modal */}
      {showManageSalespersonModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800">Manage Salespersons</h2>
              <button onClick={onCloseManageSalespersonModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>

            <div className="p-6">
              {!showAddSalespersonForm ? (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => onShowAddSalespersonForm(true)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add New Salesperson
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">All Salespersons</h3>
                    {salespersons.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <User size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No salespersons added yet</p>
                      </div>
                    ) : (
                      salespersons.map((sp) => (
                        <div key={sp.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div>
                            <div className="font-semibold text-gray-800">{sp.name}</div>
                            <div className="text-sm text-gray-500">{sp.email}</div>
                          </div>
                          <button
                            onClick={() => onDeleteSalesperson(sp.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Add New Salesperson</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newSalesperson.name}
                      onChange={(e) => onNewSalespersonChange({ ...newSalesperson, name: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={newSalesperson.email}
                      onChange={(e) => onNewSalespersonChange({ ...newSalesperson, email: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-5 border-t border-gray-200">
                    <button
                      onClick={() => { onShowAddSalespersonForm(false); onNewSalespersonChange({ name: '', email: '' }); }}
                      className="flex-1 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onAddSalesperson}
                      className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Reference Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Payment Details - {selectedPaymentMode}</h2>
              <button onClick={onClosePaymentModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Customer:</span>
                    <span className="text-sm font-bold text-gray-800">
                      {selectedCustomer?.customer_name || 'Walk-in Customer'}
                    </span>
                  </div>
                  {selectedCustomer?.mobile && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Mobile:</span>
                      <span className="text-sm font-bold text-gray-800">{selectedCustomer.mobile}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
                    <span className="text-base font-medium text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {selectedPaymentMode === 'CREDIT SALE' ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          max={total}
                          step="0.01"
                          placeholder="Enter amount paid"
                          value={paidAmount || ''}
                          onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the amount paid now (can be 0 for full credit)
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remaining Amount
                      </label>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Balance Due:</span>
                          <span className="text-xl font-bold text-orange-600">
                            ₹{(total - (paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter transaction reference (if any)"
                        value={referenceNumber}
                        onChange={(e) => onReferenceNumberChange(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number {selectedPaymentMode !== 'Cash' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="Enter transaction reference number"
                      value={referenceNumber}
                      onChange={(e) => onReferenceNumberChange(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the bank transaction reference or approval code
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClosePaymentModal}
                  disabled={processingPayment}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onProcessPayment(selectedPaymentMode, referenceNumber, paidAmount)}
                  disabled={processingPayment || (!referenceNumber && selectedPaymentMode !== 'Cash' && selectedPaymentMode !== 'CREDIT SALE')}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Success Modal */}
      {showBillSuccess && generatedInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex flex-col items-center p-8 border-b border-gray-200 bg-gradient-to-br from-green-50 to-blue-50">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Check size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Bill Created Successfully!</h2>
              <p className="text-gray-600">Invoice #{generatedInvoice.invoice_number}</p>
            </div>

            <div className="p-6">
              {/* Customer & Payment Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase">Customer Details</h3>
                  <p className="text-sm font-bold text-gray-800">{generatedInvoice.customer_name}</p>
                  {selectedCustomer?.mobile && (
                    <p className="text-xs text-gray-600 mt-1">{selectedCustomer.mobile}</p>
                  )}
                  {selectedCustomer?.email && (
                    <p className="text-xs text-gray-600">{selectedCustomer.email}</p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase">Payment Details</h3>
                  <p className="text-sm font-bold text-green-700">{generatedInvoice.paymentMode}</p>
                  {generatedInvoice.referenceNumber && (
                    <p className="text-xs text-gray-600 mt-1">Ref: {generatedInvoice.referenceNumber}</p>
                  )}
                  <p className="text-xs text-gray-600">{generatedInvoice.createdAt}</p>
                </div>
              </div>

              {/* Salesperson Details */}
              {generatedInvoice.salesperson_name && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-bold text-gray-600 mb-1 uppercase">Salesperson</h3>
                  <p className="text-sm font-bold text-purple-700">{generatedInvoice.salesperson_name}</p>
                </div>
              )}

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">ITEM</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">QTY</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">RATE</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {generatedInvoice.items.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">{item.item_name}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-800">
                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-gray-700">Total Amount:</span>
                  <span className="text-3xl font-bold text-green-600">
                    ₹{generatedInvoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {generatedInvoice.paymentMode === 'CREDIT SALE' && generatedInvoice.balanceDue > 0 && (
                  <>
                    <div className="border-t border-gray-300 pt-3 mt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Amount Paid:</span>
                        <span className="text-lg font-semibold text-green-600">
                          ₹{generatedInvoice.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Balance Due:</span>
                        <span className="text-lg font-semibold text-orange-600">
                          ₹{generatedInvoice.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="bg-orange-100 border border-orange-300 rounded px-3 py-2 text-center">
                        <span className="text-sm font-bold text-orange-700">CREDIT SALE - PAYMENT PENDING</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onPrintBill}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Print Bill
                </button>
                <button
                  onClick={onCompleteBill}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800">Add Customer</h2>
              <button onClick={onCloseAddCustomerModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>
            <form onSubmit={onCreateCustomer} className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Personal Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Smith"
                      value={newCustomer.display_name}
                      onChange={(e) => onNewCustomerChange({ ...newCustomer, display_name: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9999999999"
                      value={newCustomer.mobile}
                      onChange={(e) => onNewCustomerChange({ ...newCustomer, mobile: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <input
                      type="email"
                      placeholder="e.g. customername@domain.com"
                      value={newCustomer.email}
                      onChange={(e) => onNewCustomerChange({ ...newCustomer, email: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                    <input
                      type="text"
                      placeholder="#House/Apartment no., Street name"
                      value={newCustomer.address}
                      onChange={(e) => onNewCustomerChange({ ...newCustomer, address: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        placeholder="Area name"
                        value={newCustomer.city}
                        onChange={(e) => onNewCustomerChange({ ...newCustomer, city: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <select
                        value={newCustomer.state}
                        onChange={(e) => onNewCustomerChange({ ...newCustomer, state: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Gujarat">Gujarat</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Tax Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Treatment <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={gstTreatment}
                    onChange={(e) => {
                      const value = e.target.value as 'Consumer' | 'Registered';
                      onGstTreatmentChange(value);
                      if (value === 'Consumer') {
                        onNewCustomerChange({ ...newCustomer, gstin: '', company_name: '' });
                      }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Consumer">Consumer</option>
                    <option value="Registered">Registered Business - Regular</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onCloseAddCustomerModal}
                  className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Split Payment Modal */}
      <SplitPaymentModal
        isOpen={showSplitPaymentModal}
        onClose={onCloseSplitPaymentModal}
        totalAmount={total}
        customerName={selectedCustomer?.customer_name || 'Walk-in Customer'}
        customerMobile={selectedCustomer?.mobile}
        onComplete={onSplitPaymentComplete}
      />

      {/* Delivery Challan Modal */}
      {showDeliveryChallanModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[700px] max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <NewDeliveryChallanForm
              isModal
              isPosMode
              onClose={onCloseDeliveryChallanModal}
              onSuccess={onCloseDeliveryChallanModal}
              onSaveDeliveryData={onSaveDeliveryData}
            />
          </div>
        </div>
      )}

      {/* Cash Movement Modal */}
      {showCashMovementModal && activeSession && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {cashMovementType === 'in' ? 'Cash In' : 'Cash Out'}
              </h3>
              <button onClick={onCloseCashMovementModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4 text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Current Cash In:</span>
                  <span className="font-medium text-green-600">₹{activeSession.cash_in.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Cash Out:</span>
                  <span className="font-medium text-orange-600">₹{activeSession.cash_out.toFixed(2)}</span>
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashMovementAmount || ''}
                onChange={(e) => onCashMovementAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={onCloseCashMovementModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={onCashMovement}
                disabled={cashMovementLoading || cashMovementAmount <= 0}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  cashMovementType === 'in'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50`}
              >
                {cashMovementLoading ? 'Processing...' : `Record Cash ${cashMovementType === 'in' ? 'In' : 'Out'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Items Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[600px] max-h-[700px] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Exchange Items</h2>
                <p className="text-xs text-gray-500 mt-1">Select listed 2nd hand items to add to cart</p>
              </div>
              <button onClick={onCloseExchangeModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>
            <div className="p-5 border-b border-gray-200">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exchange items by name..."
                  value={exchangeSearch}
                  onChange={(e) => onExchangeSearchChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {exchangeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                </div>
              ) : exchangeItems.filter(ei =>
                ei.item_name.toLowerCase().includes(exchangeSearch.toLowerCase()) ||
                (ei.customer_name || '').toLowerCase().includes(exchangeSearch.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Repeat size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-1">No listed exchange items found</p>
                  <p className="text-xs text-gray-400">Items must be marked as "Listed" in the Exchanges page first</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exchangeItems
                    .filter(ei =>
                      ei.item_name.toLowerCase().includes(exchangeSearch.toLowerCase()) ||
                      (ei.customer_name || '').toLowerCase().includes(exchangeSearch.toLowerCase())
                    )
                    .map((exchangeItem) => {
                      const alreadyInCart = cart.some(c => c.exchange_item_id === exchangeItem.id);
                      return (
                        <div
                          key={exchangeItem.id}
                          onClick={() => !alreadyInCart && onSelectExchangeItem(exchangeItem)}
                          className={`p-4 border rounded-lg transition-colors flex justify-between items-center ${
                            alreadyInCart
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{exchangeItem.item_name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                                exchangeItem.condition === 'good' ? 'bg-green-100 text-green-700' :
                                exchangeItem.condition === 'ok' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {exchangeItem.condition.toUpperCase()}
                              </span>
                              {exchangeItem.customer_name && (
                                <span className="text-xs text-gray-500">From: {exchangeItem.customer_name}</span>
                              )}
                            </div>
                            {alreadyInCart && (
                              <div className="text-xs text-blue-600 mt-1 font-medium">Already in cart</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {exchangeItem.estimated_price != null
                                ? `₹${exchangeItem.estimated_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : '₹0.00'}
                            </div>
                            <div className="text-[10px] text-orange-600 font-medium mt-0.5">EXCHANGE</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartSessionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[450px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Start New Session</h2>
              <button onClick={handleCloseStartModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>

            {!startCodeVerified ? (
              /* Step 1: Employee Code Verification */
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center py-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Lock size={24} className="text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 text-center">Enter your employee code to continue</p>
                </div>
                <div>
                  <input
                    type="password"
                    value={startCode}
                    onChange={(e) => { setStartCode(e.target.value); setStartCodeError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleStartCodeVerify(); }}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Employee Code"
                    autoFocus
                  />
                </div>
                {startCodeError && (
                  <p className="text-red-500 text-sm text-center">{startCodeError}</p>
                )}
              </div>
            ) : (
              /* Step 2: Session Details (after code verified) */
              <div className="p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">Verified as <strong>{startSessionData.opened_by}</strong></span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Register Name
                  </label>
                  <input
                    type="text"
                    value={startSessionData.register}
                    onChange={(e) => onStartSessionDataChange({ ...startSessionData, register: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="billing desk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Cash Balance
                  </label>
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent px-4">
                    <span className="text-gray-500">₹</span>
                    <input
                      type="number"
                      value={startSessionData.opening_balance}
                      onChange={(e) => onStartSessionDataChange({ ...startSessionData, opening_balance: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-transparent border-none px-2 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    value={startSessionData.opening_note}
                    onChange={(e) => onStartSessionDataChange({ ...startSessionData, opening_note: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter any details for future reference"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCloseStartModal}
                disabled={sessionLoading || startCodeLoading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {!startCodeVerified ? (
                <button
                  onClick={handleStartCodeVerify}
                  disabled={startCodeLoading || !startCode.trim()}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startCodeLoading ? 'Verifying...' : 'Verify'}
                </button>
              ) : (
                <button
                  onClick={onStartSession}
                  disabled={sessionLoading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sessionLoading ? 'Starting...' : 'Start Session'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {showCloseSessionModal && activeSession && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-xl w-[550px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Close Session</h2>
              <button onClick={handleCloseCloseModal}>
                <X size={22} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            </div>

            {!closeCodeVerified ? (
              /* Step 1: Employee Code Verification */
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center py-4">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Lock size={24} className="text-red-600" />
                  </div>
                  <p className="text-sm text-gray-600 text-center">Enter your employee code to close this session</p>
                  <p className="text-xs text-gray-400 mt-1">{activeSession.session_number} - {activeSession.register}</p>
                </div>
                <div>
                  <input
                    type="password"
                    value={closeCode}
                    onChange={(e) => { setCloseCode(e.target.value); setCloseCodeError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCloseCodeVerify(); }}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Employee Code"
                    autoFocus
                  />
                </div>
                {closeCodeError && (
                  <p className="text-red-500 text-sm text-center">{closeCodeError}</p>
                )}
              </div>
            ) : (
              /* Step 2: Close Session Details (after code verified) */
              <div className="p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">Closing as <strong>{closeEmployeeName}</strong></span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Session:</span>
                      <span className="ml-2 font-semibold text-gray-800">{activeSession.session_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Register:</span>
                      <span className="ml-2 font-semibold text-gray-800">{activeSession.register}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Opened By:</span>
                      <span className="ml-2 font-semibold text-gray-800">{activeSession.opened_by}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Sales:</span>
                      <span className="ml-2 font-semibold text-green-600">{formatCurrency(activeSession.total_sales)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opening Balance
                    </label>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5">
                      <span className="text-gray-500">₹</span>
                      <span className="ml-2 text-gray-700">{activeSession.opening_balance.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cash In
                    </label>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5">
                      <span className="text-gray-500">₹</span>
                      <span className="ml-2 text-gray-700">{activeSession.cash_in.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Previous Session Closure */}
                {previousClosureAmount !== undefined && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Previous session closure:</span>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(previousClosureAmount)}</span>
                  </div>
                )}

                {/* Denomination Grid */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Cash Denomination Count
                  </label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      <span>Note</span>
                      <span className="text-center">Count</span>
                      <span className="text-right">Total</span>
                    </div>
                    {denominations.map((d, idx) => (
                      <div key={d.note} className={`grid grid-cols-3 items-center px-4 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <span className="text-sm font-medium text-gray-700">₹{d.note.toFixed(2)}</span>
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min="0"
                            value={d.count || ''}
                            onChange={(e) => {
                              const newDenominations = [...denominations];
                              newDenominations[idx].count = parseInt(e.target.value) || 0;
                              onDenominationsChange(newDenominations);
                            }}
                            className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-right">
                          ₹{(d.note * d.count).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 items-center px-4 py-3 bg-blue-50 border-t-2 border-blue-200">
                      <span className="text-sm font-bold text-gray-800">Total</span>
                      <span></span>
                      <span className="text-sm font-bold text-blue-700 text-right">
                        ₹{denominations.reduce((sum, d) => sum + d.note * d.count, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Once closed, this session cannot be reopened. All sales have been recorded.
                  </p>
                </div>
              </div>
            )}

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCloseCloseModal}
                disabled={sessionLoading || closeCodeLoading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {!closeCodeVerified ? (
                <button
                  onClick={handleCloseCodeVerify}
                  disabled={closeCodeLoading || !closeCode.trim()}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {closeCodeLoading ? 'Verifying...' : 'Verify'}
                </button>
              ) : (
                <button
                  onClick={onCloseSession}
                  disabled={sessionLoading}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {sessionLoading ? 'Closing...' : 'Close Session'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Apply Discount</h3>
              <button onClick={onCloseDiscountModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-sm text-gray-500 mb-4">
                Subtotal: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onDiscountTypeChange('percentage')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => onDiscountTypeChange('amount')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Amount (₹)
                </button>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : subtotal}
                step="0.01"
                value={discountValue || ''}
                onChange={(e) => {
                  let val = parseFloat(e.target.value) || 0;
                  if (discountType === 'percentage' && val > 100) val = 100;
                  if (discountType === 'amount' && val > subtotal) val = subtotal;
                  onDiscountValueChange(val);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                autoFocus
              />
              {discountValue > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span className="text-green-700 font-medium">-₹{(discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 mt-1">
                    <span>New Total:</span>
                    <span>₹{Math.max(0, subtotal - (discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={onRemoveDiscount}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Remove Discount
              </button>
              <button
                onClick={onCloseDiscountModal}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PosModals;
