import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { transferOrdersService, CreateTransferOrderData, TransferOrderItem, ItemLocationStock } from '../../services/transfer-orders.service';
import { itemsService, Item } from '../../services/items.service';
import { locationsService, Location } from '../../services/locations.service';
import { binLocationService, BinLocation } from '../../services/binLocation.service';

const NewTransferOrderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [transferOrderNumber, setTransferOrderNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Stock per location for each selected item: { itemId: [{ location_name, available_quantity }] }
  const [itemLocationStock, setItemLocationStock] = useState<Record<string, ItemLocationStock[]>>({});

  // Destination bin selection
  const [destinationBins, setDestinationBins] = useState<BinLocation[]>([]);
  const [selectedDestBinId, setSelectedDestBinId] = useState('');

  const [formData, setFormData] = useState({
    transfer_date: new Date().toISOString().split('T')[0],
    source_location: '',
    destination_location: '',
    reason: '',
    notes: '',
  });

  const [transferItems, setTransferItems] = useState<Omit<TransferOrderItem, 'id' | 'transfer_order_id'>[]>([
    {
      item_id: '',
      item_name: '',
      description: '',
      source_availability: 0,
      destination_availability: 0,
      transfer_quantity: 0,
      unit_of_measurement: 'Pcs',
    },
  ]);

  useEffect(() => {
    fetchItems();
    fetchLocations();
    generateTransferOrderNumber();
  }, []);

  // Update source/destination availability when locations or stock data change
  useEffect(() => {
    setTransferItems(prev => prev.map(item => {
      if (!item.item_id) return item;
      const stocks = itemLocationStock[item.item_id] || [];
      const sourceStock = stocks.find(s => s.location_name === formData.source_location);
      const destStock = stocks.find(s => s.location_name === formData.destination_location);
      return {
        ...item,
        source_availability: sourceStock?.available_quantity || 0,
        destination_availability: destStock?.available_quantity || 0,
      };
    }));
  }, [formData.source_location, formData.destination_location, itemLocationStock]);

  const fetchItems = async () => {
    try {
      const response = await itemsService.getAllItems({ isActive: true });
      if (response.data.success && response.data.data) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await locationsService.getAllLocations({ status: 'active' });
      if (response.success && response.data) {
        setAllLocations(response.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const generateTransferOrderNumber = async () => {
    try {
      const response = await transferOrdersService.generateTransferOrderNumber();
      setTransferOrderNumber(response.data.transfer_order_number);
    } catch (error) {
      console.error('Error generating transfer order number:', error);
    }
  };

  const fetchItemLocationStock = async (itemId: string) => {
    try {
      const response = await transferOrdersService.getItemLocationStock(itemId);
      if (response.success) {
        setItemLocationStock(prev => ({
          ...prev,
          [itemId]: response.data,
        }));
      }
    } catch (error) {
      console.error('Error fetching item location stock:', error);
    }
  };

  // Source locations: only locations where at least one selected item has stock
  const sourceLocationOptions = useMemo(() => {
    const selectedItemIds = transferItems
      .filter(item => item.item_id)
      .map(item => item.item_id!);

    if (selectedItemIds.length === 0) {
      return allLocations.map(l => l.name);
    }

    const locationSet = new Set<string>();
    selectedItemIds.forEach(id => {
      (itemLocationStock[id] || []).forEach(s => locationSet.add(s.location_name));
    });

    return Array.from(locationSet).sort();
  }, [transferItems, itemLocationStock, allLocations]);

  // Destination locations: all locations except the selected source
  const destinationLocationOptions = useMemo(() => {
    return allLocations
      .map(l => l.name)
      .filter(name => name !== formData.source_location);
  }, [allLocations, formData.source_location]);

  // Fetch bins when destination location changes
  useEffect(() => {
    const fetchDestinationBins = async () => {
      if (!formData.destination_location) {
        setDestinationBins([]);
        setSelectedDestBinId('');
        return;
      }
      try {
        const destLoc = allLocations.find(l => l.name === formData.destination_location);
        if (!destLoc) return;
        const response = await binLocationService.getAllBinLocations({ location_id: destLoc.id, status: 'active' });
        if (response.success && response.data) {
          setDestinationBins(response.data);
          setSelectedDestBinId('');
        }
      } catch (error) {
        console.error('Error fetching destination bins:', error);
      }
    };
    fetchDestinationBins();
  }, [formData.destination_location, allLocations]);

  const handleItemChange = async (index: number, field: string, value: any) => {
    const updatedItems = [...transferItems];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index].item_name = selectedItem.item_name;
        updatedItems[index].description = selectedItem.description || '';
        updatedItems[index].unit_of_measurement = selectedItem.unit_of_measurement || 'Pcs';
      }
      // Fetch stock per location for this item (async - availability updates via useEffect)
      fetchItemLocationStock(value);
    }

    if (field === 'transfer_quantity' && value > 0) {
      setShowError(false);
      setErrorMessage('');
    }

    setTransferItems(updatedItems);
  };

  const addNewItem = () => {
    setTransferItems([
      ...transferItems,
      {
        item_id: '',
        item_name: '',
        description: '',
        source_availability: 0,
        destination_availability: 0,
        transfer_quantity: 0,
        unit_of_measurement: 'Pcs',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (transferItems.length > 1) {
      const updatedItems = transferItems.filter((_, i) => i !== index);
      setTransferItems(updatedItems);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.source_location) {
      newErrors.source = 'Please select a source location';
    }

    if (!formData.destination_location) {
      newErrors.destination = 'Please select a destination location';
    }

    if (formData.source_location && formData.destination_location &&
        formData.source_location === formData.destination_location) {
      setShowError(true);
      setErrorMessage('Transfers cannot be made within the same location. Please choose a different one and proceed.');
      return false;
    }

    if (!transferOrderNumber) {
      newErrors.transfer_order_number = 'Transfer order number is required';
    }

    const hasValidItems = transferItems.some(item => item.item_name && item.transfer_quantity > 0);
    if (!hasValidItems) {
      newErrors.items = 'Please add at least one valid item with quantity';
    }

    const hasZeroQuantity = transferItems.some(item => item.item_name && item.transfer_quantity <= 0);
    if (hasZeroQuantity) {
      setShowError(true);
      setErrorMessage('Transactions cannot be proceed with Zero Quantity.');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (saveType: 'draft' | 'initiated') => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setShowError(false);
      setErrorMessage('');

      const orderData: CreateTransferOrderData = {
        transfer_order_number: transferOrderNumber,
        transfer_date: formData.transfer_date,
        source_location: formData.source_location,
        destination_location: formData.destination_location,
        destination_bin_id: selectedDestBinId || undefined,
        reason: formData.reason,
        status: saveType,
        notes: formData.notes,
        items: transferItems.filter(item => item.item_name && item.transfer_quantity > 0),
      };

      await transferOrdersService.createTransferOrder(orderData);

      alert(`Transfer order ${saveType === 'draft' ? 'saved as draft' : 'initiated'} successfully!`);
      navigate('/inventory/transfer-orders');
    } catch (error: any) {
      console.error('Error creating transfer order:', error);
      setShowError(true);
      setErrorMessage(error.message || 'Failed to create transfer order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">New Transfer Order</h1>
          <button
            onClick={() => navigate('/inventory/transfer-orders')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {showError && errorMessage && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setShowError(false);
              setErrorMessage('');
            }}
            className="text-red-600 hover:text-red-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Form */}
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Transfer Order# and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Order#<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={transferOrderNumber}
                  onChange={(e) => setTransferOrderNumber(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={generateTransferOrderNumber}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Regenerate order number"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
              {errors.transfer_order_number && (
                <p className="mt-1 text-sm text-red-600">{errors.transfer_order_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.transfer_date}
                onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Item Details Table — BEFORE locations */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Details
            </label>
            <div className="border border-gray-300 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item Details
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Source Availability
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Destination Availability
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Transfer Quantity
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transferItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
                        >
                          <option value="">Select from items</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>{i.item_name}</option>
                          ))}
                        </select>
                        {item.item_name && (
                          <p className="text-xs text-gray-500 mt-1 px-1">{item.description || ''}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${(item.source_availability || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.item_id ? (item.source_availability || 0) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">
                          {item.item_id ? item.destination_availability : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.transfer_quantity}
                          onChange={(e) => handleItemChange(index, 'transfer_quantity', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">{item.unit_of_measurement}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {transferItems.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addNewItem}
              className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus size={18} />
              <span>Add New Row</span>
            </button>
            {errors.items && (
              <p className="mt-1 text-sm text-red-600">{errors.items}</p>
            )}
          </div>

          {/* Source & Destination Locations — dynamic based on selected items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Location<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.source_location}
                onChange={(e) => {
                  setFormData({ ...formData, source_location: e.target.value });
                  setShowError(false);
                  setErrorMessage('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Source Location</option>
                {sourceLocationOptions.map((loc) => {
                  // Show stock info for the first selected item as hint
                  const selectedItemIds = transferItems.filter(ti => ti.item_id).map(ti => ti.item_id!);
                  let stockHint = '';
                  if (selectedItemIds.length > 0) {
                    const totalStock = selectedItemIds.reduce((sum, id) => {
                      const stocks = itemLocationStock[id] || [];
                      const stock = stocks.find(s => s.location_name === loc);
                      return sum + (stock?.available_quantity || 0);
                    }, 0);
                    stockHint = ` (${totalStock} total in stock)`;
                  }
                  return (
                    <option key={loc} value={loc}>
                      {loc}{stockHint}
                    </option>
                  );
                })}
              </select>
              {errors.source && (
                <p className="mt-1 text-sm text-red-600">{errors.source}</p>
              )}
              {sourceLocationOptions.length === 0 && transferItems.some(ti => ti.item_id) && (
                <p className="mt-1 text-sm text-amber-600">
                  No locations with stock found for selected items
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Location<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.destination_location}
                onChange={(e) => {
                  setFormData({ ...formData, destination_location: e.target.value });
                  setShowError(false);
                  setErrorMessage('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Destination Location</option>
                {destinationLocationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {errors.destination && (
                <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
              )}

              {/* Destination Bin Selection */}
              {formData.destination_location && destinationBins.length > 0 && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Bin
                  </label>
                  <select
                    value={selectedDestBinId}
                    onChange={(e) => setSelectedDestBinId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Destination Bin</option>
                    {destinationBins.map((bin) => (
                      <option key={bin.id} value={bin.id}>
                        {bin.bin_code}{bin.description ? ` — ${bin.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Transfer
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Stock replenishment, Customer order, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes here..."
            />
          </div>

          {/* File Attachment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach File(s)
            </label>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Upload File
            </button>
            <p className="text-xs text-gray-500 mt-1">
              You can upload a maximum of 5 files, 10MB each
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/inventory/transfer-orders')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('initiated')}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Initiate Transfer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTransferOrderForm;
