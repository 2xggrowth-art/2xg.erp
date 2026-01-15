import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  Grid3x3,
  Settings,
  ChevronDown,
  ShoppingBag,
  FileText,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import ProcessFlow from '../components/common/ProcessFlow';
import { billsService, Bill } from '../services/bills.service';

const BillsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bills on component mount
  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsService.getAllBills();
      setBills(response.data);
    } catch (err: any) {
      console.error('Error fetching bills:', err);
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Bill lifecycle steps for the diagram
  const billLifecycleSteps = [
    {
      icon: ShoppingBag,
      title: 'Purchase Items',
      description: 'Create purchase order',
      status: 'default' as const,
    },
    {
      icon: FileText,
      title: 'Record Bill',
      description: 'Convert to bill',
      status: 'default' as const,
      arrowLabel: 'CONVERT TO OPEN',
    },
    {
      icon: DollarSign,
      title: 'Record Payment',
      description: 'Pay vendor',
      status: 'default' as const,
    },
    {
      icon: CheckCircle,
      title: 'Record Partial Payment',
      description: 'Partial payment tracking',
      status: 'default' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                All Bills
                <ChevronDown className="ml-2 h-5 w-5 text-gray-500" />
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in Bills ( / )"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* New Button */}
              <button
                onClick={() => navigate('/purchases/bills/new')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>New</span>
              </button>

              {/* Action Icons */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Grid3x3 className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Calendar className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-gray-500">Loading bills...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : bills.length === 0 ? (
          /* Empty State */
          <div className="max-w-4xl mx-auto py-16">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Owe money? It's good to pay bills on time!
              </h2>
              <p className="text-gray-600 text-base mb-8 max-w-2xl mx-auto">
                If you've purchased something for your business, and you don't have to repay it immediately,
                then you can record it as a bill.
              </p>
              <button
                onClick={() => navigate('/purchases/bills/new')}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                CREATE A BILL
              </button>
              <div className="mb-16">
                <button
                  onClick={() => {/* Handle import */}}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Import Bills
                </button>
              </div>
              <div className="mt-16">
                <h3 className="text-xl font-semibold text-gray-900 mb-8">
                  Life cycle of a Bill
                </h3>
                <ProcessFlow title="" steps={billLifecycleSteps} />
                <div className="mt-12 text-left max-w-xl mx-auto">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">
                    In the Bills module, you can:
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Create bills and record payments</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Apply credits to bills</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Make online payments</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Allocate landed costs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Bills Table */
          <div className="bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Due
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr
                      key={bill.id}
                      onClick={() => navigate(`/purchases/bills/${bill.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {bill.reference_number || bill.bill_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.vendor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(bill.status)}`}>
                          {bill.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.due_date ? formatDate(bill.due_date) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(bill.balance_due || bill.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsPage;
