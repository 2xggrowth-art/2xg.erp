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
  Globe
} from 'lucide-react';
import { customersService, Customer } from '../services/customers.service';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'documents'>('overview');

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersService.getCustomerById(id!);

      if (response.data.success && response.data.data) {
        setCustomer(response.data.data);
      } else {
        setError('Failed to load customer details');
      }
    } catch (err: any) {
      console.error('Error fetching customer:', err);
      setError(err.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await customersService.deleteCustomer(id!);
      navigate('/sales/customers');
    } catch (err: any) {
      alert('Failed to delete customer: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium mb-4">{error || 'Customer not found'}</p>
          <button
            onClick={() => navigate('/sales/customers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Customers
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
                onClick={() => navigate('/sales/customers')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">{customer.customer_name}</h1>
                <p className="text-sm text-gray-500 mt-1">Customer Details</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/sales/customers/${id}/edit`)}
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
                  {customer.company_name && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Company</p>
                        <p className="text-sm text-gray-900 mt-1">{customer.company_name}</p>
                      </div>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                        <p className="text-sm text-gray-900 mt-1">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  {customer.work_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Work Phone</p>
                        <p className="text-sm text-gray-900 mt-1">{customer.work_phone}</p>
                      </div>
                    </div>
                  )}
                  {customer.mobile && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Mobile</p>
                        <p className="text-sm text-gray-900 mt-1">{customer.mobile}</p>
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
                  {customer.address && <p>{customer.address}</p>}
                  <p>
                    {[customer.city, customer.state, customer.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {customer.country && <p>{customer.country}</p>}
                </div>
              </div>

              {/* Tax & Payment Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Tax & Payment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customer.gstin && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">GSTIN</p>
                      <p className="text-sm text-gray-900 mt-1">{customer.gstin}</p>
                    </div>
                  )}
                  {customer.pan && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">PAN</p>
                      <p className="text-sm text-gray-900 mt-1">{customer.pan}</p>
                    </div>
                  )}
                  {customer.payment_terms && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Payment Terms</p>
                      <p className="text-sm text-gray-900 mt-1">{customer.payment_terms}</p>
                    </div>
                  )}
                  {customer.currency && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Currency</p>
                      <p className="text-sm text-gray-900 mt-1">{customer.currency}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {customer.notes && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
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
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 uppercase font-medium">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      Rs {(customer.current_balance || 0).toFixed(2)}
                    </p>
                  </div>
                  {customer.credit_limit && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-medium">Credit Limit</p>
                      <p className="text-xl font-semibold text-gray-700 mt-1">
                        Rs {customer.credit_limit.toFixed(2)}
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
                        customer.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {customer.rating && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Rating</p>
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < customer.rating! ? 'text-yellow-400' : 'text-gray-300'
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
                      {new Date(customer.created_at).toLocaleDateString('en-IN', {
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
                      {new Date(customer.updated_at).toLocaleDateString('en-IN', {
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

export default CustomerDetailPage;
