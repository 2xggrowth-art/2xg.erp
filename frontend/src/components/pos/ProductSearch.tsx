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
    <div className="px-6 py-3 border-b border-gray-200 bg-white relative z-20">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Type here or scan an item to add [F10]"
            value={itemSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Printer Status Indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap ${printerConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}
          title={printerConnected ? 'Printer connected' : 'Printer not connected'}
        >
          <span className={`w-2 h-2 rounded-full ${printerConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          <Printer size={14} />
        </div>
      </div>

      {/* Inline Dropdown Results */}
      {itemSearch && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-lg max-h-[400px] overflow-y-auto z-50 mx-6 mt-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="p-3 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg cursor-pointer transition-colors flex justify-between items-center group"
                >
                  <div>
                    <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-700">{item.item_name}</div>
                    {(item.color || item.variant || item.size) && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {[item.color, item.variant, item.size].filter(Boolean).join(' | ')}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-0.5">
                      SKU: {item.sku} {item.barcode ? `| Barcode: ${item.barcode}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 group-hover:text-blue-700">₹{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-end gap-1.5">
                      Stock: <span className={item.current_stock > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>{item.current_stock}</span>
                      {item.current_stock <= 0 && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Out of Stock</span>
                      )}
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
