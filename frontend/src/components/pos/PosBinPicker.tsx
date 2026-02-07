import { useState } from 'react';
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

const PosBinPicker = ({ isOpen, onClose, itemName, itemQty, bins, onSelect }: PosBinPickerProps) => {
  const [selectedBinId, setSelectedBinId] = useState<string>('');

  if (!isOpen) return null;

  const handleQuickSelect = (bin: BinOption) => {
    onSelect([{
      bin_location_id: bin.bin_id,
      bin_code: bin.bin_code,
      location_name: bin.location_name,
      quantity: itemQty
    }]);
    setSelectedBinId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Select Bin for {itemName}</h3>
            <p className="text-xs text-gray-500">Qty: {itemQty}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-3 max-h-60 overflow-y-auto">
          {bins.map(bin => (
            <button
              key={bin.bin_id}
              onClick={() => handleQuickSelect(bin)}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1.5 border transition-colors ${
                selectedBinId === bin.bin_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-800">{bin.bin_code}</span>
                  <span className="text-xs text-gray-500">- {bin.location_name}</span>
                </div>
                <span className="text-xs font-medium text-green-600">
                  Stock: {bin.quantity} {bin.unit_of_measurement}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosBinPicker;
