import { useState, useEffect } from 'react';
import { X, Settings, ShoppingBasket, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { itemsService, Item as ItemType } from '../services/items.service';
import { stockCountService, StockCountItem } from '../services/stockCount.service';

interface Item {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

const NewStockCountPage = () => {
  const navigate = useNavigate();
  const [stockCountNumber, setStockCountNumber] = useState('1');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Head Office');
  const [assignTo, setAssignTo] = useState('');
  const [scheduleCounts, setScheduleCounts] = useState(false);
  const [currentStep, setCurrentStep] = useState('configure');
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        const response = await itemsService.getAllItems({ isActive: true });
        if (response.data.success && response.data.data) {
          // Transform API items to our Item interface
          const transformedItems: Item[] = response.data.data.map((item: ItemType) => ({
            id: item.id,
            name: item.item_name,
            sku: item.sku,
            currentStock: item.current_stock
          }));
          setAvailableItems(transformedItems);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        // Optionally show an error message to the user
        alert('Failed to load items. Please try again.');
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, []);

  const handleNext = () => {
    if (currentStep === 'configure') {
      // Validate required fields
      if (!stockCountNumber) {
        alert('Please enter a Stock Count Number');
        return;
      }
      if (!location) {
        alert('Please select a Location');
        return;
      }
      if (!assignTo) {
        alert('Please assign to a user');
        return;
      }
      setCurrentStep('add-items');
    }
  };

  const handleCancel = () => {
    navigate('/items/stock-count');
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">New Stock Count</h1>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
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
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-blue-600"></div>
              )}
              <span className={`font-medium ${currentStep === 'configure' ? 'text-blue-600' : 'text-slate-600'}`}>
                Configure
              </span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300 mx-2"></div>
            <div className={`flex items-center gap-2 ${currentStep === 'add-items' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full border-2 ${currentStep === 'add-items' ? 'border-blue-600' : 'border-slate-300'}`}></div>
              <span className={`font-medium ${currentStep === 'add-items' ? 'text-blue-600' : 'text-slate-400'}`}>
                Add Items
              </span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        {currentStep === 'configure' && (
          <div className="p-6 space-y-6">
            {/* Stock Count Number */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700">
                Stock Count#<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={stockCountNumber}
                  onChange={(e) => setStockCountNumber(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>

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
              <label className="w-48 text-slate-700">
                Location<span className="text-red-500">*</span>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Head Office">Head Office</option>
                <option value="Warehouse 1">Warehouse 1</option>
                <option value="Warehouse 2">Warehouse 2</option>
              </select>
            </div>

            {/* Assign To */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700 flex items-center gap-1">
                Assign To<span className="text-red-500">*</span>
                <button className="text-slate-400 hover:text-slate-600">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none" strokeWidth="1.5"/>
                    <text x="8" y="11" fontSize="10" textAnchor="middle" fill="currentColor">?</text>
                  </svg>
                </button>
              </label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-400"
              >
                <option value="">Select user</option>
                <option value="user1">John Doe</option>
                <option value="user2">Jane Smith</option>
                <option value="user3">Bob Johnson</option>
              </select>
            </div>

            {/* Schedule Counts */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700"></label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scheduleCounts}
                  onChange={(e) => setScheduleCounts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-slate-700">Schedule Counts</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'add-items' && (
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Total Added Items ({selectedItems.length})
              </h2>
              <p className="text-slate-600 text-sm">
                Select the items you want to add to your count card, to start stock counting.
              </p>
            </div>

            {/* Empty State */}
            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBasket size={32} className="text-blue-600" />
                </div>
                <p className="text-slate-600 mb-4">Select items to be added in the stock count</p>
                <button
                  onClick={() => setShowItemSelector(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Select Items
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">Selected Items</h3>
                  <button
                    onClick={() => setShowItemSelector(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Plus size={16} />
                    Add More Items
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
                            <button
                              onClick={() => setSelectedItems(selectedItems.filter(i => i.id !== item.id))}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
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
                  <button
                    onClick={() => {
                      setShowItemSelector(false);
                      setSearchQuery('');
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                {/* Search Bar */}
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
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading items...</p>
                    </div>
                  </div>
                ) : availableItems.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <ShoppingBasket size={48} className="text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium mb-2">No items found</p>
                      <p className="text-sm text-slate-500">Please add items first before creating a stock count</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableItems
                      .filter(item => {
                        const query = searchQuery.toLowerCase();
                        return item.name.toLowerCase().includes(query) ||
                               item.sku.toLowerCase().includes(query);
                      })
                      .map((item) => {
                        const isSelected = selectedItems.some(i => i.id === item.id);
                        return (
                        <div
                          key={item.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
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
                              <p className="text-sm text-slate-600">SKU: {item.sku} • Stock: {item.currentStock}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowItemSelector(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowItemSelector(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
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
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Next
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentStep('configure')}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  if (selectedItems.length === 0) {
                    alert('Please add at least one item to the stock count');
                    return;
                  }

                  try {
                    // Transform selected items to StockCountItem format
                    const stockCountItems: StockCountItem[] = selectedItems.map(item => ({
                      id: item.id,
                      name: item.name,
                      sku: item.sku,
                      currentStock: item.currentStock
                    }));

                    // Create stock count
                    await stockCountService.createStockCount({
                      description,
                      location,
                      assignTo,
                      items: stockCountItems
                    });

                    alert('Stock Count saved successfully!');
                    navigate('/items/stock-count');
                  } catch (error) {
                    console.error('Error saving stock count:', error);
                    alert('Failed to save stock count. Please try again.');
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewStockCountPage;
