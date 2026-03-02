import React from 'react';
import { User, X, Edit2, Lock } from 'lucide-react';
import { Customer } from '../../services/customers.service';
import { Salesperson } from '../../services/salesperson.service';
import { CartItem } from './posTypes';

interface CartPanelProps {
  cart: CartItem[];
  subtotal: number;
  total: number;
  totalQty: number;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  discountAmount: number;
  selectedCustomer: Customer | null;
  selectedSalesperson: Salesperson | null;
  posEmployeeName: string;
  deliveryOption: 'self_pickup' | 'delivery' | null;
  processingPayment: boolean;
  showDeliveryDropdown: boolean;
  onCustomerClick: () => void;
  onClearCustomer: () => void;
  onSalespersonClick: () => void;
  onClearSalesperson: () => void;
  onDiscountClick: () => void;
  onDeliveryToggle: () => void;
  onDeliverySelect: (option: 'self_pickup' | 'delivery') => void;
  onPaymentClick: (mode: 'Cash' | 'HDFC' | 'ICICI' | 'BAJAJ/ICICI' | 'D/B CREDIT CARD / EM' | 'CREDIT SALE') => void;
  onSplitPayment: () => void;
  onLockPos: () => void;
  onShowDeliveryChallanModal: () => void;
}

const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  subtotal,
  total,
  totalQty,
  discountType,
  discountValue,
  discountAmount,
  selectedCustomer,
  selectedSalesperson,
  posEmployeeName,
  deliveryOption,
  processingPayment,
  showDeliveryDropdown,
  onCustomerClick,
  onClearCustomer,
  onSalespersonClick,
  onClearSalesperson,
  onDiscountClick,
  onDeliveryToggle,
  onDeliverySelect,
  onPaymentClick,
  onSplitPayment,
  onLockPos,
  onShowDeliveryChallanModal,
}) => {
  return (
    <div className="w-[420px] flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
        {/* Current POS Operator */}
        {posEmployeeName && (
          <div className="flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                Operator: {posEmployeeName}
              </span>
            </div>
            <button
              onClick={onLockPos}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
            >
              Switch
            </button>
          </div>
        )}

        {selectedCustomer ? (
          <div className="flex justify-between items-start p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-400">
                <User size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {selectedCustomer.customer_name?.toUpperCase()}
                </div>
                {selectedCustomer.mobile && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedCustomer.mobile}</div>
                )}
                {selectedCustomer.current_balance && selectedCustomer.current_balance > 0 && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                    Outstanding: ₹{selectedCustomer.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 text-gray-500 dark:text-gray-400">
              <Edit2 size={14} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
              <X
                size={14}
                className="cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors"
                onClick={onClearCustomer}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={onCustomerClick}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <User size={16} /> Customer [F9]
          </button>
        )}

        <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

        {selectedSalesperson && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Salesperson</div>
                <div className="text-sm font-bold text-green-700 dark:text-green-400">
                  {selectedSalesperson.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedSalesperson.email}</div>
              </div>
              <X
                size={14}
                className="cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors text-gray-500 dark:text-gray-400"
                onClick={onClearSalesperson}
              />
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <button
            onClick={onDiscountClick}
            className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              discountValue > 0
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : ''
            }`}
          >
            {discountValue > 0
              ? `Discount: ${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} (-₹${discountAmount.toFixed(2)})`
              : 'Discount [Alt+Shift+P]'}
          </button>
          <div className="relative">
            <button
              onClick={onDeliveryToggle}
              className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                deliveryOption === 'delivery'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : deliveryOption === 'self_pickup'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : ''
              }`}
            >
              {deliveryOption === 'delivery'
                ? 'Delivery: Delivery'
                : deliveryOption === 'self_pickup'
                ? 'Delivery: Self Pickup'
                : 'Delivery [Alt+Shift+D]'}
            </button>
            {showDeliveryDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => onDeliverySelect('self_pickup')}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm ${
                    deliveryOption === 'self_pickup'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Self Pickup
                </button>
                <button
                  onClick={() => {
                    onDeliverySelect('delivery');
                    onShowDeliveryChallanModal();
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm ${
                    deliveryOption === 'delivery'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Delivery
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onSalespersonClick}
            className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Salesperson [Shift+F10]
          </button>
        </div>
      </div>

      <div className="mt-auto p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="mb-3">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>
              Subtotal ({cart.length} items, {totalQty} qty)
            </span>
            <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 mb-1">
              <span>
                Discount ({discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`})
              </span>
              <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between items-end mt-1">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPaymentClick('Cash')}
            disabled={cart.length === 0 || processingPayment}
            className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-sm uppercase transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingPayment ? 'Processing...' : 'Cash [F1]'}
          </button>
          <button
            onClick={() => onPaymentClick('HDFC')}
            disabled={cart.length === 0 || processingPayment}
            className="py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            HDFC BANK [F2]
          </button>
          <button
            onClick={() => onPaymentClick('ICICI')}
            disabled={cart.length === 0 || processingPayment}
            className="py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ICICI BANK [F3]
          </button>
          <button
            onClick={() => onPaymentClick('BAJAJ/ICICI')}
            disabled={cart.length === 0 || processingPayment}
            className="py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            BAJAJ / ICICI BANK
          </button>
          <button
            onClick={() => onPaymentClick('CREDIT SALE')}
            disabled={cart.length === 0 || processingPayment}
            className="py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Credit Sale [F4]
          </button>
          <button
            onClick={() => onPaymentClick('D/B CREDIT CARD / EM')}
            disabled={cart.length === 0 || processingPayment}
            className="py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            D/B CREDIT CARD / EM
          </button>
          <button
            onClick={onSplitPayment}
            disabled={cart.length === 0 || processingPayment}
            className="py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            More... [F12]
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
