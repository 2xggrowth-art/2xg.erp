import { useState } from 'react';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { itemsService } from '../../services/items.service';

const NewItemForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'goods',
    name: '',
    sku: '',
    unit: '',
    category: '',
    returnableItem: false,
    hsnCode: '',
    taxPreference: 'taxable',
    dimensionLength: '',
    dimensionWidth: '',
    dimensionHeight: '',
    dimensionUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    manufacturer: '',
    brand: '',
    upc: '',
    mpn: '',
    ean: '',
    isbn: '',
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
    reorderPoint: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Build dimensions string if provided
      let dimensions = '';
      if (formData.dimensionLength && formData.dimensionWidth && formData.dimensionHeight) {
        dimensions = `${formData.dimensionLength}×${formData.dimensionWidth}×${formData.dimensionHeight} ${formData.dimensionUnit}`;
      }

      // Prepare item data for API
      const itemData = {
        name: formData.name,
        sku: formData.sku,
        unit: formData.unit,
        // category: formData.category || undefined, // TODO: Implement category dropdown with UUID selection
        hsn_code: formData.hsnCode || undefined,
        manufacturer: formData.manufacturer || undefined,
        brand: formData.brand || undefined,
        upc: formData.upc || undefined,
        mpn: formData.mpn || undefined,
        ean: formData.ean || undefined,
        isbn: formData.isbn || undefined,
        is_returnable: formData.returnableItem,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: dimensions || undefined,
        tax_rate: formData.taxPreference === 'taxable' ? 18 : 0, // Default 18% GST for taxable items

        // Sales Information
        is_sellable: formData.sellable,
        selling_price: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        sales_account: formData.salesAccount || undefined,
        sales_description: formData.salesDescription || undefined,

        // Purchase Information
        is_purchasable: formData.purchasable,
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
      };

      // Call API to create item
      const response = await itemsService.createItem(itemData);

      if (response.success) {
        // Navigate to the item detail page
        navigate(`/items/${response.data.id}`);
      } else {
        alert('Failed to save item. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating item:', error);
      alert(error.message || 'Failed to save item. Please try again.');
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
                <h1 className="text-2xl font-semibold text-gray-800">New Item</h1>
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
                disabled={loading}
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
                className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter SKU"
                required
              />
            </div>
          </div>

          {/* Unit */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              Unit<span className="text-red-500">*</span>
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </label>
            <div className="col-span-3">
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., pcs, kg, liters"
                required
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

          {/* Dimensions and Weight */}
          <div className="grid grid-cols-4 gap-4 items-start">
            <label className="text-sm font-medium text-gray-700 pt-2">
              Dimensions
              <div className="text-xs text-gray-500 font-normal mt-1">
                (Length X Width X Height)
              </div>
            </label>
            <div className="col-span-3 grid grid-cols-2 gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="dimensionLength"
                  value={formData.dimensionLength}
                  onChange={handleInputChange}
                  placeholder="×"
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <span className="text-gray-400">×</span>
                <input
                  type="text"
                  name="dimensionWidth"
                  value={formData.dimensionWidth}
                  onChange={handleInputChange}
                  placeholder="×"
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <span className="text-gray-400">×</span>
                <input
                  type="text"
                  name="dimensionHeight"
                  value={formData.dimensionHeight}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <select
                  name="dimensionUnit"
                  value={formData.dimensionUnit}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                  <option value="in">in</option>
                  <option value="ft">ft</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Weight</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder=""
                  />
                  <select
                    name="weightUnit"
                    value={formData.weightUnit}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
              </div>
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

          {/* UPC and MPN */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              UPC
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </label>
            <div className="col-span-3 grid grid-cols-2 gap-6">
              <input
                type="text"
                name="upc"
                value={formData.upc}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=""
              />
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  MPN
                  <span className="text-gray-400 cursor-help">ⓘ</span>
                </label>
                <input
                  type="text"
                  name="mpn"
                  value={formData.mpn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* EAN and ISBN */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              EAN
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </label>
            <div className="col-span-3 grid grid-cols-2 gap-6">
              <input
                type="text"
                name="ean"
                value={formData.ean}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=""
              />
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  ISBN
                  <span className="text-gray-400 cursor-help">ⓘ</span>
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=""
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
