import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, DollarSign, TrendingUp, TrendingDown, Printer, Package, RefreshCw } from 'lucide-react';
import { invoicesService } from '../services/invoices.service';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  customer_notes?: string;
  subject?: string;
}

interface CashTransaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  note: string;
  timestamp: string;
}

interface PosSession {
  id: string;
  session_number: string;
  register: string;
  opened_by: string;
  opened_at: string;
  closed_at?: string;
  status: 'In-Progress' | 'Closed';
  opening_balance: number;
  closing_balance?: number;
  cash_in: number;
  cash_out: number;
  total_sales: number;
  orders_value: number;
  orders_count: number;
  returns_value: number;
  returns_count: number;
  discrepancy: number;
  expected_cash_drawer: number;
  counted_cash_drawer: number;
  cash_sales: number;
  credit_sales: number;
  payments_breakdown: {
    [key: string]: number;
  };
  cash_transactions: CashTransaction[];
}

type TabType = 'overview' | 'cash-activity';

const SessionDetailPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [session, setSession] = useState<PosSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);

      // Fetch all invoices
      const response = await invoicesService.getAllInvoices({});

      if (response.success && response.data) {
        const invoices: Invoice[] = response.data.invoices || response.data.data || [];

        // Filter POS transactions only (where subject = 'POS')
        const posInvoices = invoices.filter((inv: any) => inv.subject === 'POS');

        // Calculate payment breakdown from customer_notes
        const payments_breakdown: { [key: string]: number } = {};
        let total_sales = 0;
        let cash_total = 0;

        posInvoices.forEach((invoice: any) => {
          const amount = invoice.total_amount || 0;
          total_sales += amount;

          // Extract payment mode from customer_notes
          const notes = invoice.customer_notes || '';
          const paymentMatch = notes.match(/Payment Mode: ([^\n]+)/);

          if (paymentMatch) {
            const paymentMode = paymentMatch[1].trim();
            const normalizedMode = paymentMode.toUpperCase();

            if (payments_breakdown[normalizedMode]) {
              payments_breakdown[normalizedMode] += amount;
            } else {
              payments_breakdown[normalizedMode] = amount;
            }

            // Track cash specifically
            if (normalizedMode === 'CASH') {
              cash_total += amount;
            }
          }
        });

        // Load cash transactions from localStorage
        const allTransactions = JSON.parse(localStorage.getItem('pos_cash_transactions') || '[]');
        const sessionTransactions = allTransactions.filter((txn: any) => txn.sessionId === sessionId);

        // Load session data from localStorage
        const savedSessions = JSON.parse(localStorage.getItem('pos_sessions') || '[]');
        const savedSession = savedSessions.find((s: any) => s.id === sessionId);

        // Mock session data - you should fetch this from a sessions API endpoint
        const sessionData: PosSession = {
          id: sessionId || '1',
          session_number: savedSession?.session_number || 'SE1-556',
          register: savedSession?.register || 'billing desk',
          opened_by: savedSession?.opened_by || 'Admin User',
          opened_at: savedSession?.opened_at || '2026-01-19T10:24:00',
          closed_at: savedSession?.closed_at || '2026-01-19T17:04:00',
          status: savedSession?.status || 'Closed',
          opening_balance: savedSession?.opening_balance || 0,
          closing_balance: cash_total,
          cash_in: savedSession?.cash_in || 0,
          cash_out: savedSession?.cash_out || 0,
          total_sales: total_sales,
          orders_value: total_sales,
          orders_count: posInvoices.length,
          returns_value: 0,
          returns_count: 0,
          discrepancy: 0,
          expected_cash_drawer: cash_total + (savedSession?.cash_in || 0) - (savedSession?.cash_out || 0),
          counted_cash_drawer: cash_total,
          cash_sales: cash_total,
          credit_sales: total_sales - cash_total,
          payments_breakdown: payments_breakdown,
          cash_transactions: sessionTransactions
        };

        setSession(sessionData);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePrint = () => {
    if (!session) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Session Report - ${session.session_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 14px;
            margin-bottom: 10px;
          }
          .section {
            margin: 15px 0;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
          }
          .label {
            flex: 1;
          }
          .value {
            text-align: right;
            font-weight: bold;
          }
          .separator {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .total-row {
            font-weight: bold;
            font-size: 13px;
            padding: 5px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            margin: 5px 0;
          }
          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">BHARATH CYCLE HUB</div>
          <div class="report-title">Session Report</div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Session No</span>
            <span class="value">: ${session.session_number}</span>
          </div>
          <div class="row">
            <span class="label">Register</span>
            <span class="value">: ${session.register}</span>
          </div>
          <div class="row">
            <span class="label">User</span>
            <span class="value">: ${session.opened_by}</span>
          </div>
          <div class="row">
            <span class="label">Opened on</span>
            <span class="value">: ${formatDateTime(session.opened_at)}</span>
          </div>
          ${session.closed_at ? `
          <div class="row">
            <span class="label">Closed on</span>
            <span class="value">: ${formatDateTime(session.closed_at)}</span>
          </div>
          ` : ''}
          <div class="row">
            <span class="label">Print time</span>
            <span class="value">: ${new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}</span>
          </div>
          <div class="row">
            <span class="label">Total Sales</span>
            <span class="value">: ${formatCurrency(session.total_sales)}</span>
          </div>
          <div class="row">
            <span class="label">Tot. Returns</span>
            <span class="value">: ${formatCurrency(session.returns_value)}</span>
          </div>
        </div>

        <div class="separator"></div>

        <div class="section">
          <div class="section-title">Cash Drawer Summary</div>
          <div class="row">
            <span class="label">Opening Cash</span>
            <span class="value">: ${formatCurrency(session.opening_balance)}</span>
          </div>
          <div class="row">
            <span class="label">Cash Sales</span>
            <span class="value">: ${formatCurrency(session.cash_sales)}</span>
          </div>
          <div class="row">
            <span class="label">Cash In</span>
            <span class="value">: ${formatCurrency(session.cash_in)}</span>
          </div>
          <div class="row">
            <span class="label">Cash Out</span>
            <span class="value">: ${formatCurrency(session.cash_out)}</span>
          </div>
          <div class="row">
            <span class="label">Cash Refunds</span>
            <span class="value">: ${formatCurrency(0)}</span>
          </div>
          <div class="row">
            <span class="label">Expected Cash</span>
            <span class="value">: ${formatCurrency(session.expected_cash_drawer)}</span>
          </div>
          <div class="row">
            <span class="label">Closing cash</span>
            <span class="value">: ${formatCurrency(session.counted_cash_drawer)}</span>
          </div>
          <div class="row">
            <span class="label">Discrepancy</span>
            <span class="value">: ${formatCurrency(session.discrepancy)}</span>
          </div>
        </div>

        <div class="separator"></div>

        <div class="section">
          <div class="section-title">Sales Summary</div>
          ${Object.entries(session.payments_breakdown).map(([mode, amount]) => `
            <div class="row">
              <span class="label">${mode}</span>
              <span class="value">: ${formatCurrency(amount)}</span>
            </div>
          `).join('')}
          <div class="row total-row">
            <span class="label">Total</span>
            <span class="value">: ${formatCurrency(session.total_sales)}</span>
          </div>
        </div>

        <div class="separator"></div>

        <div style="text-align: center; margin-top: 20px; font-size: 11px;">
          Thank you!
        </div>

        <script>
          window.onload = function() {
            window.print();
            // Uncomment below to auto-close after printing
            // window.onafterprint = function() { window.close(); }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Session not found</p>
          <button
            onClick={() => navigate('/sales/pos')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to POS
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
                onClick={() => navigate('/sales/pos')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">{session.session_number}</h1>
                <p className="text-sm text-gray-500 mt-1">{session.register}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchSessionDetails}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          {/* Session Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Opened on</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {formatDateTime(session.opened_at)} by {session.opened_by}
              </p>
            </div>
            {session.closed_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Closed on</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDateTime(session.closed_at)} by {session.opened_by}
                </p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Register / Pos</div>
              <p className="text-sm font-semibold text-gray-800">{session.register}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-t border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('cash-activity')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'cash-activity'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Cash Activity
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">Total Sales</div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(session.total_sales)}</div>
                <div className="text-xs text-gray-500 mt-1">{session.orders_count} Invoices</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">Orders Value</div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(session.orders_value)}</div>
                <div className="text-xs text-gray-500 mt-1">{session.orders_count} Orders</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">Total Returns</div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(session.returns_value)}</div>
                <div className="text-xs text-gray-500 mt-1">No. of returns {session.returns_count}</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">Discrepancy</div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(session.discrepancy)}</div>
                <div className="text-xs text-green-600 mt-1">No discrepancy</div>
              </div>
            </div>

            {/* Other Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Opened on:</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatDateTime(session.opened_at)} by {session.opened_by}
                  </div>
                </div>
                {session.closed_at && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Closed on:</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {formatDateTime(session.closed_at)} by {session.opened_by}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Register / Pos</div>
                  <div className="text-sm font-semibold text-gray-800">{session.register}</div>
                </div>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Summary</h3>
              <div className="space-y-3">
                {Object.entries(session.payments_breakdown).length > 0 ? (
                  Object.entries(session.payments_breakdown).map(([paymentMode, amount], index) => {
                    // Color palette for different payment methods
                    const colors = [
                      '#2563eb', // blue
                      '#16a34a', // green
                      '#9333ea', // purple
                      '#ea580c', // orange
                      '#dc2626', // red
                      '#4f46e5', // indigo
                      '#db2777', // pink
                      '#ca8a04', // yellow
                    ];
                    const color = colors[index % colors.length];
                    const isLast = index === Object.entries(session.payments_breakdown).length - 1;

                    return (
                      <div
                        key={paymentMode}
                        className={`flex justify-between items-center py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                          <span className="text-sm font-medium text-gray-700">{paymentMode}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No payment data available</p>
                  </div>
                )}
              </div>
              {Object.entries(session.payments_breakdown).length > 0 && (
                <div className="mt-6 pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-800">Total</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(session.total_sales)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Cash Activity Tab */
          <div className="space-y-6">
            {/* Cash Drawer Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash Drawer Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Previous session closure amount</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(session.opening_balance)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Amount Counted at the Start</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(session.opening_balance)}</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 my-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-blue-900">Cash Sales</span>
                    <span className="text-base font-bold text-blue-900">{formatCurrency(session.cash_sales)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-green-900">Cash In</span>
                    <span className="text-base font-bold text-green-900">{formatCurrency(session.cash_in)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-red-900">Cash Out</span>
                    <span className="text-base font-bold text-red-900">{formatCurrency(session.cash_out)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Cash Refunds</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(0)}</span>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 my-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Expected Amount in Cash Drawer</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(session.expected_cash_drawer)}</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 my-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Counted Amount in Cash Drawer</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(session.counted_cash_drawer)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 my-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-800">Discrepancy</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(session.discrepancy)}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">No discrepancy</p>
                </div>
              </div>
            </div>

            {/* Cash Transactions History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash In/Out Transactions</h3>
              {session.cash_transactions && session.cash_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Note
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {session.cash_transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(transaction.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.type === 'in'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {transaction.type === 'in' ? 'Cash In' : 'Cash Out'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {transaction.note || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span
                              className={`font-bold ${
                                transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transaction.type === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No cash in/out transactions recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetailPage;
