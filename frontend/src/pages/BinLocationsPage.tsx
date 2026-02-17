import { useState, useEffect } from 'react';
import { Package, MapPin, Search, Plus, ChevronDown, ChevronUp, X, Trash2, Pencil } from 'lucide-react';
import { binLocationService, BinLocationWithStock } from '../services/binLocation.service';
import { locationsService, Location } from '../services/locations.service';

const BinLocationsPage = () => {
  const [bins, setBins] = useState<BinLocationWithStock[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBins, setExpandedBins] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBin, setNewBin] = useState({ bin_code: '', location_id: '', description: '' });
  const [addError, setAddError] = useState('');
  const [editingBin, setEditingBin] = useState<BinLocationWithStock | null>(null);
  const [editForm, setEditForm] = useState({ bin_code: '', location_id: '', description: '', status: 'active' as 'active' | 'inactive' });
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchBinsWithStock();
    fetchLocations();
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

  const fetchLocations = async () => {
    try {
      const response = await locationsService.getAllLocations({ status: 'active' });
      if (response.success && response.data) {
        setLocations(response.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleAddBinLocation = async () => {
    if (!newBin.bin_code.trim() || !newBin.location_id) {
      setAddError('Bin code and location are required');
      return;
    }
    try {
      setAddError('');
      const response = await binLocationService.createBinLocation({
        bin_code: newBin.bin_code.trim(),
        location_id: newBin.location_id,
        description: newBin.description.trim() || undefined,
      });
      if (response.success) {
        setShowAddModal(false);
        setNewBin({ bin_code: '', location_id: '', description: '' });
        fetchBinsWithStock();
      } else {
        setAddError(response.error || 'Failed to create bin location');
      }
    } catch (error: any) {
      setAddError(error?.message || 'Failed to create bin location');
    }
  };

  const handleDeleteBin = async (binId: string, binCode: string) => {
    if (!window.confirm(`Are you sure you want to delete bin "${binCode}"? This will also remove its allocation history.`)) return;
    try {
      const response = await binLocationService.deleteBinLocation(binId);
      if (response.success) {
        fetchBinsWithStock();
      } else {
        alert(response.error || 'Failed to delete bin location');
      }
    } catch (error: any) {
      alert(error?.message || 'Failed to delete bin location');
    }
  };

  const openEditModal = (bin: BinLocationWithStock) => {
    setEditingBin(bin);
    setEditForm({
      bin_code: bin.bin_code,
      location_id: bin.location_id || '',
      description: bin.description || '',
      status: bin.status || 'active',
    });
    setEditError('');
  };

  const handleEditBinLocation = async () => {
    if (!editingBin) return;
    if (!editForm.bin_code.trim() || !editForm.location_id) {
      setEditError('Bin code and location are required');
      return;
    }
    try {
      setEditError('');
      const response = await binLocationService.updateBinLocation(editingBin.id, {
        bin_code: editForm.bin_code.trim(),
        location_id: editForm.location_id,
        description: editForm.description.trim() || undefined,
        status: editForm.status,
      });
      if (response.success) {
        setEditingBin(null);
        fetchBinsWithStock();
      } else {
        setEditError(response.error || 'Failed to update bin location');
      }
    } catch (error: any) {
      setEditError(error?.message || 'Failed to update bin location');
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

  const getLocationName = (bin: any) => {
    return bin.locations?.name || bin.warehouse || 'Unknown';
  };

  const filteredBins = bins.filter(bin =>
    bin.bin_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getLocationName(bin).toLowerCase().includes(searchTerm.toLowerCase()) ||
    bin.items.some(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group bins by location
  const groupedBins = filteredBins.reduce((groups, bin) => {
    const locationName = getLocationName(bin);
    if (!groups[locationName]) {
      groups[locationName] = [];
    }
    groups[locationName].push(bin);
    return groups;
  }, {} as Record<string, typeof filteredBins>);

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
              placeholder="Search bins, locations, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              if (locations.length === 0) {
                alert('Please create at least one location in Settings before adding bins.');
                return;
              }
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Bin
          </button>
        </div>
      </div>

      {/* Bin Locations List - Grouped by Location */}
      <div className="space-y-6">
        {Object.entries(groupedBins).map(([locationName, locationBins]) => (
          <div key={locationName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Location Header */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <MapPin className="text-blue-600" size={20} />
              <h3 className="text-base font-semibold text-gray-800">{locationName}</h3>
              <span className="text-sm text-gray-500 ml-1">({locationBins.length} bin{locationBins.length !== 1 ? 's' : ''})</span>
            </div>

            {/* Bins under this location */}
            <div className="divide-y divide-gray-100">
              {locationBins.map((bin) => (
                <div key={bin.id}>
                  <div
                    onClick={() => toggleBinExpansion(bin.id)}
                    className="px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${bin.total_items > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Package className={bin.total_items > 0 ? 'text-green-600' : 'text-gray-400'} size={18} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{bin.bin_code}</h4>
                          {bin.description && (
                            <p className="text-sm text-gray-500">{bin.description}</p>
                          )}
                        </div>
                        <div className="text-right text-sm mr-2">
                          <span className="text-gray-500">Items: </span>
                          <span className="font-semibold text-gray-900">
                            {searchTerm.trim() ? bin.items.filter(i => i.item_name.toLowerCase().includes(searchTerm.toLowerCase())).length : bin.total_items}
                          </span>
                          <span className="text-gray-300 mx-2">|</span>
                          <span className="text-gray-500">Qty: </span>
                          <span className="font-semibold text-gray-900">
                            {searchTerm.trim() ? bin.items.filter(i => i.item_name.toLowerCase().includes(searchTerm.toLowerCase())).reduce((s, i) => s + i.quantity, 0) : bin.total_quantity}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(bin); }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Edit bin"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBin(bin.id, bin.bin_code); }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete bin"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div>
                          {(searchTerm.trim() && bin.items.some(i => i.item_name.toLowerCase().includes(searchTerm.toLowerCase()))) || expandedBins.has(bin.id) ? (
                            <ChevronUp className="text-gray-400" size={18} />
                          ) : (
                            <ChevronDown className="text-gray-400" size={18} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bin Items (Expanded View) */}
                  {(expandedBins.has(bin.id) || (searchTerm.trim() && bin.items.some(i => i.item_name.toLowerCase().includes(searchTerm.toLowerCase())))) && bin.items.length > 0 && (() => {
                    const displayItems = searchTerm.trim()
                      ? bin.items.filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
                      : bin.items;
                    return displayItems.length > 0 ? (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="px-5 py-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Items in this bin:</h4>
                        <div className="space-y-3">
                          {displayItems.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-3">
                                <Package className="text-blue-600" size={20} />
                                <div>
                                  <p className="font-medium text-gray-900">{item.item_name}</p>
                                  <p className="text-sm text-gray-600">
                                    Quantity: <span className="font-semibold">{item.quantity} {item.unit_of_measurement}</span>
                                  </p>
                                </div>
                              </div>
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
                    ) : null;
                  })()}

                  {/* Empty Bin Message */}
                  {expandedBins.has(bin.id) && bin.items.length === 0 && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
                      <Package className="mx-auto text-gray-300 mb-1" size={36} />
                      <p className="text-sm text-gray-500">This bin is currently empty</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              <h3 className="text-lg font-semibold text-gray-900">Add Bin</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={newBin.location_id}
                  onChange={(e) => setNewBin({ ...newBin, location_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {locations.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No locations available. Create a location in Settings first.</p>
                )}
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
                disabled={locations.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Bin Location Modal */}
      {editingBin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Bin</h3>
              <button onClick={() => { setEditingBin(null); setEditError(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{editError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bin Code *</label>
                <input
                  type="text"
                  value={editForm.bin_code}
                  onChange={(e) => setEditForm({ ...editForm, bin_code: e.target.value })}
                  placeholder="e.g. BIN-A01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={editForm.location_id}
                  onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setEditingBin(null); setEditError(''); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBinLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinLocationsPage;
