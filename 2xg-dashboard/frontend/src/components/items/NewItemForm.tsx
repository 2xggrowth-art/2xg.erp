import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsService } from '../../services/items.service';
import { vendorsService, Vendor } from '../../services/vendors.service';

const NewItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState({
    type: 'goods',
    name: '',
    sku: '',
    unit: '',
    category: '',
    returnableItem: false,
    hsnCode: '',
    taxPreference: 'taxable',
    manufacturer: '',
    brand: '',

    // Sales Information
    sellable: true,
    sellingPrice: '',
    salesAccount: 'Sales',
    salesDescription: '',
    // Purchase Information
    purchasable: true,
    costPrice: '',
    purchaseAccount: 'Cost of Goods Sold',
    purchaseDescription: '',
    preferredVendor: '',
    // Inventory Tracking
    trackInventory: true,
    trackBinLocation: false,
    advancedTracking: 'none',
    inventoryAccount: '',
    valuationMethod: '',
    reorderPoint: '',
    quantity: '0' // Added quantity field
  });

  // Fetch items for SKU validation and last SKU
  const [items, setItems] = useState<any[]>([]);
  const [lastSku, setLastSku] = useState<string>('');
  const [duplicateSkuError, setDuplicateSkuError] = useState<boolean>(false);

  useEffect(() => {
    fetchVendors();
    fetchItems(); // Fetch items for SKU validation and last SKU
    if (isEditMode && id) {
      fetchItemDetails(id);
    }
  }, [id, isEditMode]);

  const fetchItems = async () => {
    try {
      const response = await itemsService.getAllItems();
      if (response.data.success && response.data.data) {
        const fetchedItems = response.data.data;
        setItems(fetchedItems);
        // Find last SKU (assuming simple string sort or creation date if available in sort)
        // Ideally backend should provide this, but client-side approximation:
        if (fetchedItems.length > 0) {
          // Sort by created_at desc if possible, or just look at list
          // Assuming default list might not be sorted, let's sort by created_at
          const sorted = [...fetchedItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setLastSku(sorted[0].sku);
        }
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorsService.getAllVendors({ isActive: true });
      const apiResponse = response.data;
      if (apiResponse.success && apiResponse.data) {
        setVendors(apiResponse.data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchItemDetails = async (itemId: string) => {
    try {
      setFetching(true);
      const response = await itemsService.getItemById(itemId);
      const apiResponse = response.data;
      if (apiResponse.success && apiResponse.data) {
        const item = apiResponse.data;

        setFormData({
          type: 'goods', // Default as usually not stored directly or derived from other fields
          name: item.item_name,
          sku: item.sku,
          unit: item.unit_of_measurement,
          category: item.category_id || '',
          returnableItem: item.is_returnable,
          hsnCode: item.hsn_code || '',
          taxPreference: item.tax_rate > 0 ? 'taxable' : 'non-taxable',
          // Removed dimension and weight fields
          manufacturer: item.manufacturer || '',
          brand: item.brand || '',
          // Removed UPC, MPN, EAN, ISBN fields

          // Sales Information
          sellable: item.is_active, // Assuming is_active relates to sellable for now, or fetch specific field if added
          sellingPrice: item.unit_price ? item.unit_price.toString() : '',
          salesAccount: 'Sales', // Default, as not returned in getById usually
          salesDescription: item.description || '',

          // Purchase Information
          purchasable: true,
          costPrice: item.cost_price ? item.cost_price.toString() : '',
          purchaseAccount: 'Cost of Goods Sold',
          purchaseDescription: '', // Not in item interface shown
          preferredVendor: item.supplier_id || '',

          // Inventory Tracking
          trackInventory: true,
          trackBinLocation: false,
          advancedTracking: 'none',
          inventoryAccount: '',
          valuationMethod: '',
          reorderPoint: item.reorder_point ? item.reorder_point.toString() : '',
          // Add quantity if editing? Usually stock is separate, but we can set initial if needed or separate field
          quantity: item.current_stock ? item.current_stock.toString() : '0'
        });
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      alert('Failed to fetch item details');
      navigate('/items');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox specifically
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'sku') {
      const isDuplicate = items.some(i => i.sku.toLowerCase() === value.toLowerCase() && i.id !== id);
      setDuplicateSkuError(isDuplicate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (duplicateSkuError) {
      alert('SKU already exists. Please use a unique SKU.');
      return;
    }

    setLoading(true);

    try {
      // Prepare item data for API
      const itemData: any = {
        name: formData.name,
        sku: formData.sku,
        unit: formData.unit,
        // category: formData.category || undefined, // TODO: Implement category dropdown with UUID selection
        hsn_code: formData.hsnCode || undefined,
        manufacturer: formData.manufacturer || undefined,
        brand: formData.brand || undefined,
        // Removed UPC, MPN, EAN, ISBN fields
        is_returnable: formData.returnableItem,
        // Removed weight and dimensions
        tax_rate: formData.taxPreference === 'taxable' ? 18 : 0, // Default 18% GST for taxable items

        // Sales Information
        is_sellable: formData.sellable,
        unit_price: formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0, // Map selling price to unit_price
        selling_price: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        sales_account: formData.salesAccount || undefined,
        sales_description: formData.salesDescription || undefined,

        // Purchase Information
        is_purchasable: formData.purchasable,
        cost_price: formData.costPrice ? parseFloat(formData.costPrice) : 0, // Add cost_price mapping
        purchase_account: formData.purchaseAccount || undefined,
        purchase_description: formData.purchaseDescription || undefined,
        preferred_vendor_id: formData.preferredVendor || undefined, // TODO: Convert vendor name to UUID

        // Inventory Tracking
        track_inventory: formData.trackInventory,
        track_bin_location: formData.trackBinLocation,
        advanced_tracking_type: formData.advancedTracking,
        inventory_account: formData.inventoryAccount || undefined,
        valuation_method: formData.valuationMethod || undefined,
        reorder_point: formData.reorderPoint ? parseInt(formData.reorderPoint) : 10,
        current_stock: formData.quantity ? parseFloat(formData.quantity) : 0, // Include quantity as current_stock
      };

      // Call API to create or update item
      let response;
      if (isEditMode && id) {
        console.log('=== FRONTEND UPDATE ===');
        console.log('Item ID:', id);
        console.log('formData.name:', formData.name);
        console.log('itemData.name:', itemData.name);
        console.log('Full itemData:', JSON.stringify(itemData, null, 2));
        response = await itemsService.updateItem(id, itemData);
      } else {
        response = await itemsService.createItem(itemData);
      }

      console.log('API Response:', response);
      console.log('Returned item name:', response.data.data?.item_name);

      // Axios response structure: response.data = { success: boolean, data: Item, error?: string }
      if (response.data.success && response.data.data) {
        // Navigate to the items list page with refetch flag
        navigate('/items', { state: { refetch: true } });
      } else {
        const errorMsg = response.data.error || 'Failed to save item. Please try again.';
        console.error('Save failed:', errorMsg);
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save item. Please try again.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/items');
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-800">{isEditMode ? 'Edit Item' : 'New Item'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || duplicateSkuError}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

          {/* Type Selection */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              Type
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </label>
            <div className="col-span-3 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="goods"
                  checked={formData.type === 'goods'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Goods</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="service"
                  checked={formData.type === 'service'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Service</span>
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Name<span className="text-red-500">*</span>
            </label>
            <div className="col-span-3">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter item name"
                required
              />
            </div>
          </div>

          {/* SKU */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              SKU<span className="text-red-500">*</span>
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </label>
            <div className="col-span-3">
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${duplicateSkuError ? 'border-red-500' : 'border-blue-400'}`}
                placeholder="Enter SKU"
                required
              />
              {duplicateSkuError && (
                <p className="text-xs text-red-500 mt-1">SKU already exists. Please choose a unique SKU.</p>
              )}
              {lastSku && !isEditMode && (
                <p className="text-xs text-gray-500 mt-1">Last used SKU: <span className="font-semibold">{lastSku}</span></p>
              )}
            </div>
          </div>

          {/* Unit */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              Unit<span className="text-red-500">*</span>
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </label>
            <div className="col-span-3">
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="" disabled>Select Unit</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Box (box)</option>
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              Quantity
            </label>
            <div className="col-span-3">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Returnable Item */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700"></label>
            <div className="col-span-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="returnableItem"
                  checked={formData.returnableItem}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  Returnable Item
                  <span className="text-gray-400 cursor-help">ⓘ</span>
                </span>
              </label>
            </div>
          </div>

          {/* HSN Code */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              HSN Code
            </label>
            <div className="col-span-3 flex items-center gap-2">
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter HSN code"
              />
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                🔍
              </button>
            </div>
          </div>

          {/* Tax Preference */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Tax Preference<span className="text-red-500">*</span>
            </label>
            <div className="col-span-3">
              <select
                name="taxPreference"
                value={formData.taxPreference}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="taxable">Taxable</option>
                <option value="non-taxable">Non-Taxable</option>
                <option value="exempt">Exempt</option>
              </select>
            </div>
          </div>

          {/* Manufacturer and Brand */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Manufacturer
            </label>
            <div className="col-span-3 grid grid-cols-2 gap-6">
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter manufacturer"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter brand"
                />
              </div>
            </div>
          </div>

          {/* Sales and Purchase Information - Side by Side */}
          <div className="col-span-4 mt-8 border-t pt-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Sales Information Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Sales Information</h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="sellable"
                      checked={formData.sellable}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Sellable</span>
                  </label>
                </div>

                {formData.sellable && (
                  <div className="space-y-4">
                    {/* Selling Price */}
                    <div>
                      <label className="text-sm font-medium text-red-500 block mb-2">
                        Selling Price<span>*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">INR</span>
                        <input
                          type="number"
                          name="sellingPrice"
                          value={formData.sellingPrice}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Account */}
                    <div>
                      <label className="text-sm font-medium text-red-500 block mb-2">
                        Account<span>*</span>
                      </label>
                      <select
                        name="salesAccount"
                        value={formData.salesAccount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Sales">Sales</option>
                        <option value="Other Income">Other Income</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Description
                      </label>
                      <textarea
                        name="salesDescription"
                        value={formData.salesDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description for sales transactions"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Information Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Purchase Information</h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="purchasable"
                      checked={formData.purchasable}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Purchasable</span>
                  </label>
                </div>

                {formData.purchasable && (
                  <div className="space-y-4">
                    {/* Cost Price */}
                    <div>
                      <label className="text-sm font-medium text-red-500 block mb-2">
                        Cost Price<span>*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">INR</span>
                        <input
                          type="number"
                          name="costPrice"
                          value={formData.costPrice}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Account */}
                    <div>
                      <label className="text-sm font-medium text-red-500 block mb-2">
                        Account<span>*</span>
                      </label>
                      <select
                        name="purchaseAccount"
                        value={formData.purchaseAccount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                        <option value="Purchases">Purchases</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Description
                      </label>
                      <textarea
                        name="purchaseDescription"
                        value={formData.purchaseDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description for purchase transactions"
                      />
                    </div>

                    {/* Preferred Vendor */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Preferred Vendor
                      </label>
                      <select
                        name="preferredVendor"
                        value={formData.preferredVendor}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a vendor</option>
                        {vendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.supplier_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Tracking Section */}
          <div className="col-span-4 mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Tracking</h2>

            <div className="space-y-4">
              {/* Track Inventory */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={formData.trackInventory}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded mt-1"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 cursor-pointer">
                    Track Inventory for this item
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    You cannot enable/disable inventory tracking once you've created transactions for this item
                  </p>
                </div>
              </div>

              {/* Track Bin Location */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="trackBinLocation"
                  checked={formData.trackBinLocation}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded mt-1"
                  disabled={!formData.trackInventory}
                />
                <div>
                  <label className={`text-sm font-medium cursor-pointer ${formData.trackInventory ? 'text-gray-700' : 'text-gray-400'}`}>
                    Track Bin location for this item
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Enable this option if you want to track the bin locations for this item while creating transactions
                  </p>
                </div>
              </div>

              {/* Advanced Inventory Tracking */}
              {formData.trackInventory && (
                <>
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Advanced Inventory Tracking</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="advancedTracking"
                          value="none"
                          checked={formData.advancedTracking === 'none'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">None</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="advancedTracking"
                          value="serial"
                          checked={formData.advancedTracking === 'serial'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Track Serial Number</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="advancedTracking"
                          value="batches"
                          checked={formData.advancedTracking === 'batches'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Track Batches</span>
                      </label>
                    </div>
                  </div>

                  {/* Inventory Account and Valuation Method */}
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="text-sm font-medium text-red-500 block mb-2">
                        Inventory Account<span>*</span>
                      </label>
                      <select
                        name="inventoryAccount"
                        value={formData.inventoryAccount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select an account</option>
                        <option value="Inventory Asset">Inventory Asset</option>
                        <option value="Stock">Stock</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-red-500 block mb-2">
                        Inventory Valuation Method<span>*</span>
                      </label>
                      <select
                        name="valuationMethod"
                        value={formData.valuationMethod}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select the valuation method</option>
                        <option value="FIFO">FIFO (First In First Out)</option>
                        <option value="LIFO">LIFO (Last In First Out)</option>
                        <option value="Weighted Average">Weighted Average</option>
                      </select>
                    </div>
                  </div>

                  {/* Reorder Point */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      name="reorderPoint"
                      value={formData.reorderPoint}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Item
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewItemForm;
