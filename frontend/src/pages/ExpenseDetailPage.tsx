import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
  Building2,
  Tag,
  X
} from 'lucide-react';
import { expensesService, Expense } from '../services/expenses.service';

// Get API base URL (without /api suffix) for attachment URLs
const getAttachmentUrl = (path: string) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
  const baseUrl = apiUrl.replace(/\/api$/, '');
  return `${baseUrl}${path}`;
};

const ExpenseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchExpense();
    }
  }, [id]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await expensesService.getExpenseById(id!);
      const expenseData = response.data || response;
      setExpense(expenseData);
    } catch (err: any) {
      console.error('Error fetching expense:', err);
      setError(err.message || 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'Pending':
        return <Clock className="text-orange-600" size={20} />;
      case 'Rejected':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Clock className="text-gray-600" size={20} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <X className="text-red-600" size={24} />
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Expense</h3>
              <p className="text-red-600 text-sm mt-1">{error || 'Expense not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/expenses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Expenses</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Expense Details
            </h1>
            <p className="text-gray-600 mt-1">
              {expense.expense_number || 'No number assigned'}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(expense.approval_status)}`}>
            {getStatusIcon(expense.approval_status)}
            <span className="font-semibold">
              {expense.approval_status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <Tag size={16} />
                  Expense Item
                </label>
                <p className="text-gray-900 font-medium">{expense.expense_item}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <FileText size={16} />
                  Category
                </label>
                <p className="text-gray-900 font-medium">{(expense as any).expense_categories?.category_name || expense.category_name || 'N/A'}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <Calendar size={16} />
                  Expense Date
                </label>
                <p className="text-gray-900 font-medium">{formatDate(expense.expense_date)}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <DollarSign size={16} />
                  Amount
                </label>
                <p className="text-gray-900 text-xl font-bold">
                  ₹{expense.amount.toLocaleString()}
                </p>
              </div>

              {expense.branch && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <Building2 size={16} />
                    Branch
                  </label>
                  <p className="text-gray-900 font-medium">{expense.branch}</p>
                </div>
              )}
            </div>

            {expense.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Description
                </label>
                <p className="text-gray-900">{expense.description}</p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <CreditCard size={16} />
                  Payment Mode
                </label>
                <p className="text-gray-900 font-medium">{expense.payment_mode}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <User size={16} />
                  Paid By
                </label>
                <p className="text-gray-900 font-medium">{expense.paid_by_name}</p>
              </div>

              {expense.payment_voucher_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    Voucher Number
                  </label>
                  <p className="text-gray-900 font-medium">{expense.payment_voucher_number}</p>
                </div>
              )}

              {expense.voucher_file_name && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <Paperclip size={16} />
                    Attachment
                  </label>
                  {expense.voucher_file_url ? (
                    <a
                      href={getAttachmentUrl(expense.voucher_file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {expense.voucher_file_name}
                    </a>
                  ) : (
                    <p className="text-gray-900 font-medium">{expense.voucher_file_name}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Approval Information */}
          {(expense.approval_status === 'Approved' || expense.approval_status === 'Rejected') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Approval Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {expense.approved_by_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {expense.approval_status === 'Approved' ? 'Approved By' : 'Rejected By'}
                    </label>
                    <p className="text-gray-900 font-medium">{expense.approved_by_name}</p>
                  </div>
                )}

                {expense.approved_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {expense.approval_status === 'Approved' ? 'Approved At' : 'Rejected At'}
                    </label>
                    <p className="text-gray-900 font-medium">{formatDateTime(expense.approved_at)}</p>
                  </div>
                )}

                {expense.rejection_reason && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      Rejection Reason
                    </label>
                    <p className="text-gray-900">{expense.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Remarks */}
          {expense.remarks && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h2>
              <p className="text-gray-900">{expense.remarks}</p>
            </div>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900">{formatDateTime(expense.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900">{formatDateTime(expense.updated_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Expense ID
                </label>
                <p className="text-xs text-gray-600 font-mono break-all">{expense.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailPage;
