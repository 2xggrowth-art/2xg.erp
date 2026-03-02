import React from 'react';
import { Search, Printer } from 'lucide-react';
import { Item } from '../../services/items.service';

interface ProductSearchProps {
  itemSearch: string;
  onSearchChange: (value: string) => void;
  filteredItems: Item[];
  onSelectItem: (item: Item) => void;
  printerConnected: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  itemSearch,
  onSearchChange,
  filteredItems,
  onSelectItem,
  printerConnected,
}) => {
  return (
    <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative z-20">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Type here or scan an item to add [F10]"
            value={itemSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Sync / Printer Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap ${
            printerConnected
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}
          title={printerConnected ? 'Printer connected' : 'Printer not connected'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              printerConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          ></span>
          <Printer size={14} />
        </div>
      </div>

      {/* Inline Dropdown Results */}
      {itemSearch && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-b-lg max-h-[400px] overflow-y-auto z-50 mx-6 mt-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500">
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 rounded-lg cursor-pointer transition-colors flex justify-between items-center group"
                >
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {item.item_name}
                    </div>
                    {(item.color || item.variant || item.size) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {[item.color, item.variant, item.size].filter(Boolean).join(' | ')}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      SKU: {item.sku} {item.barcode ? `| Barcode: ${item.barcode}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      ₹{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Stock:{' '}
                      <span
                        className={
                          item.current_stock > 0
                            ? 'text-green-600 dark:text-green-400 font-medium'
                            : 'text-red-500 dark:text-red-400'
                        }
                      >
                        {item.current_stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
