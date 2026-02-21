import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsService, Item } from '../../services/items.service';
import { binLocationService } from '../../services/binLocation.service';
import { batchesService, ItemBatch } from '../../services/batches.service';
import { Edit2, Trash2, Package, TrendingUp, AlertCircle, MapPin, Layers, X } from 'lucide-react';

interface ItemDetailPanelProps {
  itemId: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    <span className="text-sm text-gray-900 text-right">{value}</span>
  </div>
);

const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ itemId, onClose, onDeleted }) => {
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [binLocations, setBinLocations] = useState<any[]>([]);
  const [batches, setBatches] = useState<ItemBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBins, setLoadingBins] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemId) {
      fetchItemDetails(itemId);
      fetchBinLocations(itemId);
    }
  }, [itemId]);

  useEffect(() => {
    if (item?.advanced_tracking_type === 'batches' && itemId) {
      fetchBatches(itemId);
    }
  }, [item?.advanced_tracking_type, itemId]);

  const fetchItemDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await itemsService.getItemById(id);
      if (response.data.success && response.data.data) {
        setItem(response.data.data);
      } else {
        setError('Failed to load item details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBinLocations = async (id: string) => {
    try {
      setLoadingBins(true);
      const response = await binLocationService.getBinLocationsForItem(id);
      if (response.success && response.data) {
        setBinLocations(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching bin locations:', err);
    } finally {
      setLoadingBins(false);
    }
  };

  const fetchBatches = async (id: string) => {
    try {
      setLoadingBatches(true);
      const response = await batchesService.getBatchesForItem(id);
      if (response.success && response.data) {
        setBatches(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleEdit = () => {
    navigate(`/items/${itemId}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsService.deleteItem(itemId);
        onDeleted();
      } catch (err) {
        alert('Failed to delete item');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <p className="text-gray-600">{error || 'Item not found'}</p>
        </div>
      </div>
    );
  }

  const isLowStock = item.current_stock <= item.reorder_point;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900 truncate pr-2">{item.item_name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">SKU: {item.sku}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
          {isLowStock && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Low Stock</span>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={handleEdit} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock</p>
                <p className="text-lg font-bold">{item.current_stock} <span className="text-xs text-gray-400 font-normal">{item.unit_of_measurement}</span></p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="h-4 w-4 text-green-600 flex items-center justify-center font-bold text-sm">₹</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit Price</p>
                <p className="text-lg font-bold">₹{item.unit_price.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cost Price</p>
                <p className="text-lg font-bold">₹{item.cost_price.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isLowStock ? 'bg-red-100' : 'bg-purple-100'}`}>
                <AlertCircle className={`h-4 w-4 ${isLowStock ? 'text-red-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Reorder</p>
                <p className="text-lg font-bold">{item.reorder_point}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
          </div>
          <div className="p-4 space-y-3">
            <DetailRow label="Item Name" value={item.item_name} />
            <DetailRow label="SKU" value={item.sku} />
            <DetailRow label="Type" value={item.item_type || 'N/A'} />
            <DetailRow label="Size" value={item.size || 'N/A'} />
            <DetailRow label="Color" value={item.color || 'N/A'} />
            <DetailRow label="Variant" value={item.variant || 'N/A'} />
            <DetailRow label="Unit" value={item.unit_of_measurement} />
            <DetailRow label="Description" value={item.description || 'N/A'} />
            <DetailRow label="Barcode" value={item.barcode || 'N/A'} />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Pricing & Stock</h3>
          </div>
          <div className="p-4 space-y-3">
            <DetailRow label="Unit Price" value={`₹${item.unit_price.toFixed(2)}`} />
            <DetailRow label="Cost Price" value={`₹${item.cost_price.toFixed(2)}`} />
            <DetailRow label="Margin" value={`₹${(item.unit_price - item.cost_price).toFixed(2)} (${(((item.unit_price - item.cost_price) / item.unit_price) * 100).toFixed(1)}%)`} />
            <DetailRow label="Current Stock" value={`${item.current_stock} ${item.unit_of_measurement}`} />
            <DetailRow label="Reorder Point" value={`${item.reorder_point} ${item.unit_of_measurement}`} />
            <DetailRow label="Tax Rate" value={`${item.tax_rate}%`} />
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Product Details</h3>
          </div>
          <div className="p-4 space-y-3">
            <DetailRow label="Manufacturer" value={item.manufacturer || 'N/A'} />
            <DetailRow label="Brand" value={item.brand || 'N/A'} />
            <DetailRow label="HSN Code" value={item.hsn_code || 'N/A'} />
            <DetailRow label="Returnable" value={item.is_returnable ? 'Yes' : 'No'} />
            <DetailRow label="Created At" value={new Date(item.created_at).toLocaleString()} />
            <DetailRow label="Updated At" value={new Date(item.updated_at).toLocaleString()} />
          </div>
        </div>

        {/* Bin Locations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Bin Locations</h3>
            </div>
            <span className="text-xs text-gray-500">{binLocations.length}</span>
          </div>
          <div className="p-4">
            {loadingBins ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : binLocations.length > 0 ? (
              <div className="space-y-2">
                {binLocations.map((bin, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium text-gray-900">{bin.bin_code}</span>
                      <span className="text-gray-400">({bin.location_name || bin.warehouse})</span>
                    </div>
                    <span className="font-semibold text-blue-600">{bin.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No bin locations allocated</p>
            )}
          </div>
        </div>

        {/* Batches */}
        {item.advanced_tracking_type === 'batches' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-900">Batches</h3>
              </div>
              <span className="text-xs text-gray-500">{batches.length}</span>
            </div>
            <div className="p-4">
              {loadingBatches ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              ) : batches.length > 0 ? (
                <div className="space-y-2">
                  {batches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <span className="font-medium text-gray-900">{batch.batch_number}</span>
                        <span className="text-gray-400 ml-2">{batch.bill_number || ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${Number(batch.remaining_quantity) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {batch.remaining_quantity}/{batch.initial_quantity}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${batch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {batch.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No batches yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailPanel;
