import { useState, useEffect } from 'react';
import { Package, MapPin, Search, Plus, ChevronDown, ChevronUp, X } from 'lucide-react';
import { binLocationService, BinLocationWithStock } from '../services/binLocation.service';

const BinLocationsPage = () => {
  const [bins, setBins] = useState<BinLocationWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBins, setExpandedBins] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBin, setNewBin] = useState({ bin_code: '', warehouse: '', description: '' });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchBinsWithStock();
  }, []);

  const fetchBinsWithStock = async () => {
    try {
      setLoading(true);
      const response = await binLocationService.getBinLocationsWithStock();
      if (response.success && response.data) {
        setBins(response.data);
      }
    } catch (error) {
      console.error('Error fetching bins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBinLocation = async () => {
    if (!newBin.bin_code.trim() || !newBin.warehouse.trim()) {
      setAddError('Bin code and warehouse are required');
      return;
    }
    try {
      setAddError('');
      const response = await binLocationService.createBinLocation({
        bin_code: newBin.bin_code.trim(),
        warehouse: newBin.warehouse.trim(),
        description: newBin.description.trim() || undefined,
      });
      if (response.success) {
        setShowAddModal(false);
        setNewBin({ bin_code: '', warehouse: '', description: '' });
        fetchBinsWithStock();
      } else {
        setAddError(response.error || 'Failed to create bin location');
      }
    } catch (error: any) {
      setAddError(error?.message || 'Failed to create bin location');
    }
  };

  const toggleBinExpansion = (binId: string) => {
    const newExpanded = new Set(expandedBins);
    if (newExpanded.has(binId)) {
      newExpanded.delete(binId);
    } else {
      newExpanded.add(binId);
    }
    setExpandedBins(newExpanded);
  };

  const filteredBins = bins.filter(bin =>
    bin.bin_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bin.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bin.items.some(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalBins = filteredBins.length;
  const occupiedBins = filteredBins.filter(bin => bin.total_items > 0).length;
  const emptyBins = totalBins - occupiedBins;
  const totalItems = filteredBins.reduce((sum, bin) => sum + bin.total_items, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading bin locations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="text-blue-600" size={28} />
          Bin Locations & Stock
        </h1>
        <p className="text-gray-600 mt-1">View all bin locations and their current inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bins</p>
              <p className="text-2xl font-bold text-gray-900">{totalBins}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupied Bins</p>
              <p className="text-2xl font-bold text-green-600">{occupiedBins}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empty Bins</p>
              <p className="text-2xl font-bold text-gray-500">{emptyBins}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <MapPin className="text-gray-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Items</p>
              <p className="text-2xl font-bold text-purple-600">{totalItems}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search bins, warehouses, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Bin Location
          </button>
        </div>
      </div>

      {/* Bin Locations List */}
      <div className="space-y-4">
        {filteredBins.map((bin) => (
          <div key={bin.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Bin Header */}
            <div
              onClick={() => toggleBinExpansion(bin.id)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${bin.total_items > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <MapPin className={bin.total_items > 0 ? 'text-green-600' : 'text-gray-400'} size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{bin.bin_code}</h3>
                    <p className="text-sm text-gray-600">{bin.warehouse}</p>
                    {bin.description && (
                      <p className="text-sm text-gray-500 mt-1">{bin.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-600">Items:</span>
                      <span className="font-semibold text-gray-900">{bin.total_items}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Total Qty:</span>
                      <span className="font-semibold text-gray-900">{bin.total_quantity}</span>
                    </div>
                  </div>
                  <div>
                    {expandedBins.has(bin.id) ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bin Items (Expanded View) */}
            {expandedBins.has(bin.id) && bin.items.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Items in this bin:</h4>
                  <div className="space-y-3">
                    {bin.items.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Package className="text-blue-600" size={20} />
                            <div>
                              <p className="font-medium text-gray-900">{item.item_name}</p>
                              <p className="text-sm text-gray-600">
                                Quantity: <span className="font-semibold">{item.quantity} {item.unit_of_measurement}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Transaction History */}
                        {item.transactions && item.transactions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Transaction History:</p>
                            <div className="space-y-1">
                              {item.transactions.slice(0, 3).map((transaction, txIndex) => (
                                <div key={txIndex} className="flex items-center justify-between text-xs text-gray-600">
                                  <span>
                                    {transaction.type === 'purchase' ? 'Bill' : 'Invoice'} {transaction.reference} - {new Date(transaction.date).toLocaleDateString()}
                                  </span>
                                  <span className={`font-medium ${transaction.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} {item.unit_of_measurement}
                                  </span>
                                </div>
                              ))}
                              {item.transactions.length > 3 && (
                                <p className="text-xs text-blue-600 italic">
                                  +{item.transactions.length - 3} more transaction{item.transactions.length - 3 > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty Bin Message */}
            {expandedBins.has(bin.id) && bin.items.length === 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-6 text-center">
                <Package className="mx-auto text-gray-300 mb-2" size={48} />
                <p className="text-gray-500">This bin is currently empty</p>
              </div>
            )}
          </div>
        ))}

        {filteredBins.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bin locations found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first bin location'}
            </p>
          </div>
        )}
      </div>

      {/* Add Bin Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Bin Location</h3>
              <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{addError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bin Code *</label>
                <input
                  type="text"
                  value={newBin.bin_code}
                  onChange={(e) => setNewBin({ ...newBin, bin_code: e.target.value })}
                  placeholder="e.g. BIN-A01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                <input
                  type="text"
                  value={newBin.warehouse}
                  onChange={(e) => setNewBin({ ...newBin, warehouse: e.target.value })}
                  placeholder="e.g. Main Warehouse"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newBin.description}
                  onChange={(e) => setNewBin({ ...newBin, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); setAddError(''); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBinLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinLocationsPage;
