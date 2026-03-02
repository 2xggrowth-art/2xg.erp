import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Smartphone,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { PosSession, posSessionsService } from '../../services/pos-sessions.service';

interface SessionSummary {
  opening_balance: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  credit_sales: number;
  total_sales: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
  actual_cash: number;
  discrepancy: number;
}

interface SessionTabProps {
  sessionId?: string;
  activeSession: PosSession | null;
  formatCurrency: (amount: number) => string;
}

const SessionTab: React.FC<SessionTabProps> = ({ sessionId, activeSession, formatCurrency }) => {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      const id = sessionId || activeSession?.id;
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Try to get session data from the service
        const result = await posSessionsService.getSessionById(id);
        if (result.success && result.data) {
          const session = result.data;
          const cashSales = session.total_sales;
          const expectedCash =
            session.opening_balance + cashSales + session.cash_in - session.cash_out;
          const actualCash = session.closing_balance ?? expectedCash;

          setSummary({
            opening_balance: session.opening_balance,
            cash_sales: cashSales,
            card_sales: 0,
            upi_sales: 0,
            credit_sales: 0,
            total_sales: session.total_sales,
            cash_in: session.cash_in,
            cash_out: session.cash_out,
            expected_cash: expectedCash,
            actual_cash: actualCash,
            discrepancy: actualCash - expectedCash,
          });
        } else {
          buildFallbackSummary();
        }
      } catch (err: any) {
        console.error('Error fetching session summary:', err);
        buildFallbackSummary();
      } finally {
        setLoading(false);
      }
    };

    const buildFallbackSummary = () => {
      if (activeSession) {
        const cashSales = activeSession.total_sales;
        const expectedCash =
          activeSession.opening_balance +
          cashSales +
          activeSession.cash_in -
          activeSession.cash_out;
        const actualCash = activeSession.closing_balance ?? expectedCash;

        setSummary({
          opening_balance: activeSession.opening_balance,
          cash_sales: cashSales,
          card_sales: 0,
          upi_sales: 0,
          credit_sales: 0,
          total_sales: activeSession.total_sales,
          cash_in: activeSession.cash_in,
          cash_out: activeSession.cash_out,
          expected_cash: expectedCash,
          actual_cash: actualCash,
          discrepancy: actualCash - expectedCash,
        });
      }
    };

    fetchSummary();
  }, [sessionId, activeSession]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeSession && !sessionId) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <DollarSign className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No active session</p>
            <p className="text-sm mt-1">Start a POS session to view the summary</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Session Summary</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {activeSession?.session_number || 'Session'} -{' '}
          {activeSession?.status === 'In-Progress' ? 'Active' : 'Closed'}
          {activeSession?.opened_at && (
            <span>
              {' '}
              | Opened{' '}
              {new Date(activeSession.opened_at).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-yellow-700 dark:text-yellow-400">{error}</span>
        </div>
      )}

      {summary && (
        <div className="space-y-4">
          {/* Sales Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Opening Balance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Opening Balance
                  </div>
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrency(summary.opening_balance)}
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cash Sales
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.cash_sales)}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Card Sales
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(summary.card_sales)}
                  </div>
                </div>
              </div>
            </div>

            {/* UPI Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    UPI Sales
                  </div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(summary.upi_sales)}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Credit Sales
                  </div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(summary.credit_sales)}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Sales
                  </div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(summary.total_sales)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Reconciliation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Cash Reconciliation
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Opening Balance</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrency(summary.opening_balance)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">+ Cash Sales</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{formatCurrency(summary.cash_sales)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">+ Cash In</span>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{formatCurrency(summary.cash_in)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">- Cash Out</span>
                  </div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(summary.cash_out)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 -mx-4 px-4">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Expected Cash
                  </span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrency(summary.expected_cash)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Actual Cash</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrency(summary.actual_cash)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Discrepancy
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      summary.discrepancy === 0
                        ? 'text-green-600 dark:text-green-400'
                        : summary.discrepancy > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {summary.discrepancy > 0 ? '+' : ''}
                    {formatCurrency(summary.discrepancy)}
                    {summary.discrepancy === 0 && ' (Balanced)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Denomination Data */}
          {activeSession?.denomination_data && activeSession.denomination_data.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Denomination Count
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Note
                    </th>
                    <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Count
                    </th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activeSession.denomination_data.map((denom, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-2 text-sm text-gray-900 dark:text-gray-200">
                        {formatCurrency(denom.note)}
                      </td>
                      <td className="px-6 py-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                        {denom.count}
                      </td>
                      <td className="px-6 py-2 text-sm text-gray-900 dark:text-gray-200 text-right font-medium">
                        {formatCurrency(denom.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionTab;
