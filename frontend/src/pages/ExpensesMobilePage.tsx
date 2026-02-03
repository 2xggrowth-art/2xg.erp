import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { expensesService, type Expense } from '../services/expenses.service';

// Money summary card component
interface MoneyCardProps {
  label: string;
  amount: number;
  count: number;
  color: 'orange' | 'green' | 'gray';
  isActive: boolean;
  onClick: () => void;
}

const MoneyCard = ({ label, amount, count, color, isActive, onClick }: MoneyCardProps) => {
  const colorClasses = {
    orange: {
      bg: isActive ? 'bg-orange-100 border-orange-300' : 'bg-orange-50',
      text: 'text-orange-700',
      icon: 'text-orange-600'
    },
    green: {
      bg: isActive ? 'bg-green-100 border-green-300' : 'bg-green-50',
      text: 'text-green-700',
      icon: 'text-green-600'
    },
    gray: {
      bg: isActive ? 'bg-gray-200 border-gray-400' : 'bg-gray-100',
      text: 'text-gray-700',
      icon: 'text-gray-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`flex-1 p-4 rounded-xl border-2 ${classes.bg} transition-all active:scale-98`}
    >
      <div className="flex items-center gap-2 mb-2">
        {color === 'orange' && <Clock size={16} className={classes.icon} />}
        {color === 'green' && <CheckCircle size={16} className={classes.icon} />}
        <span className={`text-sm font-medium ${classes.text}`}>{label}</span>
      </div>
      <div className={`text-xl font-bold ${classes.text}`}>
        ₹{amount.toLocaleString('en-IN')}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {count} expense{count !== 1 ? 's' : ''}
      </div>
    </button>
  );
};

// Expense item card component
interface ExpenseCardProps {
  expense: Expense;
  onClick: () => void;
}

const ExpenseCard = ({ expense, onClick }: ExpenseCardProps) => {
  const getStatusIcon = () => {
    switch (expense.approval_status) {
      case 'Approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'Rejected':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-orange-600" />;
    }
  };

  const getStatusColor = () => {
    switch (expense.approval_status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 active:bg-gray-50 transition-colors"
    >
      {/* Status icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor()}`}>
        {getStatusIcon()}
      </div>

      {/* Details */}
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-900 line-clamp-1">
          {expense.expense_item || expense.category_name || 'Expense'}
        </div>
        <div className="text-sm text-gray-500">
          {expense.category_name} • {expense.payment_mode}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <div className="font-bold text-gray-900">
          ₹{expense.amount.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-gray-400">
          {expense.expense_number}
        </div>
      </div>

      <ChevronRight size={20} className="text-gray-400" />
    </button>
  );
};

// Group expenses by date
const groupByDate = (expenses: Expense[]) => {
  const groups: Record<string, Expense[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  expenses.forEach(expense => {
    const expenseDate = new Date(expense.expense_date).toDateString();
    let label: string;

    if (expenseDate === today) {
      label = 'Today';
    } else if (expenseDate === yesterday) {
      label = 'Yesterday';
    } else {
      label = new Date(expense.expense_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(expense);
  });

  return groups;
};

const ExpensesMobilePage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchExpenses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await expensesService.getAllExpenses();
      const data = response.data?.data || response.data || response || [];
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Calculate summaries
  const pendingExpenses = expenses.filter(e => e.approval_status === 'Pending');
  const approvedExpenses = expenses.filter(e => e.approval_status === 'Approved');

  const pendingTotal = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedTotal = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Filter expenses
  const filteredExpenses = filter === 'all'
    ? expenses
    : filter === 'pending'
    ? pendingExpenses
    : approvedExpenses;

  // Group by date
  const groupedExpenses = groupByDate(filteredExpenses);

  const handleRefresh = () => {
    fetchExpenses(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">My Expenses</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <RefreshCw
              size={20}
              className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Money summary cards */}
        <div className="flex gap-3 mt-4">
          <MoneyCard
            label="Pending"
            amount={pendingTotal}
            count={pendingExpenses.length}
            color="orange"
            isActive={filter === 'pending'}
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          />
          <MoneyCard
            label="Approved"
            amount={approvedTotal}
            count={approvedExpenses.length}
            color="green"
            isActive={filter === 'approved'}
            onClick={() => setFilter(filter === 'approved' ? 'all' : 'approved')}
          />
        </div>
      </div>

      {/* Expense list */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses found</h3>
            <p className="text-gray-500 text-sm">
              {filter !== 'all' ? 'Try changing the filter or ' : ''}
              Tap the camera button to add one
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">
                  {date}
                </h3>
                <div className="space-y-3">
                  {dateExpenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onClick={() => navigate(`/expenses/${expense.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Camera Button */}
      <button
        onClick={() => navigate('/expenses/quick')}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-10"
        style={{ boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}
      >
        <Camera size={28} />
      </button>
    </div>
  );
};

export default ExpensesMobilePage;
