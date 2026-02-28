import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Save, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsService, ProductCategory, ProductSubcategory } from '../../services/items.service';
import { brandsService, Brand } from '../../services/brands.service';
import { manufacturersService, Manufacturer } from '../../services/manufacturers.service';
import { vendorsService, Vendor } from '../../services/vendors.service';
import { useAuth } from '../../contexts/AuthContext';
import CreatableSelect from '../shared/CreatableSelect';
import CategoryPicker from '../shared/CategoryPicker';
import BrandManufacturerUploadModal from './BrandManufacturerUploadModal';
import { itemSizesService, ItemSize } from '../../services/itemSizes.service';
import { itemColorsService, ItemColor } from '../../services/itemColors.service';

const NewItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useAuth();

  const userRole = user?.role?.toLowerCase() || '';
  const canViewPurchasePrice = userRole === 'admin' || userRole === 'super_admin' || userRole === 'super admin';
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<ProductSubcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [itemSizes, setItemSizes] = useState<ItemSize[]>([]);
  const [itemColors, setItemColors] = useState<ItemColor[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    size: '',
    color: '',
    variant: '',
    unit: 'pcs',
    category: '',
    subcategory: '',
    hsnCode: '',
    cgst_rate: 9,
    sgst_rate: 9,
    manufacturer: '',
    brand: '',
    sellingPrice: '',
    costPrice: '',
    reorderPoint: '',
    preferredVendor: '',
  });

  const [items, setItems] = useState<any[]>([]);
  const [duplicateSkuError, setDuplicateSkuError] = useState<boolean>(false);

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchAllSubcategories();
    fetchBrands();
    fetchManufacturers();
    fetchItemSizes();
    fetchItemColors();
    fetchVendors();
    if (isEditMode && id) {
      fetchItemDetails(id);
    } else {
      generateNewSku();
    }
  }, [id, isEditMode]);

  const generateNewSku = async () => {
    try {
      const response = await itemsService.generateSku();
      if (response.data.success && response.data.data) {
        setFormData(prev => ({ ...prev, sku: response.data.data.sku }));
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      setFormData(prev => ({ ...prev, sku: `SKU-${Date.now().toString().slice(-6)}` }));
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemsService.getAllItems();
      if (response.data.success && response.data.data) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await itemsService.getCategories();
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAllSubcategories = async () => {
    try {
      const response = await itemsService.getAllSubcategories();
      if (response.data.success && response.data.data) {
        setAllSubcategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandsService.getAllBrands();
      if (response.data.success) {
        setBrands(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const response = await manufacturersService.getAllManufacturers();
      if (response.data.success) {
        setManufacturers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const fetchItemSizes = async () => {
    try {
      const response = await itemSizesService.getAllItemSizes();
      if (response.data.success) {
        setItemSizes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching item sizes:', error);
    }
  };

  const fetchItemColors = async () => {
    try {
      const response = await itemColorsService.getAllItemColors();
      if (response.data.success) {
        setItemColors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching item colors:', error);
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

  const handleCreateSize = async (name: string) => {
    try {
      const response = await itemSizesService.createItemSize({ name });
      if (response.data.success) {
        setItemSizes(prev => [...prev, response.data.data]);
        setFormData(prev => ({ ...prev, size: name }));
      }
    } catch (error) {
      console.error('Error creating size:', error);
      alert('Failed to create size');
    }
  };

  const handleDeleteSize = async (id: string) => {
    try {
      await itemSizesService.deleteItemSize(id);
      const deleted = itemSizes.find(s => s.id === id);
      setItemSizes(prev => prev.filter(s => s.id !== id));
      if (deleted && deleted.name === formData.size) {
        setFormData(prev => ({ ...prev, size: '' }));
      }
    } catch (error) {
      console.error('Error deleting size:', error);
      alert('Failed to delete size');
    }
  };

  const handleCreateColor = async (name: string) => {
    try {
      const response = await itemColorsService.createItemColor({ name });
      if (response.data.success) {
        setItemColors(prev => [...prev, response.data.data]);
        setFormData(prev => ({ ...prev, color: name }));
      }
    } catch (error) {
      console.error('Error creating color:', error);
      alert('Failed to create color');
    }
  };

  const handleDeleteColor = async (id: string) => {
    try {
      await itemColorsService.deleteItemColor(id);
      const deleted = itemColors.find(c => c.id === id);
      setItemColors(prev => prev.filter(c => c.id !== id));
      if (deleted && deleted.name === formData.color) {
        setFormData(prev => ({ ...prev, color: '' }));
      }
    } catch (error) {
      console.error('Error deleting color:', error);
      alert('Failed to delete color');
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const response = await itemsService.createCategory(name);
      if (response.data.success) {
        setCategories([...categories, response.data.data]);
        setFormData(prev => ({ ...prev, category: name, subcategory: '' }));
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await itemsService.deleteCategory(id);
      if (response.data.success) {
        setCategories(categories.filter(c => c.id !== id));
        setAllSubcategories(allSubcategories.filter(s => s.category_id !== id));
        const deleted = categories.find(c => c.id === id);
        if (deleted && deleted.name === formData.category) {
          setFormData(prev => ({ ...prev, category: '', subcategory: '' }));
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const handleCreateSubcategory = async (categoryId: string, name: string) => {
    try {
      const response = await itemsService.createSubcategory(categoryId, name);
      if (response.data.success) {
        setAllSubcategories(prev => [...prev, response.data.data]);
      }
    } catch (error) {
      console.error('Error creating subcategory:', error);
      alert('Failed to create subcategory');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      const response = await itemsService.deleteSubcategory(id);
      if (response.data.success) {
        const deleted = allSubcategories.find(s => s.id === id);
        setAllSubcategories(allSubcategories.filter(s => s.id !== id));
        if (deleted && deleted.name === formData.subcategory) {
          setFormData(prev => ({ ...prev, subcategory: '' }));
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete subcategory');
    }
  };

  const handleCreateManufacturer = async (name: string) => {
    try {
      const response = await manufacturersService.createManufacturer({ name });
      if (response.data.success) {
        setManufacturers([...manufacturers, response.data.data]);
        setFormData(prev => ({ ...prev, manufacturer: name }));
      }
    } catch (error) {
      console.error('Error creating manufacturer:', error);
      alert('Failed to create manufacturer');
    }
  };

  const handleUploadComplete = async (data: { brands: any[], manufacturers: any[] }) => {
    try {
      let brandsCreated = 0;
      let manufacturersCreated = 0;
      const manufacturerMap = new Map<string, string>();

      if (data.manufacturers && data.manufacturers.length > 0) {
        const response = await manufacturersService.bulkCreateManufacturers(data.manufacturers);
        if (response.data.success && response.data.data) {
          manufacturersCreated = data.manufacturers.length;
          response.data.data.forEach((mfr: any) => {
            manufacturerMap.set(mfr.name.toLowerCase(), mfr.id);
          });
          fetchManufacturers();
        }
      }

      if (data.brands && data.brands.length > 0) {
        const brandsWithManufacturer = data.brands.map((brand: any) => {
          const brandData: any = { name: brand.name };
          if (brand.manufacturerName) {
            const manufacturerId = manufacturerMap.get(brand.manufacturerName.toLowerCase());
            if (manufacturerId) {
              brandData.manufacturer_id = manufacturerId;
            }
          }
          return brandData;
        });

        const response = await brandsService.bulkCreateBrands(brandsWithManufacturer);
        if (response.data.success) {
          fetchBrands();
          brandsCreated = data.brands.length;
        }
      }

      return { brands: brandsCreated, manufacturers: manufacturersCreated };
    } catch (error) {
      console.error('Bulk create failed', error);
      throw error;
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
          name: item.item_name,
          sku: item.sku,
          size: item.size || '',
          color: item.color || '',
          variant: item.variant || '',
          unit: item.unit_of_measurement || 'pcs',
          category: categories.find(c => c.id === item.category_id)?.name || '',
          subcategory: '',
          hsnCode: item.hsn_code || '',
          cgst_rate: item.tax_rate > 0 ? item.tax_rate / 2 : 9,
          sgst_rate: item.tax_rate > 0 ? item.tax_rate / 2 : 9,
          manufacturer: item.manufacturer || '',
          brand: item.brand || '',
          sellingPrice: item.unit_price ? item.unit_price.toString() : '',
          costPrice: item.cost_price ? item.cost_price.toString() : '',
          reorderPoint: item.reorder_point ? item.reorder_point.toString() : '',
          preferredVendor: item.preferred_vendor_id || '',
        });

        if (item.subcategory_id && allSubcategories.length > 0) {
          const sub = allSubcategories.find(s => s.id === item.subcategory_id);
          if (sub) {
            setFormData(prev => ({ ...prev, subcategory: sub.name }));
          }
        }
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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
      const itemData: any = {
        name: formData.name,
        item_type: 'goods',
        size: formData.size || undefined,
        color: formData.color || undefined,
        variant: formData.variant || undefined,
        sku: formData.sku,
        unit: formData.unit,
        category: categories.find(c => c.name === formData.category)?.id || undefined,
        subcategory: allSubcategories.find(s => s.name === formData.subcategory)?.id || undefined,
        hsn_code: formData.hsnCode || undefined,
        manufacturer: formData.manufacturer || undefined,
        brand: formData.brand || undefined,
        tax_rate: formData.cgst_rate + formData.sgst_rate,
        unit_price: formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0,
        selling_price: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        cost_price: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        reorder_point: formData.reorderPoint ? parseInt(formData.reorderPoint) : 10,
        track_inventory: true,
        advanced_tracking_type: 'none',
        preferred_vendor_id: formData.preferredVendor || undefined,
      };

      let response;
      if (isEditMode && id) {
        response = await itemsService.updateItem(id, itemData);
      } else {
        response = await itemsService.createItem(itemData);
      }

      if (response.data.success && response.data.data) {
        navigate('/items', { state: { refetch: true } });
      } else {
        const errorMsg = response.data.error || 'Failed to save item. Please try again.';
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
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">

          {/* Item Name */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Item Name<span className="text-red-500">*</span>
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
            <label className="text-sm font-medium text-gray-700">
              SKU<span className="text-red-500">*</span>
            </label>
            <div className="col-span-3">
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={isEditMode ? handleInputChange : undefined}
                readOnly={!isEditMode}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  duplicateSkuError ? 'border-red-500' : !isEditMode ? 'border-gray-300 bg-gray-50' : 'border-gray-300'
                }`}
                placeholder={isEditMode ? "Enter SKU" : "Auto-generating..."}
                required
              />
              {duplicateSkuError && (
                <p className="text-xs text-red-500 mt-1">SKU already exists. Please choose a unique SKU.</p>
              )}
              {!isEditMode && formData.sku && (
                <p className="text-xs text-green-600 mt-1">Auto-generated: <span className="font-semibold">{formData.sku}</span></p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <div className="col-span-3">
              <CategoryPicker
                categories={categories}
                allSubcategories={allSubcategories}
                categoryValue={formData.category}
                subcategoryValue={formData.subcategory}
                onCategoryChange={(val) => setFormData(prev => ({ ...prev, category: val, subcategory: '' }))}
                onSubcategoryChange={(val) => setFormData(prev => ({ ...prev, subcategory: val }))}
                onCreateCategory={handleCreateCategory}
                onDeleteCategory={handleDeleteCategory}
                onCreateSubcategory={handleCreateSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                placeholder="Search or add category"
              />
            </div>
          </div>

          {/* Size, Color & Variant */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Size</label>
            <div className="col-span-3 grid grid-cols-3 gap-4">
              <CreatableSelect
                options={itemSizes.map(s => ({ id: s.id, name: s.name }))}
                value={formData.size}
                onChange={(val) => setFormData(prev => ({ ...prev, size: val }))}
                onCreateOption={handleCreateSize}
                onDeleteOption={handleDeleteSize}
                placeholder="Select or add size"
                label="size"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Color</label>
                <CreatableSelect
                  options={itemColors.map(c => ({ id: c.id, name: c.name }))}
                  value={formData.color}
                  onChange={(val) => setFormData(prev => ({ ...prev, color: val }))}
                  onCreateOption={handleCreateColor}
                  onDeleteOption={handleDeleteColor}
                  placeholder="Select or add color"
                  label="color"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Variant</label>
                <select
                  name="variant"
                  value={formData.variant}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select variant</option>
                  <option value="MS">MS</option>
                  <option value="SS">SS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Brand & Manufacturer */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Brand / Manufacturer
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              >
                <Upload className="w-3 h-3 inline" /> Import
              </button>
            </label>
            <div className="col-span-3 grid grid-cols-2 gap-4">
              <CreatableSelect
                options={brands.map(b => ({ id: b.id, name: b.name }))}
                value={formData.brand}
                onChange={(val) => setFormData(prev => ({ ...prev, brand: val }))}
                onCreateOption={async (name) => {
                  try {
                    const response = await brandsService.createBrand({ name });
                    if (response.data.success) {
                      setBrands(prev => [...prev, response.data.data]);
                      setFormData(prev => ({ ...prev, brand: name }));
                    }
                  } catch (error) {
                    console.error('Error creating brand:', error);
                    alert('Failed to create brand');
                  }
                }}
                placeholder="Select or add brand"
                label="brand"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Manufacturer</label>
                <CreatableSelect
                  options={manufacturers.map(m => ({ id: m.id, name: m.name }))}
                  value={formData.manufacturer}
                  onChange={(val) => setFormData(prev => ({ ...prev, manufacturer: val }))}
                  onCreateOption={handleCreateManufacturer}
                  placeholder="Select or add manufacturer"
                  label="manufacturer"
                />
              </div>
            </div>
          </div>

          {/* Unit */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Unit<span className="text-red-500">*</span>
            </label>
            <div className="col-span-3">
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Box (box)</option>
              </select>
            </div>
          </div>

          {/* Selling Price & Cost Price */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Selling Price<span className="text-red-500">*</span>
            </label>
            <div className={`${canViewPurchasePrice ? '' : 'col-span-3'}`}>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">INR</span>
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
            {canViewPurchasePrice && (
              <>
                <label className="text-sm font-medium text-gray-700 text-right">Cost Price</label>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">INR</span>
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
              </>
            )}
          </div>

          {/* HSN Code */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">HSN / SAC Code</label>
            <div className="col-span-3">
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter HSN code"
              />
            </div>
          </div>

          {/* GST Rates */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">GST Rate</label>
            <div className="col-span-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">CGST</span>
                <select
                  value={formData.cgst_rate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, cgst_rate: val, sgst_rate: val }));
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm w-24"
                >
                  <option value={0}>0%</option>
                  <option value={2.5}>2.5%</option>
                  <option value={6}>6%</option>
                  <option value={9}>9%</option>
                  <option value={14}>14%</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">SGST</span>
                <select
                  value={formData.sgst_rate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, sgst_rate: val, cgst_rate: val }));
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm w-24"
                >
                  <option value={0}>0%</option>
                  <option value={2.5}>2.5%</option>
                  <option value={6}>6%</option>
                  <option value={9}>9%</option>
                  <option value={14}>14%</option>
                </select>
              </div>
              <span className="text-sm text-gray-500">
                Total: {formData.cgst_rate + formData.sgst_rate}%
              </span>
            </div>
          </div>

          {/* Reorder Point */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Reorder Point</label>
            <div className="col-span-3">
              <input
                type="number"
                name="reorderPoint"
                value={formData.reorderPoint}
                onChange={handleInputChange}
                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          {/* Preferred Vendor */}
          {(canViewPurchasePrice) && (
            <div className="grid grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700">Preferred Vendor</label>
              <div className="col-span-3">
                <select
                  name="preferredVendor"
                  value={formData.preferredVendor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Brand & Manufacturer Upload Modal */}
      {showUploadModal && (
        <BrandManufacturerUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadComplete}
        />
      )}
    </div>
  );
};

export default NewItemForm;
