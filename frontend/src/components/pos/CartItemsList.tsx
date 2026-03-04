import React, { ChangeEvent } from 'react';
import { ShoppingCart, Plus, MapPin, Trash2, X, Package, Repeat } from 'lucide-react';
import { CartItem } from './posTypes';

interface CartItemsListProps {
  cart: CartItem[];
  onQtyChange: (id: string, qty: string) => void;
  onRateChange: (id: string, rate: string) => void;
  onBinChange: (id: string, binId: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onHoldCart: () => void;
  onExchangeItems: () => void;
  onItemClick?: (item: CartItem) => void;
}

const CartItemsList: React.FC<CartItemsListProps> = ({
  cart,
  onQtyChange,
  onRateChange,
  onBinChange,
  onRemoveItem,
  onClearCart,
  onHoldCart,
  onExchangeItems,
  onItemClick,
}) => {
  return (
    <>
      {/* Table Header */}
      {cart.length > 0 && (
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 border-b border-gray-200 bg-gray-50">
          <div className="col-span-1">S.NO.</div>
          <div className="col-span-5">NAME</div>
          <div className="col-span-1 text-center">QTY.</div>
          <div className="col-span-2 text-right">RATE</div>
          <div className="col-span-2 text-right">AMOUNT</div>
          <div className="col-span-1"></div>
        </div>
      )}

      {/* Cart Items or Empty State */}
      <div className="flex-grow overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="relative mb-6">
              <ShoppingCart size={80} strokeWidth={1.5} className="text-gray-300" />
              <Plus size={24} className="absolute -top-2 -right-2 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-500">Yet to add items to the cart!</h3>
            <p className="text-sm text-gray-400">Search or scan items to add them to your cart</p>
          </div>
        ) : (
          <>
            {cart.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onItemClick?.(item)}>
                <div className="col-span-1 text-sm text-gray-600">{index + 1}</div>
                <div className="col-span-5">
                  <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                  {item.exchange_item_id ? (
                    <div className="text-xs mt-0.5">
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-medium">2ND HAND EXCHANGE</span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-0.5">{item.sku || 'No SKU'}</div>
                  )}
                  {item.serial_number && (
                    <div className="text-xs text-purple-600 mt-0.5">S/N: {item.serial_number}</div>
                  )}
                  {item.note && (
                    <div className="text-xs text-gray-400 mt-0.5 italic truncate max-w-[200px]">{item.note}</div>
                  )}
                  {item.available_bins && item.available_bins.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-blue-500" />
                      {item.available_bins.length === 1 ? (
                        <span className="text-xs text-blue-600">{item.available_bins[0].bin_code}</span>
                      ) : (
                        <select
                          value={item.bin_allocations?.[0]?.bin_location_id || ''}
                          onChange={(e) => onBinChange(item.id, e.target.value)}
                          className="text-xs text-blue-600 bg-transparent border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="">Select Bin</option>
                          {item.available_bins.map(b => (
                            <option key={b.bin_id} value={b.bin_id}>
                              {b.bin_code} - {b.location_name}{b.stock > 0 ? ` (${b.stock} pcs)` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-1 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onQtyChange(item.id, e.target.value)}
                    disabled={!!item.exchange_item_id}
                    className={`w-16 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${item.exchange_item_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="col-span-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end bg-gray-50 rounded border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-2">
                    <span className="text-xs text-gray-500 mr-1">₹</span>
                    <input
                      type="number"
                      value={item.rate || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => onRateChange(item.id, e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-right text-sm text-gray-800 p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm font-semibold text-gray-800">
                  ₹{(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex gap-2">
        <button
          onClick={onClearCart}
          className="px-4 py-2 bg-red-50 border border-red-300 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <X size={14} /> Clear All [F6]
        </button>
        <button
          onClick={onHoldCart}
          disabled={cart.length === 0}
          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Package size={14} /> Hold Cart [F7]
        </button>
        <button
          onClick={onExchangeItems}
          className="px-4 py-2 bg-orange-50 border border-orange-300 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <Repeat size={14} /> Exchange Items [F8]
        </button>
      </div>
    </>
  );
};

export default CartItemsList;
