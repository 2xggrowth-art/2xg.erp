import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsService, Item } from '../services/items.service';
import { ArrowLeft, Edit2, Trash2, Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchItemDetails(id);
    }
  }, [id]);

  const fetchItemDetails = async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await itemsService.getItemById(itemId);
      if (response.data.success && response.data.data) {
        setItem(response.data.data);
      } else {
        setError('Failed to load item details');
      }
    } catch (err: any) {
      console.error('Error fetching item:', err);
      setError(err.message || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/items/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsService.deleteItem(id!);
        navigate('/items');
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Item</h2>
          <p className="text-gray-600 mb-4">{error || 'Item not found'}</p>
          <button
            onClick={() => navigate('/items')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  const isLowStock = item.current_stock <= item.reorder_point;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/items')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{item.item_name}</h1>
              <p className="text-gray-500 mt-1">SKU: {item.sku}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${item.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
              }`}
          >
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
          {isLowStock && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Low Stock
            </span>
          )}
          {item.is_returnable && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Returnable
            </span>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">{item.current_stock}</p>
                <p className="text-xs text-gray-500">{item.unit_of_measurement}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unit Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{item.unit_price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{item.cost_price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isLowStock ? 'bg-red-100' : 'bg-purple-100'}`}>
                <AlertCircle className={`h-6 w-6 ${isLowStock ? 'text-red-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reorder Level</p>
                <p className="text-2xl font-bold text-gray-900">{item.reorder_point}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow label="Item Name" value={item.item_name} />
              <DetailRow label="SKU" value={item.sku} />
              <DetailRow label="Unit of Measurement" value={item.unit_of_measurement} />
              <DetailRow label="Description" value={item.description || 'N/A'} />
              <DetailRow label="Barcode" value={item.barcode || 'N/A'} />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pricing & Stock</h2>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow label="Unit Price" value={`₹${item.unit_price.toFixed(2)}`} />
              <DetailRow label="Cost Price" value={`₹${item.cost_price.toFixed(2)}`} />
              <DetailRow
                label="Margin"
                value={`₹${(item.unit_price - item.cost_price).toFixed(2)} (${(((item.unit_price - item.cost_price) / item.unit_price) * 100).toFixed(1)}%)`}
              />
              <DetailRow label="Current Stock" value={`${item.current_stock} ${item.unit_of_measurement}`} />
              <DetailRow label="Reorder Point" value={`${item.reorder_point} ${item.unit_of_measurement}`} />
              <DetailRow label="Max Stock" value={item.max_stock ? `${item.max_stock} ${item.unit_of_measurement}` : 'N/A'} />
              <DetailRow label="Tax Rate" value={`${item.tax_rate}%`} />
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow label="Manufacturer" value={item.manufacturer || 'N/A'} />
              <DetailRow label="Brand" value={item.brand || 'N/A'} />
              <DetailRow label="HSN Code" value={item.hsn_code || 'N/A'} />
              <DetailRow label="Weight" value={item.weight ? `${item.weight} kg` : 'N/A'} />
              <DetailRow label="Dimensions" value={item.dimensions || 'N/A'} />
              <DetailRow label="Returnable" value={item.is_returnable ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Identifiers */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Identifiers</h2>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow label="UPC" value={item.upc || 'N/A'} />
              <DetailRow label="MPN" value={item.mpn || 'N/A'} />
              <DetailRow label="EAN" value={item.ean || 'N/A'} />
              <DetailRow label="ISBN" value={item.isbn || 'N/A'} />
              <DetailRow label="Created At" value={new Date(item.created_at).toLocaleString()} />
              <DetailRow label="Updated At" value={new Date(item.updated_at).toLocaleString()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    <span className="text-sm text-gray-900 text-right">{value}</span>
  </div>
);

export default ItemDetailPage;
