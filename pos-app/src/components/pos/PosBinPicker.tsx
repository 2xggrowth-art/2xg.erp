import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface BinOption {
  bin_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
  unit_of_measurement: string;
}

interface BinAllocation {
  bin_location_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
}

interface PosBinPickerProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemQty: number;
  bins: BinOption[];
  onSelect: (allocations: BinAllocation[]) => void;
}

const PosBinPicker: React.FC<PosBinPickerProps> = ({
  isOpen,
  onClose,
  itemName,
  itemQty,
  bins,
  onSelect,
}) => {
  const [selectedBinId, setSelectedBinId] = useState<string>('');

  if (!isOpen) return null;

  const handleQuickSelect = (bin: BinOption) => {
    onSelect([
      {
        bin_location_id: bin.bin_id,
        bin_code: bin.bin_code,
        location_name: bin.location_name,
        quantity: itemQty,
      },
    ]);
    setSelectedBinId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Select Bin for {itemName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {itemQty}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-3 max-h-60 overflow-y-auto">
          {bins.map((bin) => (
            <button
              key={bin.bin_id}
              onClick={() => handleQuickSelect(bin)}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1.5 border transition-colors ${
                selectedBinId === bin.bin_id
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {bin.bin_code}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    - {bin.location_name}
                  </span>
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Stock: {bin.quantity} {bin.unit_of_measurement}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosBinPicker;
