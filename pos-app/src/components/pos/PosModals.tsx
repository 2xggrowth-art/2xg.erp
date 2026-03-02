import React, { useState, useEffect } from 'react';
import { Search, User, X, Plus, Trash2, Check, Printer, Lock } from 'lucide-react';
import { Customer, CreateCustomerData } from '../../services/customers.service';
import { Salesperson } from '../../services/salesperson.service';
import { PosSession } from '../../services/pos-sessions.service';
import { printerService, PrinterInfo } from '../../services/printer.service';
import SplitPaymentModal from './SplitPaymentModal';
import { CartItem, HeldCart } from './posTypes';

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

  // Cash Movement Modal
  showCashMovementModal: boolean;
  activeSession: PosSession | null;
  cashMovementType: 'in' | 'out';
  cashMovementAmount: number;
  cashMovementLoading: boolean;
  onCashMovementAmountChange: (value: number) => void;
  onCashMovement: () => void;
  onCloseCashMovementModal: () => void;

  // Start Session Modal
  showStartSessionModal: boolean;
  startSessionData: { register: string; opened_by: string; opening_balance: number };
  sessionLoading: boolean;
  onStartSessionDataChange: (data: {
    register: string;
    opened_by: string;
    opening_balance: number;
  }) => void;
  onStartSession: () => void;
  onCloseStartSessionModal: () => void;

  // Close Session Modal
  showCloseSessionModal: boolean;
  denominations: { note: number; count: number }[];
  onDenominationsChange: (denominations: { note: number; count: number }[]) => void;
  onCloseSession: () => void;
  onCloseCloseSessionModal: () => void;
  formatCurrency: (amount: number) => string;

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

  // POS Lock Modal
  showPosLockModal: boolean;
  posCode: string;
  posCodeError: string;
  onPosCodeChange: (value: string) => void;
  onVerifyPosCode: () => void;
  onClosePosLockModal: () => void;

  // Hold Cart Modal
  showHoldCartModal: boolean;
  holdCartName: string;
  onHoldCartNameChange: (name: string) => void;
  onHoldCart: () => void;
  onCloseHoldCartModal: () => void;

  // Recall Cart Modal
  showRecallCartModal: boolean;
  heldCarts: HeldCart[];
  onRecallCart: (cart: HeldCart) => void;
  onDeleteHeldCart: (id: string) => void;
  onCloseRecallCartModal: () => void;

  // Print Options Modal
  showPrintOptionsModal: boolean;
  onClosePrintOptionsModal: () => void;
  onPrintWithOptions: (printerName: string, paperSize: string) => void;
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

  // Cash Movement Modal
  showCashMovementModal,
  activeSession,
  cashMovementType,
  cashMovementAmount,
  cashMovementLoading,
  onCashMovementAmountChange,
  onCashMovement,
  onCloseCashMovementModal,

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

  // POS Lock Modal
  showPosLockModal,
  posCode,
  posCodeError,
  onPosCodeChange,
  onVerifyPosCode,
  onClosePosLockModal,

  // Hold Cart Modal
  showHoldCartModal,
  holdCartName,
  onHoldCartNameChange,
  onHoldCart,
  onCloseHoldCartModal,

  // Recall Cart Modal
  showRecallCartModal,
  heldCarts,
  onRecallCart,
  onDeleteHeldCart,
  onCloseRecallCartModal,

  // Print Options Modal
  showPrintOptionsModal,
  onClosePrintOptionsModal,
  onPrintWithOptions,
}) => {
  // Print Options local state
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [selectedPaperSize, setSelectedPaperSize] = useState('80mm');
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  // Load printers when print options modal opens
  useEffect(() => {
    if (showPrintOptionsModal) {
      setLoadingPrinters(true);
      printerService
        .listPrinters()
        .then((list) => {
          setPrinters(list);
          const defaultPrinter = list.find((p) => p.isDefault);
          if (defaultPrinter) {
            setSelectedPrinter(defaultPrinter.name);
          } else if (list.length > 0) {
            setSelectedPrinter(list[0].name);
          }
        })
        .catch(() => setPrinters([]))
        .finally(() => setLoadingPrinters(false));
    }
  }, [showPrintOptionsModal]);

  return (
    <>
      {/* ============================================================ */}
      {/* 1. Customer Search Modal */}
      {/* ============================================================ */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[550px] max-h-[650px] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Select Customer
              </h2>
              <button onClick={onCloseCustomerModal}>
                <X
                  size={22}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                />
              </button>
            </div>
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or email..."
                  value={customerSearch}
                  onChange={(e) => onCustomerSearchChange(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <User size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm mb-4">No customers found</p>
                  {phoneNumberFromSearch && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Searched number: {phoneNumberFromSearch}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => onSelectCustomer(customer)}
                      className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                        {customer.customer_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 space-y-0.5">
                        {customer.mobile && <div>Mobile: {customer.mobile}</div>}
                        {customer.email && <div>Email: {customer.email}</div>}
                      </div>
                      {customer.current_balance && customer.current_balance > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                          Outstanding: ₹
                          {customer.current_balance.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onOpenAddCustomerWithPhone}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add New Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. Add Customer Modal */}
      {/* ============================================================ */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Add Customer</h2>
              <button onClick={onCloseAddCustomerModal}>
                <X
                  size={22}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                />
              </button>
            </div>
            <form onSubmit={onCreateCustomer} className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  Personal Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Smith"
                      value={newCustomer.display_name}
                      onChange={(e) =>
                        onNewCustomerChange({ ...newCustomer, display_name: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9999999999"
                      value={newCustomer.mobile}
                      onChange={(e) =>
                        onNewCustomerChange({ ...newCustomer, mobile: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. customername@domain.com"
                      value={newCustomer.email}
                      onChange={(e) =>
                        onNewCustomerChange({ ...newCustomer, email: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Inc."
                      value={newCustomer.company_name}
                      onChange={(e) =>
                        onNewCustomerChange({ ...newCustomer, company_name: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  Tax Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Consumer">Consumer</option>
                    <option value="Registered">Registered Business - Regular</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onCloseAddCustomerModal}
                  className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. Salesperson Search Modal */}
      {/* ============================================================ */}
      {showSalespersonModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[550px] max-h-[650px] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Select Salesperson
              </h2>
              <button onClick={onCloseSalespersonModal}>
                <X
                  size={22}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                />
              </button>
            </div>
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={salespersonSearch}
                  onChange={(e) => onSalespersonSearchChange(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {filteredSalespersons.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <User size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm mb-4">No salesperson found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSalespersons.map((salesperson) => (
                    <div
                      key={salesperson.id}
                      onClick={() => onSelectSalesperson(salesperson)}
                      className="p-4 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                        {salesperson.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        Email: {salesperson.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onOpenManageSalesperson}
                className="w-full py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Manage Salesperson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. Manage Salesperson Modal */}
      {/* ============================================================ */}
      {showManageSalespersonModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Manage Salespersons
              </h2>
              <button onClick={onCloseManageSalespersonModal}>
                <X
                  size={22}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                />
              </button>
            </div>

            <div className="p-6">
              {!showAddSalespersonForm ? (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => onShowAddSalespersonForm(true)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add New Salesperson
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      All Salespersons
                    </h3>
                    {salespersons.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <User size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">No salespersons added yet</p>
                      </div>
                    ) : (
                      salespersons.map((sp) => (
                        <div
                          key={sp.id}
                          className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200">
                              {sp.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {sp.email}
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteSalesperson(sp.id)}
                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
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
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                    Add New Salesperson
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newSalesperson.name}
                      onChange={(e) =>
                        onNewSalespersonChange({ ...newSalesperson, name: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={newSalesperson.email}
                      onChange={(e) =>
                        onNewSalespersonChange({ ...newSalesperson, email: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        onShowAddSalespersonForm(false);
                        onNewSalespersonChange({ name: '', email: '' });
                      }}
                      className="flex-1 px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onAddSalesperson}
                      className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
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

      {/* ============================================================ */}
      {/* 5. Discount Modal */}
      {/* ============================================================ */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Apply Discount
              </h3>
              <button
                onClick={onCloseDiscountModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Subtotal: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onDiscountTypeChange('percentage')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-blue-600 dark:bg-blue-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => onDiscountTypeChange('amount')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    discountType === 'amount'
                      ? 'bg-blue-600 dark:bg-blue-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Amount (₹)
                </button>
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'
                }
                autoFocus
              />
              {discountValue > 0 && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Discount:</span>
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      -₹
                      {(discountType === 'percentage'
                        ? (subtotal * discountValue) / 100
                        : discountValue
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200 mt-1">
                    <span>New Total:</span>
                    <span>
                      ₹
                      {Math.max(
                        0,
                        subtotal -
                          (discountType === 'percentage'
                            ? (subtotal * discountValue) / 100
                            : discountValue)
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onRemoveDiscount}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Remove Discount
              </button>
              <button
                onClick={onCloseDiscountModal}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. Payment Confirmation Modal */}
      {/* ============================================================ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[500px] shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Payment Details - {selectedPaymentMode}
              </h2>
              <button onClick={onClosePaymentModal}>
                <X
                  size={22}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Customer:
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {selectedCustomer?.customer_name || 'Walk-in Customer'}
                    </span>
                  </div>
                  {selectedCustomer?.mobile && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Mobile:
                      </span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {selectedCustomer.mobile}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Total Amount:
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {selectedPaymentMode === 'CREDIT SALE' ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Paid Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={total}
                          step="0.01"
                          placeholder="Enter amount paid"
                          value={paidAmount || ''}
                          onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enter the amount paid now (can be 0 for full credit)
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Remaining Amount
                      </label>
                      <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Balance Due:
                          </span>
                          <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            ₹
                            {(total - (paidAmount || 0)).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reference Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter transaction reference (if any)"
                        value={referenceNumber}
                        onChange={(e) => onReferenceNumberChange(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reference Number{' '}
                      {selectedPaymentMode !== 'Cash' && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Enter transaction reference number"
                      value={referenceNumber}
                      onChange={(e) => onReferenceNumberChange(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter the bank transaction reference or approval code
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClosePaymentModal}
                  disabled={processingPayment}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    onProcessPayment(selectedPaymentMode, referenceNumber, paidAmount)
                  }
                  disabled={
                    processingPayment ||
                    (!referenceNumber &&
                      selectedPaymentMode !== 'Cash' &&
                      selectedPaymentMode !== 'CREDIT SALE')
                  }
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. Start Session Modal */}
      {/* ============================================================ */}
      {showStartSessionModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[450px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Start New Session
              </h2>
              <button onClick={onCloseStartSessionModal}>
                <X
                  size={22}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Register Name
                </label>
                <input
                  type="text"
                  value={startSessionData.register}
                  onChange={(e) =>
                    onStartSessionDataChange({ ...startSessionData, register: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="billing desk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opened By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={startSessionData.opened_by}
                  onChange={(e) =>
                    onStartSessionDataChange({ ...startSessionData, opened_by: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opening Cash Balance
                </label>
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent px-4">
                  <span className="text-gray-500 dark:text-gray-400">₹</span>
                  <input
                    type="number"
                    value={startSessionData.opening_balance}
                    onChange={(e) =>
                      onStartSessionDataChange({
                        ...startSessionData,
                        opening_balance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-transparent border-none px-2 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={onCloseStartSessionModal}
                disabled={sessionLoading}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onStartSession}
                disabled={sessionLoading || !startSessionData.opened_by.trim()}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sessionLoading ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. Close Session Modal */}
      {/* ============================================================ */}
      {showCloseSessionModal && activeSession && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[550px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Close Session</h2>
              <button onClick={onCloseCloseSessionModal}>
                <X
                  size={22}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Session:</span>
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">
                      {activeSession.session_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Register:</span>
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">
                      {activeSession.register}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Opened By:</span>
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">
                      {activeSession.opened_by}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Sales:</span>
                    <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(activeSession.total_sales)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opening Balance
                  </label>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2.5">
                    <span className="text-gray-500 dark:text-gray-400">₹</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      {activeSession.opening_balance.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cash In
                  </label>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2.5">
                    <span className="text-gray-500 dark:text-gray-400">₹</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      {activeSession.cash_in.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Denomination Grid */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                  Cash Denomination Count
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-100 dark:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    <span>Note</span>
                    <span className="text-center">Count</span>
                    <span className="text-right">Total</span>
                  </div>
                  {denominations.map((d, idx) => (
                    <div
                      key={d.note}
                      className={`grid grid-cols-3 items-center px-4 py-2 ${
                        idx % 2 === 0
                          ? 'bg-white dark:bg-gray-800'
                          : 'bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ₹{d.note.toFixed(2)}
                      </span>
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
                          className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">
                        ₹
                        {(d.note * d.count).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-t-2 border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      Total
                    </span>
                    <span></span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400 text-right">
                      ₹
                      {denominations
                        .reduce((sum, d) => sum + d.note * d.count, 0)
                        .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>Note:</strong> Once closed, this session cannot be reopened. All sales
                  have been recorded.
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={onCloseCloseSessionModal}
                disabled={sessionLoading}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onCloseSession}
                disabled={sessionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {sessionLoading ? 'Closing...' : 'Close Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. Cash In/Out Modal */}
      {/* ============================================================ */}
      {showCashMovementModal && activeSession && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {cashMovementType === 'in' ? 'Cash In' : 'Cash Out'}
              </h3>
              <button
                onClick={onCloseCashMovementModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between mb-1">
                  <span>Current Cash In:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ₹{activeSession.cash_in.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Cash Out:</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    ₹{activeSession.cash_out.toFixed(2)}
                  </span>
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashMovementAmount || ''}
                onChange={(e) => onCashMovementAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onCloseCashMovementModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={onCashMovement}
                disabled={cashMovementLoading || cashMovementAmount <= 0}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  cashMovementType === 'in'
                    ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                    : 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600'
                } disabled:opacity-50`}
              >
                {cashMovementLoading
                  ? 'Processing...'
                  : `Record Cash ${cashMovementType === 'in' ? 'In' : 'Out'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 10. POS Lock Modal */}
      {/* ============================================================ */}
      {showPosLockModal && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[400px] shadow-2xl">
            <div className="flex flex-col items-center p-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">POS Locked</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                Enter your POS code to unlock
              </p>
              <input
                type="password"
                value={posCode}
                onChange={(e) => onPosCodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onVerifyPosCode();
                }}
                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="----"
                maxLength={6}
                autoFocus
              />
              {posCodeError && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-2">{posCodeError}</p>
              )}
              <button
                onClick={onVerifyPosCode}
                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Unlock
              </button>
              <button
                onClick={onClosePosLockModal}
                className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Bill Success Modal */}
      {/* ============================================================ */}
      {showBillSuccess && generatedInvoice && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[650px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex flex-col items-center p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 dark:from-green-900/20 to-blue-50 dark:to-blue-900/20">
              <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Check size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Bill Created Successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Invoice #{generatedInvoice.invoice_number}
              </p>
            </div>

            <div className="p-6">
              {/* Customer & Payment Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                    Customer Details
                  </h3>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {generatedInvoice.customer_name}
                  </p>
                  {selectedCustomer?.mobile && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {selectedCustomer.mobile}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                    Payment Details
                  </h3>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">
                    {generatedInvoice.paymentMode}
                  </p>
                  {generatedInvoice.referenceNumber && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Ref: {generatedInvoice.referenceNumber}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {generatedInvoice.createdAt}
                  </p>
                </div>
              </div>

              {/* Salesperson Details */}
              {generatedInvoice.salesperson_name && (
                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                    Salesperson
                  </h3>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-400">
                    {generatedInvoice.salesperson_name}
                  </p>
                </div>
              )}

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                  Items
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                          ITEM
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                          QTY
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                          RATE
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                          AMOUNT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {generatedInvoice.items.map((item: any, index: number) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                            {item.item_name}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                            ₹
                            {item.rate.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-800 dark:text-gray-200">
                            ₹
                            {item.amount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    Total Amount:
                  </span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ₹
                    {generatedInvoice.total_amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {generatedInvoice.paymentMode === 'CREDIT SALE' &&
                  generatedInvoice.balanceDue > 0 && (
                    <>
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Amount Paid:
                          </span>
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ₹
                            {generatedInvoice.amountPaid.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Balance Due:
                          </span>
                          <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                            ₹
                            {generatedInvoice.balanceDue.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <div className="bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700 rounded px-3 py-2 text-center">
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                            CREDIT SALE - PAYMENT PENDING
                          </span>
                        </div>
                      </div>
                    </>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onPrintBill}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Print Bill
                </button>
                <button
                  onClick={onCompleteBill}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Hold Cart Modal */}
      {/* ============================================================ */}
      {showHoldCartModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Hold Cart
              </h3>
              <button
                onClick={onCloseHoldCartModal}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cart Name (optional)
              </label>
              <input
                type="text"
                value={holdCartName}
                onChange={(e) => onHoldCartNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onHoldCart();
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Customer John, Table 3..."
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Give this cart a name so you can find it later.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onCloseHoldCartModal}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onHoldCart}
                className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Hold Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Recall Cart Modal */}
      {/* ============================================================ */}
      {showRecallCartModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[500px] max-h-[600px] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Recall Held Cart
              </h3>
              <button
                onClick={onCloseRecallCartModal}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {heldCarts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p className="text-sm">No held carts</p>
                  <p className="text-xs mt-1">Hold a cart to see it here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {heldCarts.map((cart) => (
                    <div
                      key={cart.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1" onClick={() => onRecallCart(cart)}>
                          <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                            {cart.id}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {cart.items.length} item(s)
                            {cart.customer && ` | ${cart.customer.customer_name}`}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {new Date(cart.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHeldCart(cart.id);
                          }}
                          className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Print Options Modal */}
      {/* ============================================================ */}
      {showPrintOptionsModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-[420px] shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Print Options
              </h3>
              <button
                onClick={onClosePrintOptionsModal}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Printer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Printer
                </label>
                {loadingPrinters ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Detecting printers...
                  </div>
                ) : printers.length === 0 ? (
                  <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    No printers detected. Check your printer connection.
                  </div>
                ) : (
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.displayName || p.name} {p.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Paper Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paper Size
                </label>
                <div className="flex gap-2">
                  {['58mm', '80mm', 'A4'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedPaperSize(size)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        selectedPaperSize === size
                          ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Print */}
              {selectedPrinter && (
                <button
                  onClick={() => printerService.testPrint(selectedPrinter)}
                  className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={14} /> Test Print
                </button>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClosePrintOptionsModal}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onPrintWithOptions(selectedPrinter, selectedPaperSize)}
                disabled={!selectedPrinter}
                className="px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Split Payment Modal (separate component) */}
      {/* ============================================================ */}
      <SplitPaymentModal
        isOpen={showSplitPaymentModal}
        onClose={onCloseSplitPaymentModal}
        totalAmount={total}
        customerName={selectedCustomer?.customer_name || 'Walk-in Customer'}
        customerMobile={selectedCustomer?.mobile}
        onComplete={onSplitPaymentComplete}
      />
    </>
  );
};

export default PosModals;
