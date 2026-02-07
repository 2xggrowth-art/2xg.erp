import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { binLocationService, BinLocation } from '../../services/binLocation.service';

interface BinAllocation {
  bin_location_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
}

interface SelectBinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemSku?: string;
  totalQuantity: number;
  unitOfMeasurement: string;
  currentAllocations?: BinAllocation[];
  onSave: (allocations: BinAllocation[]) => void;
}

const SelectBinsModal = ({
  isOpen,
  onClose,
  itemName,
  itemSku,
  totalQuantity,
  unitOfMeasurement,
  currentAllocations = [],
  onSave
}: SelectBinsModalProps) => {
  const [binLocations, setBinLocations] = useState<BinLocation[]>([]);
  const [allocations, setAllocations] = useState<BinAllocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBinLocations();
      setSelectedLocation('');
      if (currentAllocations.length > 0) {
        setAllocations(currentAllocations);
      } else {
        setAllocations([{ bin_location_id: '', bin_code: '', location_name: '', quantity: 0 }]);
      }
    }
  }, [isOpen, currentAllocations]);

  const fetchBinLocations = async () => {
    try {
      const response = await binLocationService.getAllBinLocations({ status: 'active' });
      if (response.success && response.data) {
        setBinLocations(response.data);
      }
    } catch (error) {
      console.error('Error fetching bin locations:', error);
    }
  };

  // Get unique locations from bin data
  const locationNames = useMemo(() => {
    const names = new Set<string>();
    binLocations.forEach(bin => {
      const name = bin.locations?.name || bin.warehouse || 'Unknown';
      names.add(name);
    });
    return Array.from(names).sort();
  }, [binLocations]);

  // Filter bins by selected location
  const filteredBins = useMemo(() => {
    if (!selectedLocation) return binLocations;
    return binLocations.filter(bin => {
      const name = bin.locations?.name || bin.warehouse || 'Unknown';
      return name === selectedLocation;
    });
  }, [binLocations, selectedLocation]);

  const handleBinChange = (index: number, binId: string) => {
    const selectedBin = binLocations.find(bin => bin.id === binId);
    const updatedAllocations = [...allocations];
    updatedAllocations[index] = {
      ...updatedAllocations[index],
      bin_location_id: binId,
      bin_code: selectedBin?.bin_code || '',
      location_name: selectedBin?.locations?.name || selectedBin?.warehouse || ''
    };
    setAllocations(updatedAllocations);
    setError('');
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedAllocations = [...allocations];
    updatedAllocations[index].quantity = quantity;
    setAllocations(updatedAllocations);
    setError('');
  };

  const addRow = () => {
    setAllocations([...allocations, { bin_location_id: '', bin_code: '', location_name: '', quantity: 0 }]);
  };

  const removeRow = (index: number) => {
    if (allocations.length > 1) {
      setAllocations(allocations.filter((_, i) => i !== index));
    }
  };

  const getTotalAllocated = () => {
    return allocations.reduce((sum, allocation) => sum + (allocation.quantity || 0), 0);
  };

  const handleSave = () => {
    const totalAllocated = getTotalAllocated();
    const filledAllocations = allocations.filter(a => a.bin_location_id && a.quantity > 0);

    if (filledAllocations.length === 0) {
      setError('Please select at least one bin location with quantity');
      return;
    }

    if (totalAllocated !== totalQuantity) {
      setError(`The quantity entered (${totalAllocated}) does not match the total quantity (${totalQuantity})`);
      return;
    }

    onSave(filledAllocations);
    onClose();
  };

  if (!isOpen) return null;

  const totalAllocated = getTotalAllocated();
  const remainingQuantity = totalQuantity - totalAllocated;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-slate-800">Select Bin Locations</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-red-600">• {error}</span>
              <button onClick={() => setError('')} className="text-red-600">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Item Info */}
          <div className="mb-6">
            <h4 className="font-medium text-slate-800">{itemName}</h4>
            {itemSku && <p className="text-sm text-slate-500">SKU: {itemSku}</p>}
          </div>

          {/* Quantity Summary */}
          <div className="mb-4 text-sm text-slate-600">
            <span>Total Quantity: {totalQuantity} {unitOfMeasurement}</span>
            <span className="ml-4">Quantity to be added: {remainingQuantity} {unitOfMeasurement}</span>
          </div>

          {/* Location Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              LOCATION
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locationNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Bin Allocations Table */}
          <div className="mb-4">
            <div className="grid grid-cols-12 gap-4 mb-3">
              <div className="col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  BIN LOCATION<span className="text-red-500">*</span>
                </label>
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  QUANTITY<span className="text-red-500">*</span>
                </label>
              </div>
              <div className="col-span-2"></div>
            </div>

            {allocations.map((allocation, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 mb-3">
                <div className="col-span-6">
                  <select
                    value={allocation.bin_location_id}
                    onChange={(e) => handleBinChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Bin</option>
                    {filteredBins.map(bin => (
                      <option key={bin.id} value={bin.id}>
                        {bin.bin_code} - {bin.locations?.name || bin.warehouse}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    value={allocation.quantity || ''}
                    onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-center">
                  {allocations.length > 1 && (
                    <button
                      onClick={() => removeRow(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Row Button */}
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Plus size={16} />
            New Row
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectBinsModal;
