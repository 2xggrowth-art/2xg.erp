import { useState, useEffect } from 'react';
import { X, ShoppingBasket, Plus, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsService, Item as ItemType } from '../services/items.service';
import { stockCountService } from '../services/stockCount.service';
import apiClient from '../services/api.client';

interface LocalItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

interface UserOption {
  id: string;
  full_name: string;
}

interface LocationOption {
  id: string;
  name: string;
}

const NewStockCountPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [assignToUserId, setAssignToUserId] = useState('');
  const [assignToName, setAssignToName] = useState('');
  const [currentStep, setCurrentStep] = useState('configure');
  const [selectedItems, setSelectedItems] = useState<LocalItem[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [availableItems, setAvailableItems] = useState<LocalItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch items, users, locations from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingItems(true);
      try {
        // Fetch items
        const itemsResponse = await itemsService.getAllItems({ isActive: true });
        if (itemsResponse.data.success && itemsResponse.data.data) {
          const transformedItems: LocalItem[] = itemsResponse.data.data.map((item: ItemType) => ({
            id: item.id,
            name: item.item_name,
            sku: item.sku,
            currentStock: item.current_stock
          }));
          setAvailableItems(transformedItems);
        }

        // Fetch users
        const usersResponse = await apiClient.get('/auth/users');
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.data || []);
        }

        // Fetch locations
        const locationsResponse = await apiClient.get('/locations');
        if (locationsResponse.data.success) {
          setLocations(locationsResponse.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchData();
  }, []);

  // Fetch Stock Count Details if Edit Mode
  useEffect(() => {
    if (isEditMode) {
      fetchStockCountDetails();
    }
  }, [id]);

  const fetchStockCountDetails = async () => {
    try {
      const data = await stockCountService.getStockCountById(id!);
      if (data) {
        setDescription(data.description || '');
        setLocationId(data.location_id || '');
        setLocationName(data.location_name || '');
        setAssignToUserId(data.assigned_to_user_id || '');
        setAssignToName(data.assigned_to_name || '');
        const mappedItems: LocalItem[] = (data.items || []).map(item => ({
          id: item.item_id,
          name: item.item_name,
          sku: item.sku,
          currentStock: item.expected_quantity
        }));
        setSelectedItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching stock count details:', error);
      alert('Failed to load stock count details');
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setLocationId(selectedId);
    const loc = locations.find(l => l.id === selectedId);
    setLocationName(loc?.name || '');
  };

  const handleAssignToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAssignToUserId(selectedId);
    const user = users.find(u => u.id === selectedId);
    setAssignToName(user?.full_name || '');
  };

  const handleNext = () => {
    if (currentStep === 'configure') {
      if (!locationId) { alert('Please select a Location'); return; }
      if (!assignToUserId) { alert('Please assign to a user'); return; }
      setCurrentStep('add-items');
    }
  };

  const handleCancel = () => {
    navigate('/items/stock-count');
  };

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      alert('Please add at least one item to the stock count');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        description,
        location_id: locationId,
        location_name: locationName,
        assigned_to_user_id: assignToUserId,
        assigned_to_name: assignToName,
        items: selectedItems.map(item => ({ item_id: item.id })),
      };

      if (isEditMode) {
        await stockCountService.updateStockCount(id!, payload);
        alert('Stock Count updated successfully!');
      } else {
        await stockCountService.createStockCount(payload);
        alert('Stock Count created successfully!');
      }
      navigate('/items/stock-count');
    } catch (error) {
      console.error('Error saving stock count:', error);
      alert('Failed to save stock count. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Edit Stock Count' : 'New Stock Count'}</h1>
          <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className={`flex items-center gap-2 ${currentStep === 'configure' ? 'text-blue-600' : 'text-green-600'}`}>
              {currentStep === 'add-items' ? (
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-blue-600"></div>
              )}
              <span className={`font-medium ${currentStep === 'configure' ? 'text-blue-600' : 'text-slate-600'}`}>Configure</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300 mx-2"></div>
            <div className={`flex items-center gap-2 ${currentStep === 'add-items' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full border-2 ${currentStep === 'add-items' ? 'border-blue-600' : 'border-slate-300'}`}></div>
              <span className={`font-medium ${currentStep === 'add-items' ? 'text-blue-600' : 'text-slate-400'}`}>Add Items</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        {currentStep === 'configure' && (
          <div className="p-6 space-y-6">
            {/* Description */}
            <div className="flex items-start gap-4">
              <label className="w-48 text-slate-700 pt-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Max. 500 characters"
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700">Location<span className="text-red-500">*</span></label>
              <select
                value={locationId}
                onChange={handleLocationChange}
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Assign To */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700">Assign To<span className="text-red-500">*</span></label>
              <select
                value={assignToUserId}
                onChange={handleAssignToChange}
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 'add-items' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Total Added Items ({selectedItems.length})</h2>
              <p className="text-slate-600 text-sm">Select the items you want to add to your count card.</p>
            </div>

            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBasket size={32} className="text-blue-600" />
                </div>
                <p className="text-slate-600 mb-4">Select items to be added in the stock count</p>
                <button onClick={() => setShowItemSelector(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Select Items
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">Selected Items</h3>
                  <button onClick={() => setShowItemSelector(true)} className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    <Plus size={16} /> Add More Items
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Current Stock</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-800">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.sku}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.currentStock}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setSelectedItems(selectedItems.filter(i => i.id !== item.id))} className="text-red-600 hover:text-red-700 text-sm font-medium">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Item Selector Modal */}
        {showItemSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Select Items</h3>
                  <button onClick={() => { setShowItemSelector(false); setSearchQuery(''); }} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by item name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                {isLoadingItems ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading items...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableItems
                      .filter(item => {
                        const q = searchQuery.toLowerCase();
                        return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
                      })
                      .map((item) => {
                        const isSelected = selectedItems.some(i => i.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-300' : 'border-slate-200 hover:bg-slate-50'}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedItems(selectedItems.filter(i => i.id !== item.id));
                              } else {
                                setSelectedItems([...selectedItems, item]);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-slate-800">{item.name}</h4>
                                <p className="text-sm text-slate-600">SKU: {item.sku} | Stock: {item.currentStock}</p>
                              </div>
                              <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-5 h-5 text-blue-600 border-slate-300 rounded" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button onClick={() => setShowItemSelector(false)} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
                <button onClick={() => setShowItemSelector(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Add Selected ({selectedItems.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200">
          {currentStep === 'configure' ? (
            <>
              <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Next</button>
              <button onClick={handleCancel} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setCurrentStep('configure')} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Back</button>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
              </button>
              <button onClick={handleCancel} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewStockCountPage;
