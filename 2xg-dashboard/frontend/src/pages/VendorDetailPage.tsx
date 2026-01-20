import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  User,
  ShieldCheck
} from 'lucide-react';
import { vendorsService, Vendor } from '../services/vendors.service';

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'documents'>('overview');

  useEffect(() => {
    if (id) {
      fetchVendorDetails();
    }
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorsService.getVendorById(id!);

      if (response.data.success && response.data.data) {
        setVendor(response.data.data);
      } else {
        setError('Failed to load vendor details');
      }
    } catch (err: any) {
      console.error('Error fetching vendor:', err);
      setError(err.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      await vendorsService.deleteVendor(id!);
      navigate('/purchase/vendors');
    } catch (err: any) {
      alert('Failed to delete vendor: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium mb-4">{error || 'Vendor not found'}</p>
          <button
            onClick={() => navigate('/purchase/vendors')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/purchase/vendors')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">{vendor.supplier_name}</h1>
                <p className="text-sm text-gray-500 mt-1">Vendor Details</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/purchase/vendors/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Documents
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vendor.company_name && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Company</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.company_name}</p>
                      </div>
                    </div>
                  )}
                  {vendor.contact_person && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Contact Person</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.contact_person}</p>
                      </div>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.email}</p>
                      </div>
                    </div>
                  )}
                  {vendor.work_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Work Phone</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.work_phone}</p>
                      </div>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Address
                </h2>
                <div className="text-sm text-gray-900 space-y-1">
                  {vendor.address && <p>{vendor.address}</p>}
                  <p>
                    {[vendor.city, vendor.state, vendor.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {vendor.country && <p>{vendor.country}</p>}
                </div>
              </div>

              {/* Tax & Compliance Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Tax & Compliance Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vendor.gst_treatment && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">GST Treatment</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.gst_treatment}</p>
                    </div>
                  )}
                  {vendor.gstin && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">GSTIN</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.gstin}</p>
                    </div>
                  )}
                  {vendor.pan && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">PAN</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.pan}</p>
                    </div>
                  )}
                  {vendor.source_of_supply && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Source of Supply</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.source_of_supply}</p>
                    </div>
                  )}
                  {vendor.payment_terms && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Payment Terms</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.payment_terms}</p>
                    </div>
                  )}
                  {vendor.currency && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Currency</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.currency}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      MSME Registered
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {vendor.is_msme_registered ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Financial Summary
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-600 uppercase font-medium">Current Payable</p>
                    <p className="text-2xl font-bold text-orange-700 mt-1">
                      Rs {(vendor.current_balance || 0).toFixed(2)}
                    </p>
                  </div>
                  {vendor.credit_limit && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-medium">Credit Limit</p>
                      <p className="text-xl font-semibold text-gray-700 mt-1">
                        Rs {vendor.credit_limit.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Status & Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        vendor.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {vendor.rating && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Rating</p>
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < vendor.rating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created At
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(vendor.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Last Updated
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(vendor.updated_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Transaction History</h3>
            <p className="text-sm text-gray-500">
              Transaction history feature coming soon
            </p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Documents</h3>
            <p className="text-sm text-gray-500">
              Document management feature coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetailPage;
