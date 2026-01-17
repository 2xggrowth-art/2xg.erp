import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';
import { customersService, Customer } from '../services/customers.service';

const CustomerManagementPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersService.getAllCustomers({ isActive: true });

      console.log('Customers API Response:', response);

      // Axios response structure: response.data = { success: boolean, data: Customer[] }
      if (response.data.success && response.data.data) {
        setCustomers(response.data.data);
      } else {
        setError('Failed to load customers');
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">All Customers</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your customer relationships and payments
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/sales/customers/new')}
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
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading customers...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium mb-2">Error loading customers</p>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchCustomers}
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
                      <input type="checkbox" className="rounded" />
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAYABLES (INR)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UNUSED CREDITS (INR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Users className="w-12 h-12 mb-3" />
                          <p className="text-lg font-medium">No customers found</p>
                          <p className="text-sm mt-1">
                            {searchQuery ? 'Try a different search term' : 'Click "+ New" to add your first customer'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/customer-management/${customer.id}`)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-blue-600 hover:underline">
                            {customer.customer_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{customer.company_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{customer.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{customer.work_phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-gray-900">
                            Rs {customer.current_balance?.toFixed(2) || '0.00'}
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
    </div>
  );
};

export default CustomerManagementPage;
