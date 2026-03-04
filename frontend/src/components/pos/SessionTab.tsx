import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Package, Clock, Calendar, AlertCircle } from 'lucide-react';
import { PosSession } from '../../services/pos-sessions.service';
import apiClient from '../../services/api.client';

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
  invoice_count: number;
  orders_value: number;
  returns_value: number;
  payments_breakdown: { [key: string]: number };
  cash_transactions: CashTransaction[];
}

interface CashTransaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  note: string;
  timestamp: string;
}

interface SessionTabProps {
  sessionId?: string;
  activeSession: PosSession | null;
  formatCurrency: (amount: number) => string;
}

type SubTab = 'overview' | 'cash-activity';

const SessionTab: React.FC<SessionTabProps> = ({ sessionId, activeSession, formatCurrency }) => {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [elapsed, setElapsed] = useState('');

  const currentId = sessionId || activeSession?.id;

  // Live stopwatch for in-progress sessions
  useEffect(() => {
    if (activeSession?.status !== 'In-Progress' || !activeSession?.opened_at) return;
    const tick = () => {
      const diff = Date.now() - new Date(activeSession.opened_at).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.status, activeSession?.opened_at]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!currentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Fetch session summary from API
        const summaryRes = await apiClient.get(`/pos-sessions/${currentId}/summary`);
        const apiData = summaryRes.data?.data || summaryRes.data;

        // Fetch invoices for this session to build payments_breakdown
        let payments_breakdown: { [key: string]: number } = {};
        let cash_total = 0;
        let invoiceCount = 0;
        try {
          const invoiceRes = await apiClient.get('/invoices', { params: { pos_session_id: currentId } });
          const invoiceData = invoiceRes.data?.data;
          const fetchedInvoices: any[] = invoiceData?.invoices || invoiceData?.data || [];
          invoiceCount = fetchedInvoices.length;

          fetchedInvoices.forEach((invoice: any) => {
            const amount = invoice.total_amount || 0;
            const notes = invoice.customer_notes || '';
            const splitMatches: RegExpMatchArray[] = Array.from(notes.matchAll(/Payment \d+:\s*(.+?)\s*-\s*₹([\d,.]+)/g));

            if (splitMatches.length > 0) {
              for (const match of splitMatches) {
                const mode = (match[1] || '').trim().toUpperCase();
                const splitAmount = parseFloat((match[2] || '0').replace(/,/g, '')) || 0;
                payments_breakdown[mode] = (payments_breakdown[mode] || 0) + splitAmount;
                if (mode === 'CASH') cash_total += splitAmount;
              }
            } else {
              const paymentMatch = notes.match(/Payment Mode: ([^\n]+)/);
              if (paymentMatch) {
                const mode = paymentMatch[1].trim().toUpperCase();
                payments_breakdown[mode] = (payments_breakdown[mode] || 0) + amount;
                if (mode === 'CASH') cash_total += amount;
              }
            }
          });
        } catch {
          // Invoice fetch failed — use fallback data from summary
        }

        // Load cash transactions from localStorage
        const allTransactions = JSON.parse(localStorage.getItem('pos_cash_transactions') || '[]');
        const sessionTransactions = allTransactions.filter((txn: any) => txn.sessionId === currentId);

        const openingBalance = apiData?.opening_balance ?? activeSession?.opening_balance ?? 0;
        const cashSales = cash_total || apiData?.cashSales || apiData?.cash_sales || 0;
        const cashIn = apiData?.cash_in ?? activeSession?.cash_in ?? 0;
        const cashOut = apiData?.cash_out ?? activeSession?.cash_out ?? 0;
        const totalSales = apiData?.totalSales ?? apiData?.total_sales ?? activeSession?.total_sales ?? 0;
        const closingBalance = activeSession?.closing_balance ?? 0;
        const expectedCash = openingBalance + cashSales + cashIn - cashOut;

        setSummary({
          opening_balance: openingBalance,
          cash_sales: cashSales,
          card_sales: apiData?.cardSales ?? apiData?.card_sales ?? 0,
          upi_sales: apiData?.upiSales ?? apiData?.upi_sales ?? 0,
          credit_sales: apiData?.creditSales ?? apiData?.credit_sales ?? 0,
          total_sales: totalSales,
          cash_in: cashIn,
          cash_out: cashOut,
          expected_cash: expectedCash,
          actual_cash: closingBalance || expectedCash,
          discrepancy: closingBalance ? closingBalance - expectedCash : 0,
          invoice_count: invoiceCount || apiData?.invoiceCount || 0,
          orders_value: totalSales,
          returns_value: 0,
          payments_breakdown,
          cash_transactions: sessionTransactions,
        });
      } catch (err: any) {
        console.error('Error fetching session summary:', err);
        // Fallback from activeSession data
        if (activeSession) {
          const cashSales = activeSession.total_sales;
          const expectedCash = activeSession.opening_balance + cashSales + activeSession.cash_in - activeSession.cash_out;
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
            invoice_count: 0,
            orders_value: activeSession.total_sales,
            returns_value: 0,
            payments_breakdown: {},
            cash_transactions: [],
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [currentId, activeSession]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeSession && !sessionId) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <DollarSign className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No active session</p>
            <p className="text-sm mt-1">Start a POS session to view the summary</p>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#2563eb', '#f59e0b', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#4f46e5', '#db2777'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header + Sub-tabs */}
      <div className="px-6 pt-4 pb-0 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {activeSession?.session_number || 'Session'}
            </h2>
            <p className="text-xs text-gray-500">
              {activeSession?.register}
              {activeSession?.status === 'In-Progress' && elapsed && (
                <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                  <Clock className="w-3 h-3 animate-pulse" />
                  {elapsed}
                </span>
              )}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            activeSession?.status === 'In-Progress'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {activeSession?.status === 'In-Progress' ? 'Active' : 'Closed'}
          </span>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span className="text-xs text-yellow-700">{error}</span>
          </div>
        )}

        {/* Sub-tab buttons */}
        <div className="flex gap-6">
          <button
            onClick={() => setSubTab('overview')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSubTab('cash-activity')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === 'cash-activity'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Cash Activity
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {summary && subTab === 'overview' && (
          <div className="space-y-4">
            {/* In-progress banner */}
            {activeSession?.status === 'In-Progress' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                <div className="relative">
                  <Clock className="w-6 h-6 text-green-600 animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">The session is in-progress!</p>
                  <p className="text-xs text-green-600">Duration: {elapsed}</p>
                </div>
              </div>
            )}

            {/* 4 Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Total Sales</span>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(summary.total_sales)}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{summary.invoice_count} Invoices</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Orders Value</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(summary.orders_value)}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{summary.invoice_count} Orders</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Total Returns</span>
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(summary.returns_value)}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">No. of returns 0</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Discrepancy</span>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(summary.discrepancy)}</div>
                <div className={`text-[11px] mt-0.5 ${summary.discrepancy === 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summary.discrepancy === 0 ? 'No discrepancy' : 'Has discrepancy'}
                </div>
              </div>
            </div>

            {/* Other Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Other Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Calendar className="w-3 h-3" />
                    Opened on:
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {activeSession?.opened_at && formatDateTime(activeSession.opened_at)} by {activeSession?.opened_by}
                  </div>
                </div>
                {activeSession?.closed_at && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Clock className="w-3 h-3" />
                      Closed on:
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {formatDateTime(activeSession.closed_at)} by {(activeSession as any).closed_by || activeSession.opened_by}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Register / Pos</div>
                  <div className="text-sm font-medium text-gray-800">{activeSession?.register}</div>
                </div>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Sales Summary</h3>
              {(() => {
                const entries = Object.entries(summary.payments_breakdown);
                const total = summary.total_sales || 1;
                return (
                  <>
                    {entries.length > 0 && (
                      <div className="flex w-full h-3 rounded-full overflow-hidden mb-4">
                        {entries.map(([mode, amount], index) => (
                          <div
                            key={mode}
                            style={{
                              width: `${(amount / total) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {entries.length > 0 ? (
                        entries.map(([mode, amount], index) => (
                          <div
                            key={mode}
                            className={`flex justify-between items-center py-2 ${index < entries.length - 1 ? 'border-b border-gray-100' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-sm font-medium text-gray-700">{mode}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-400">
                          <p className="text-xs">No payment data available</p>
                        </div>
                      )}
                    </div>
                    {entries.length > 0 && (
                      <div className="mt-3 pt-3 border-t-2 border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-800">Total</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_sales)}</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Denomination Data */}
            {activeSession?.denomination_data && activeSession.denomination_data.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800">Denomination Count</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeSession.denomination_data.map((denom, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(denom.note)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 text-center">{denom.count}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(denom.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {summary && subTab === 'cash-activity' && (
          <div className="space-y-4">
            {/* Cash Drawer Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Cash Drawer Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Previous session closure amount</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(summary.opening_balance)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Amount Counted at the Start</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(summary.opening_balance)}</span>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 my-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-blue-900">Cash Sales</span>
                    <span className="text-sm font-bold text-blue-900">{formatCurrency(summary.cash_sales)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-green-900">Cash In</span>
                    <span className="text-sm font-bold text-green-900">{formatCurrency(summary.cash_in)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-red-900">Cash Out</span>
                    <span className="text-sm font-bold text-red-900">{formatCurrency(summary.cash_out)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Cash Refunds</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(0)}</span>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3 my-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Expected Amount in Cash Drawer</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(summary.expected_cash)}</span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 my-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Counted Amount in Cash Drawer</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(summary.actual_cash)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 my-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-800">Discrepancy</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(summary.discrepancy)}</span>
                  </div>
                  <p className={`text-xs mt-1 ${summary.discrepancy === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.discrepancy === 0 ? 'No discrepancy' : `${summary.discrepancy > 0 ? 'Over' : 'Short'} by ${formatCurrency(Math.abs(summary.discrepancy))}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Cash In/Out Transactions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Cash In/Out Transactions</h3>
              {summary.cash_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summary.cash_transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {new Date(txn.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              txn.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {txn.type === 'in' ? 'Cash In' : 'Cash Out'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700">{txn.note || '-'}</td>
                          <td className="px-3 py-2 text-xs text-right">
                            <span className={`font-bold ${txn.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                              {txn.type === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No cash in/out transactions recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionTab;
