import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';
import { vendorsService, Vendor } from '../services/vendors.service';
import BulkActionBar, { createBulkDeleteAction, createBulkExportAction } from '../components/common/BulkActionBar';

const VendorManagementPage = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorsService.getAllVendors({ isActive: true });

      console.log('Vendors API Response:', response);

      // Axios response structure: response.data = { success: boolean, data: Vendor[] }
      if (response.data.success && response.data.data) {
        setVendors(response.data.data);
      } else {
        setError('Failed to load vendors');
      }
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Selection handlers
  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map(vendor => vendor.id!));
    }
  };

  const clearSelection = () => {
    setSelectedVendors([]);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedVendors.length} vendor(s)?`)) {
      try {
        await Promise.all(selectedVendors.map(id => vendorsService.deleteVendor(id)));
        setSelectedVendors([]);
        fetchVendors();
      } catch (error) {
        console.error('Error deleting vendors:', error);
        alert('Failed to delete some vendors. Please try again.');
      }
    }
  };

  const handleBulkExport = () => {
    const selectedData = vendors.filter(vendor => selectedVendors.includes(vendor.id!));
    const csv = [
      ['Name', 'Company Name', 'Email', 'Work Phone', 'GST Treatment', 'Payables (INR)'].join(','),
      ...selectedData.map(vendor => [
        vendor.supplier_name,
        vendor.company_name || '',
        vendor.email || '',
        vendor.work_phone || '',
        vendor.gst_treatment || '',
        vendor.current_balance || '0'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Bulk actions configuration
  const bulkActions = [
    createBulkDeleteAction(handleBulkDelete),
    createBulkExportAction(handleBulkExport)
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">All Vendors</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your vendor relationships and payments
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/vendor-management/new')}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading vendors...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium mb-2">Error loading vendors</p>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchVendors}
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
                        checked={selectedVendors.length === filteredVendors.length && filteredVendors.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      COMPANY NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      EMAIL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WORK PHONE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST TREATMENT
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAYABLES (INR)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UNUSED CREDITS (INR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Users className="w-12 h-12 mb-3" />
                          <p className="text-lg font-medium">No vendors found</p>
                          <p className="text-sm mt-1">
                            {searchQuery ? 'Try a different search term' : 'Click "+ New" to add your first vendor'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <tr
                        key={vendor.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/vendor-management/${vendor.id}`)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedVendors.includes(vendor.id!)}
                            onChange={() => handleSelectVendor(vendor.id!)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-blue-600 hover:underline">
                            {vendor.supplier_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{vendor.company_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{vendor.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{vendor.work_phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{vendor.gst_treatment || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-gray-900">
                            Rs {vendor.current_balance?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-gray-900">Rs 0.00</div>
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
      {selectedVendors.length > 0 && (
        <BulkActionBar
          selectedCount={selectedVendors.length}
          totalCount={filteredVendors.length}
          onClearSelection={clearSelection}
          onSelectAll={handleSelectAll}
          actions={bulkActions}
          entityName="vendor"
        />
      )}
    </div>
  );
};

export default VendorManagementPage;
