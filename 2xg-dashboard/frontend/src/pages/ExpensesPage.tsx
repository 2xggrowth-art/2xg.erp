import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, DollarSign, TrendingUp, CheckCircle, Clock, X } from 'lucide-react';
import { expensesService } from '../services/expenses.service';

interface ExpenseSummary {
  totalExpenses: number;
  expenseCount: number;
  pendingCount: number;
  approvedCount: number;
  billableAmount: number;
  currency: string;
}

interface CategoryData {
  name: string;
  total: number;
  count: number;
}

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResponse, categoryResponse] = await Promise.all([
        expensesService.getExpensesSummary(),
        expensesService.getExpensesByCategory()
      ]);

      // Extract data from API response
      // Service already returns response.data, so we just need to extract the inner data
      const summaryData = summaryResponse.data || summaryResponse;
      const categoryDataArray = categoryResponse.data || categoryResponse;

      console.log('Summary Response:', summaryResponse);
      console.log('Summary Data:', summaryData);
      console.log('Category Response:', categoryResponse);
      console.log('Category Data:', categoryDataArray);

      setSummary(summaryData);
      setCategoryData(categoryDataArray || []);
    } catch (err: any) {
      console.error('Error fetching expense data:', err);
      setError(err.message || 'Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <X className="text-red-600" size={24} />
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Expenses</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all business expenses</p>
        </div>
        <button
          onClick={() => navigate('/expenses/new')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(summary?.totalExpenses || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {summary?.pendingCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {summary?.approvedCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Count</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.expenseCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
        {categoryData.length > 0 ? (
          <div className="space-y-3">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.count} expense(s)</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{category.total.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No expense data available</p>
        )}
      </div>

      {/* Coming Soon Features */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'Add & Edit Expenses',
            'Receipt Upload',
            'Approval Workflows',
            'Expense Reports',
            'Export to Excel/PDF',
            'Mobile App Support'
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-700">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
