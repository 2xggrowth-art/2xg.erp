import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Plus, Search, Grid, List, MoreVertical, Upload, Download, FileSpreadsheet, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { itemsService, Item as ItemType } from '../services/items.service';
import BulkActionBar, { createBulkDeleteAction, createBulkExportAction } from '../components/common/BulkActionBar';
import { parseCSV, jsonToCSV, downloadCSV } from '../utils/csvParser';
import { generateImportTemplate, mapCSVToItemData, mapItemToCSV, EXPORT_COLUMN_ORDER } from '../utils/itemImportTemplate';

interface Item {
  id: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  stock_on_hand: number;
  reorder_level: number;
}

const ItemsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [importMode, setImportMode] = useState<'create' | 'update' | 'upsert'>('create');
  const [importProgress, setImportProgress] = useState({
    status: 'idle' as 'idle' | 'validating' | 'importing' | 'complete' | 'error',
    current: 0,
    total: 0,
    errors: [] as string[]
  });

  // Fetch items on mount, pathname change, or refresh key change
  useEffect(() => {
    fetchItems();
  }, [location.pathname, refreshKey]);

  // Refetch when location state changes (coming from edit)
  useEffect(() => {
    if (location.state?.refetch) {
      console.log('Refetch triggered!');
      setRefreshKey(prev => prev + 1);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refetch]);

  const fetchItems = async () => {
    try {
      console.log('Fetching items at:', new Date().toISOString());
      setLoading(true);
      setError(null);
      // Add timestamp to prevent caching
      const response = await itemsService.getAllItems({ isActive: true });

      console.log('Items API Response:', response);

      // Axios response structure: response.data = { success: boolean, data: Item[] }
      if (response.data.success && response.data.data) {
        // Map API response to ItemsPage interface
        const mappedItems: Item[] = response.data.data.map((item: ItemType) => ({
          id: item.id,
          name: item.item_name,
          sku: item.sku,
          unit: item.unit_of_measurement,
          category: '', // TODO: Get category name from joined data
          stock_on_hand: item.current_stock,
          reorder_level: item.reorder_point
        }));
        console.log('Mapped items with names:', mappedItems.map(i => ({ id: i.id, name: i.name })));
        setItems(mappedItems);
      } else {
        setError('Failed to load items');
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selection handlers
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      try {
        await Promise.all(selectedItems.map(id => itemsService.deleteItem(id)));
        setSelectedItems([]);
        fetchItems();
      } catch (error) {
        console.error('Error deleting items:', error);
        alert('Failed to delete some items. Please try again.');
      }
    }
  };

  const handleBulkExport = () => {
    const selectedData = items.filter(item => selectedItems.includes(item.id));
    const csv = [
      ['Name', 'SKU', 'Unit', 'Stock on Hand', 'Reorder Level'].join(','),
      ...selectedData.map(item => [
        item.name,
        item.sku,
        item.unit,
        item.stock_on_hand.toString(),
        item.reorder_level.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Bulk actions configuration
  const bulkActions = [
    createBulkDeleteAction(handleBulkDelete),
    createBulkExportAction(handleBulkExport)
  ];

  // Import/Export handlers
  const handleDownloadTemplate = () => {
    generateImportTemplate();
  };

  const handleExportItems = async () => {
    try {
      const response = await itemsService.exportItems({ includeInactive: false });
      if (response.data.success) {
        const exportData = response.data.data.map(mapItemToCSV);
        const csv = jsonToCSV(exportData, EXPORT_COLUMN_ORDER);
        downloadCSV(csv, `items_export_${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Error exporting items:', error);
      alert('Failed to export items');
    }
  };

  const handleImportSubmit = async () => {
    try {
      setImportProgress({ ...importProgress, status: 'validating' });

      let itemsData: any[] = [];

      // Parse CSV file or fetch from Google Sheets
      if (importFile) {
        const parseResult = await parseCSV(importFile);
        if (parseResult.errors.length > 0) {
          setImportProgress({
            ...importProgress,
            status: 'error',
            errors: parseResult.errors
          });
          return;
        }
        itemsData = parseResult.data.map(mapCSVToItemData);
      } else if (googleSheetsUrl) {
        // Call backend to fetch from Google Sheets
        const response = await itemsService.importFromGoogleSheets(googleSheetsUrl, importMode);
        if (response.data.success) {
          setImportProgress({
            status: 'complete',
            current: response.data.data.successful.length,
            total: response.data.data.successful.length + response.data.data.failed.length,
            errors: response.data.data.failed.map((f: any) => `Row ${f.row}: ${f.error}`)
          });
          fetchItems();
        }
        return;
      }

      // Validate data
      const validationResponse = await itemsService.validateImportData(itemsData);
      if (!validationResponse.data.data.valid) {
        setImportProgress({
          ...importProgress,
          status: 'error',
          errors: validationResponse.data.data.errors.map((e: any) =>
            `Row ${e.row}: ${e.field} - ${e.message}`
          )
        });
        return;
      }

      // Import data
      setImportProgress({ ...importProgress, status: 'importing', total: itemsData.length });
      const importResponse = await itemsService.importItems(itemsData, importMode);

      if (importResponse.data.success) {
        const result = importResponse.data.data;
        setImportProgress({
          status: 'complete',
          current: result.successful.length,
          total: itemsData.length,
          errors: result.failed.map((f: any) => `Row ${f.row}: ${f.error}`)
        });

        // Refresh items list
        fetchItems();
      }
    } catch (error: any) {
      setImportProgress({
        ...importProgress,
        status: 'error',
        errors: [error.message || 'Import failed']
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Items</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* New Button */}
              <button
                onClick={() => navigate('/items/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New
              </button>

              {/* 3-Dot Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                  title="More actions"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {showActionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActionsMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setShowImportModal(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Upload className="w-4 h-4" />
                        Import Items
                      </button>
                      <button
                        onClick={() => {
                          handleExportItems();
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Download className="w-4 h-4" />
                        Export Items
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          handleDownloadTemplate();
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Download Template
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="px-6 pb-4 flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading items...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium mb-2">Error loading items</p>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchItems}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STOCK ON HAND
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      REORDER LEVEL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Package className="w-12 h-12 mb-3" />
                          <p className="text-lg font-medium">No items found</p>
                          <p className="text-sm mt-1">
                            {searchQuery ? 'Try a different search term' : 'Click "+ New" to add your first item'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/items/${item.id}`)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-blue-600 hover:underline">
                                {item.name}
                              </div>
                              {item.category && <div className="text-xs text-gray-500">{item.category}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-900">{item.stock_on_hand.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-900">{item.reorder_level}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedItems.length > 0 && (
        <BulkActionBar
          selectedCount={selectedItems.length}
          totalCount={filteredItems.length}
          onClearSelection={clearSelection}
          onSelectAll={handleSelectAll}
          actions={bulkActions}
          entityName="item"
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Import Items</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setGoogleSheetsUrl('');
                    setImportProgress({ status: 'idle', current: 0, total: 0, errors: [] });
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Import Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Mode
                </label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="create">Create New Items Only (Skip Duplicates)</option>
                  <option value="update">Update Existing Items Only</option>
                  <option value="upsert">Create New or Update Existing</option>
                </select>
              </div>

              {/* CSV File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setGoogleSheetsUrl('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Google Sheets URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets URL (Public Sheet)
                </label>
                <input
                  type="text"
                  value={googleSheetsUrl}
                  onChange={(e) => {
                    setGoogleSheetsUrl(e.target.value);
                    setImportFile(null);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sheet must be publicly accessible (Share → Anyone with link can view)
                </p>
              </div>

              {/* Progress/Status Display */}
              {importProgress.status !== 'idle' && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50">
                  {importProgress.status === 'validating' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Validating data...</span>
                    </div>
                  )}

                  {importProgress.status === 'importing' && (
                    <div>
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Importing... {importProgress.current}/{importProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {importProgress.status === 'complete' && (
                    <div>
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Import Complete!</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Successfully imported: {importProgress.current} items
                      </p>
                      {importProgress.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-orange-600 font-medium">
                            Failed: {importProgress.errors.length} items
                          </p>
                          <div className="mt-1 max-h-32 overflow-y-auto text-xs text-gray-600">
                            {importProgress.errors.map((err, idx) => (
                              <div key={idx}>{err}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {importProgress.status === 'error' && (
                    <div>
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Import Failed</span>
                      </div>
                      <div className="mt-1 max-h-32 overflow-y-auto text-xs text-gray-600">
                        {importProgress.errors.map((err, idx) => (
                          <div key={idx}>{err}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={(!importFile && !googleSheetsUrl) || importProgress.status === 'importing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {importProgress.status === 'importing' ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;
