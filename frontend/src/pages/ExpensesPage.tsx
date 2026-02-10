import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, DollarSign, TrendingUp, CheckCircle, Clock, X, FileText, Calendar, User, Eye, Edit, Trash2, Upload, Download } from 'lucide-react';
import { expensesService, Expense } from '../services/expenses.service';

interface ExpenseSummary {
  totalExpenses: number;
  expenseCount: number;
  pendingCount: number;
  approvedCount: number;
  billableAmount: number;
  currency: string;
}

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResponse, expensesResponse] = await Promise.all([
        expensesService.getExpensesSummary(),
        expensesService.getAllExpenses()
      ]);

      // Extract data from API response
      const summaryData = summaryResponse.data || summaryResponse;
      const expensesData = expensesResponse.data || expensesResponse;

      console.log('Summary Response:', summaryResponse);
      console.log('Expenses Response:', expensesResponse);

      setSummary(summaryData);
      setExpenses(expensesData || []);
    } catch (err: any) {
      console.error('Error fetching expense data:', err);
      setError(err.message || 'Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    if (selectedStatus === 'All') {
      setFilteredExpenses(expenses);
    } else {
      const filtered = expenses.filter(
        (expense) => expense.approval_status === selectedStatus
      );
      setFilteredExpenses(filtered);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleView = (expenseId: string) => {
    navigate(`/expenses/${expenseId}`);
  };

  const handleEdit = (expenseId: string) => {
    // Navigate to edit page or open edit modal
    console.log('Edit expense:', expenseId);
    // navigate(`/expenses/${expenseId}/edit`);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesService.deleteExpense(expenseId);
        fetchData();
      } catch (error: any) {
        console.error('Error deleting expense:', error);
        alert(error.response?.data?.error || 'Failed to delete expense. Only pending expenses can be deleted.');
      }
    }
  };

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(e => e.id!));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expense(s)? Only pending expenses will be deleted.`)) {
      try {
        const results = await Promise.allSettled(
          selectedExpenses.map(id => expensesService.deleteExpense(id))
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
          alert(`${results.length - failed} deleted successfully. ${failed} failed (only pending expenses can be deleted).`);
        }
        setSelectedExpenses([]);
        fetchData();
      } catch (error) {
        console.error('Error bulk deleting expenses:', error);
      }
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImporting(true);
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          alert('CSV file must have a header row and at least one data row.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expensesData = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, any> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });

          expensesData.push({
            expense_date: row['date'] || row['expense_date'] || new Date().toISOString().split('T')[0],
            category_name: row['category'] || row['category_name'] || '',
            expense_item: row['item'] || row['expense_item'] || '',
            description: row['description'] || '',
            amount: parseFloat(row['amount']) || 0,
            total_amount: parseFloat(row['total_amount'] || row['amount']) || 0,
            payment_mode: row['payment_mode'] || row['payment_method'] || 'Cash',
            paid_by_name: row['paid_by'] || row['paid_by_name'] || 'Admin User',
            paid_by_id: row['paid_by_id'] || '',
            remarks: row['remarks'] || row['notes'] || '',
          });
        }

        await expensesService.importExpenses(expensesData as any);
        alert(`Successfully imported ${expensesData.length} expense(s).`);
        fetchData();
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Failed to import expenses. Please check the CSV format.');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const dataToExport = selectedExpenses.length > 0
      ? filteredExpenses.filter(e => selectedExpenses.includes(e.id!))
      : filteredExpenses;

    const csv = [
      ['Date', 'Expense#', 'Category', 'Item', 'Description', 'Amount', 'Payment Mode', 'Paid By', 'Status'].join(','),
      ...dataToExport.map(e => [
        e.expense_date,
        e.expense_number || '',
        (e as any).expense_categories?.category_name || e.category_name || '',
        e.expense_item,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.amount,
        e.payment_mode,
        e.paid_by_name,
        e.approval_status || 'Pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleStatusChange = async (expenseId: string, newStatus: string) => {
    try {
      // await expensesService.updateExpenseStatus(expenseId, newStatus);
      console.log('Update expense status:', expenseId, 'to', newStatus);

      // Update local state to reflect the change immediately
      setExpenses(prevExpenses =>
        prevExpenses.map(expense =>
          expense.id === expenseId
            ? { ...expense, approval_status: newStatus as 'Pending' | 'Approved' | 'Rejected' }
            : expense
        )
      );

      // Optionally refresh data from server
      // fetchData();
    } catch (error) {
      console.error('Error updating expense status:', error);
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
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Upload size={18} />
            <span>{importing ? 'Importing...' : 'Import'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/expenses/new')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Expense</span>
          </button>
        </div>
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

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 mr-2">Filter by Status:</span>
            <button
              onClick={() => setSelectedStatus('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === 'All'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              All ({expenses.length})
            </button>
            <button
              onClick={() => setSelectedStatus('Pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === 'Pending'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              Pending ({expenses.filter(e => e.approval_status === 'Pending').length})
            </button>
            <button
              onClick={() => setSelectedStatus('Approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === 'Approved'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              Approved ({expenses.filter(e => e.approval_status === 'Approved').length})
            </button>
            <button
              onClick={() => setSelectedStatus('Rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === 'Rejected'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              Rejected ({expenses.filter(e => e.approval_status === 'Rejected').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedExpenses.includes(expense.id!)}
                        onChange={() => handleSelectExpense(expense.id!)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handleView(expense.id!)}
                      >
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {expense.expense_number || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(expense.expense_date)}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {(expense as any).expense_categories?.category_name || expense.category_name || 'N/A'}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {expense.expense_item}
                      </div>
                      {expense.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {expense.description}
                        </div>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{expense.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {expense.paid_by_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {expense.approval_status === 'Pending' ? (
                        <select
                          value={expense.approval_status || 'Pending'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(expense.id!, e.target.value)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100 focus:ring-orange-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg border-2 ${expense.approval_status === 'Approved'
                              ? 'bg-green-50 text-green-800 border-green-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                            }`}
                        >
                          {expense.approval_status}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(expense.id!);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(expense.id!);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors flex items-center gap-1"
                          title="Edit Expense"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(expense.id!);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1"
                          title="Delete Expense"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        {selectedStatus === 'All'
                          ? 'No expenses found'
                          : `No ${selectedStatus.toLowerCase()} expenses found`}
                      </p>
                      <p className="text-sm text-gray-400">
                        {selectedStatus === 'All'
                          ? 'Get started by adding your first expense'
                          : 'Try selecting a different status filter'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedExpenses.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4 z-50">
          <span className="text-sm font-medium">
            {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            onClick={() => setSelectedExpenses([])}
            className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
