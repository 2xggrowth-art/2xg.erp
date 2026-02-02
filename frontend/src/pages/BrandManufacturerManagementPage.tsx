import { useState, useEffect } from 'react';
import { Tag, Factory, Search, Plus, X } from 'lucide-react';
import { brandsService, Brand } from '../services/brands.service';
import { manufacturersService, Manufacturer } from '../services/manufacturers.service';

const BrandManufacturerManagementPage = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'brands' | 'manufacturers'>('brands');

  // Add modals
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddManufacturer, setShowAddManufacturer] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', description: '', manufacturer_id: '' });
  const [newManufacturer, setNewManufacturer] = useState({ name: '', description: '' });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [brandsRes, manufacturersRes] = await Promise.all([
        brandsService.getAllBrands(),
        manufacturersService.getAllManufacturers(),
      ]);
      if (brandsRes.data?.success) setBrands(brandsRes.data.data);
      if (manufacturersRes.data?.success) setManufacturers(manufacturersRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.name.trim()) {
      setAddError('Brand name is required');
      return;
    }
    try {
      setAddError('');
      const response = await brandsService.createBrand({
        name: newBrand.name.trim(),
        description: newBrand.description.trim() || undefined,
        manufacturer_id: newBrand.manufacturer_id || undefined,
      });
      if (response.data?.success) {
        setShowAddBrand(false);
        setNewBrand({ name: '', description: '', manufacturer_id: '' });
        fetchData();
      } else {
        setAddError('Failed to create brand');
      }
    } catch (error: any) {
      setAddError(error.message || 'Failed to create brand');
    }
  };

  const handleAddManufacturer = async () => {
    if (!newManufacturer.name.trim()) {
      setAddError('Manufacturer name is required');
      return;
    }
    try {
      setAddError('');
      const response = await manufacturersService.createManufacturer({
        name: newManufacturer.name.trim(),
        description: newManufacturer.description.trim() || undefined,
      });
      if (response.data?.success) {
        setShowAddManufacturer(false);
        setNewManufacturer({ name: '', description: '' });
        fetchData();
      } else {
        setAddError('Failed to create manufacturer');
      }
    } catch (error: any) {
      setAddError(error.message || 'Failed to create manufacturer');
    }
  };

  const filteredBrands = brands.filter(
    (b) => b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredManufacturers = manufacturers.filter(
    (m) => m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getManufacturerName = (id?: string) => {
    if (!id) return '-';
    return manufacturers.find((m) => m.id === id)?.name || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands & Manufacturers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {brands.length} brands, {manufacturers.length} manufacturers
          </p>
        </div>
        <button
          onClick={() => activeTab === 'brands' ? setShowAddBrand(true) : setShowAddManufacturer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'brands' ? 'Brand' : 'Manufacturer'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'brands' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Tag className="w-4 h-4" /> Brands ({brands.length})
        </button>
        <button
          onClick={() => setActiveTab('manufacturers')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'manufacturers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Factory className="w-4 h-4" /> Manufacturers ({manufacturers.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Brands Table */}
      {activeTab === 'brands' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBrands.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No brands found</td></tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{brand.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getManufacturerName(brand.manufacturer_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{brand.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manufacturers Table */}
      {activeTab === 'manufacturers' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredManufacturers.length === 0 ? (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">No manufacturers found</td></tr>
              ) : (
                filteredManufacturers.map((mfr) => (
                  <tr key={mfr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{mfr.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{mfr.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Brand Modal */}
      {showAddBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Brand</h3>
              <button onClick={() => { setShowAddBrand(false); setAddError(''); }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {addError && <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">{addError}</div>}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Brand name *"
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newBrand.manufacturer_id}
                onChange={(e) => setNewBrand({ ...newBrand, manufacturer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Manufacturer (optional)</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Description (optional)"
                value={newBrand.description}
                onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowAddBrand(false); setAddError(''); }} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddBrand} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Brand</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manufacturer Modal */}
      {showAddManufacturer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Manufacturer</h3>
              <button onClick={() => { setShowAddManufacturer(false); setAddError(''); }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {addError && <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">{addError}</div>}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Manufacturer name *"
                value={newManufacturer.name}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newManufacturer.description}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowAddManufacturer(false); setAddError(''); }} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddManufacturer} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Manufacturer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManufacturerManagementPage;
