import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Search, Grid, List, ArrowUpDown } from 'lucide-react';
// Assuming we use invoicesService for now, or we can use a placeholder
import { invoicesService } from '../services/invoices.service';

// Define interface for POS Transaction (basically an Invoice)
interface PosTransaction {
  id: string;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  salesperson_name?: string;
  notes?: string;
}

type SortField = 'invoice_date' | 'invoice_number' | 'customer_name' | 'total_amount';
type SortOrder = 'asc' | 'desc';

const PosPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PosTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('invoice_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetching all invoices and filter only POS transactions
      const response = await invoicesService.getAllInvoices({});

      if (response.success && response.data) {
          // Handle the response structure: {success: true, data: {invoices: [...], total: 5}}
          const invoices = response.data.invoices || response.data.data || [];

          // Filter only POS transactions (where subject = 'POS')
          const posInvoices = invoices.filter((inv: any) => inv.subject === 'POS');

          // Map to PosTransaction interface
          const mapped: PosTransaction[] = posInvoices.map((inv: any) => ({
              id: inv.id,
              invoice_number: inv.invoice_number,
              customer_name: inv.customer_name,
              invoice_date: inv.invoice_date,
              total_amount: inv.total_amount,
              status: inv.status,
              salesperson_name: inv.salesperson_name,
              notes: inv.customer_notes || inv.notes || ''
          }));
          setTransactions(mapped);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err: any) {
      console.error('Error fetching POS transactions:', err);
      setError(err.message || 'Failed to load transactions');
      setTransactions([]); // Set empty for now
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'draft';
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
    };

    const style = statusMap[statusLower] || statusMap.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPaymentMode = (notes: string | undefined) => {
    if (!notes) return '-';
    const match = notes.match(/Payment Mode: ([^\n]+)/);
    return match ? match[1] : '-';
  };

  const filteredTransactions = transactions.filter(t =>
    t.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.salesperson_name && t.salesperson_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'invoice_date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (sortField === 'total_amount') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800">POS Transactions</h1>
            </div>
            <button
              onClick={() => navigate('/sales/pos/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New POS
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="px-6 pb-4 flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions..."
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

      {/* Transactions Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading transactions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium mb-2">Error loading transactions</p>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                 <button
                  onClick={fetchTransactions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('invoice_date')}
                      >
                        <div className="flex items-center gap-1">
                          DATE
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('invoice_number')}
                      >
                        <div className="flex items-center gap-1">
                          INVOICE #
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('customer_name')}
                      >
                        <div className="flex items-center gap-1">
                          CUSTOMER
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SALESPERSON
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PAYMENT MODE
                      </th>
                      <th
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('total_amount')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          AMOUNT
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <ShoppingCart className="w-12 h-12 mb-3" />
                            <p className="text-lg font-medium">No transactions found</p>
                            <p className="text-sm mt-1">
                              {searchQuery ? 'Try a different search term' : 'Click "New POS" to start a sale'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedTransactions.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/sales/invoices`)}
                        >
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDate(t.invoice_date)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">
                              {t.invoice_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {t.customer_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                              {t.salesperson_name || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {getPaymentMode(t.notes)}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                              {formatCurrency(t.total_amount)}
                          </td>
                           <td className="px-6 py-4 text-center">
                             {getStatusBadge(t.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              {transactions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Transactions</div>
                    <div className="text-2xl font-bold text-gray-800">{transactions.length}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Sales</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {formatCurrency(transactions.reduce((sum, t) => sum + t.total_amount, 0))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Paid Transactions</div>
                    <div className="text-2xl font-bold text-green-600">
                      {transactions.filter(t => t.status?.toLowerCase() === 'paid').length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Today's Sales</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        transactions
                          .filter(t => {
                            const today = new Date().toISOString().split('T')[0];
                            return t.invoice_date === today;
                          })
                          .reduce((sum, t) => sum + t.total_amount, 0)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosPage;
