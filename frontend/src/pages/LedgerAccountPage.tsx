import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CreditCard, Download } from 'lucide-react';
import { vendorsService } from '../services/vendors.service';
import { billsService, Bill } from '../services/bills.service';
import { paymentsService, PaymentMade } from '../services/payments.service';
import { vendorCreditsService, VendorCredit } from '../services/vendor-credits.service';

interface Vendor {
  id: string;
  supplier_name: string;
  is_active: boolean;
}

interface TransactionRow {
  date: string;
  type: 'bill' | 'payment' | 'credit';
  number: string;
  status: string;
  amount: number;
  balance: number;
  id: string;
}

const LedgerAccountPage = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedVendorName, setSelectedVendorName] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnFilter, setTxnFilter] = useState<'all' | 'bill' | 'payment' | 'credit'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [selectedVendorId, fromDate, toDate]);

  const fetchVendors = async () => {
    try {
      const response = await vendorsService.getAllVendors({ isActive: true });
      if (response.data.success && response.data.data) {
        setVendors(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTxnLoading(true);
      const filters: any = { vendor_id: selectedVendorId };
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const [billsRes, paymentsRes, creditsRes] = await Promise.all([
        billsService.getAllBills(filters),
        paymentsService.getAllPayments(filters),
        vendorCreditsService.getAllVendorCredits(filters),
      ]);

      const rows: TransactionRow[] = [];

      const bills: Bill[] = billsRes.data || [];
      bills.forEach((b) => {
        rows.push({
          date: b.bill_date,
          type: 'bill',
          number: b.bill_number,
          status: b.status,
          amount: b.total_amount,
          balance: 0,
          id: b.id,
        });
      });

      const payments: PaymentMade[] = paymentsRes.data || [];
      payments.forEach((p) => {
        rows.push({
          date: p.payment_date,
          type: 'payment',
          number: p.payment_number,
          status: p.status,
          amount: -p.amount,
          balance: 0,
          id: p.id,
        });
      });

      const credits: VendorCredit[] = creditsRes.data || [];
      credits.forEach((c) => {
        rows.push({
          date: c.credit_date,
          type: 'credit',
          number: c.credit_note_number,
          status: c.status,
          amount: -c.total_amount,
          balance: 0,
          id: c.id,
        });
      });

      // Sort oldest first for running balance
      rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let bal = 0;
      rows.forEach((r) => {
        bal += r.amount;
        r.balance = bal;
      });

      // Reverse so newest on top
      rows.reverse();
      setTransactions(rows);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTxnLoading(false);
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const vendor = vendors.find((v) => v.id === vendorId);
    setSelectedVendorName(vendor?.supplier_name || '');
    setTxnFilter('all');
  };

  const handleExportCSV = () => {
    const filtered = txnFilter === 'all' ? transactions : transactions.filter((t) => t.type === txnFilter);
    const csvRows = [
      ['Date', 'Type', 'Number', 'Status', 'Debit', 'Credit', 'Balance'].join(','),
      ...filtered.map((txn) =>
        [
          txn.date,
          txn.type === 'bill' ? 'Bill' : txn.type === 'payment' ? 'Payment' : 'Credit',
          txn.number,
          txn.status,
          txn.amount > 0 ? txn.amount.toFixed(2) : '',
          txn.amount < 0 ? Math.abs(txn.amount).toFixed(2) : '',
          txn.balance.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_${selectedVendorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered = txnFilter === 'all' ? transactions : transactions.filter((t) => t.type === txnFilter);
  const totalBills = transactions.filter((t) => t.type === 'bill').reduce((s, t) => s + t.amount, 0);
  const totalPayments = transactions.filter((t) => t.type === 'payment').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
  const netBalance = totalBills - totalPayments - totalCredits;

  const filteredVendors = vendorSearch
    ? vendors.filter((v) => v.supplier_name.toLowerCase().includes(vendorSearch.toLowerCase()))
    : vendors;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Ledger Account</h1>
        <p className="text-sm text-gray-600 mt-1">
          View complete transaction statements for any vendor
        </p>
      </div>

      {/* Vendor Selector + Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Vendor dropdown */}
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select
              value={selectedVendorId}
              onChange={(e) => handleVendorSelect(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a vendor</option>
              {filteredVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.supplier_name}
                </option>
              ))}
            </select>
          </div>

          {/* From date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export */}
          {selectedVendorId && transactions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!selectedVendorId ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Vendor</h3>
            <p className="text-sm text-gray-500">
              Choose a vendor from the dropdown above to view their ledger statement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vendor name header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{selectedVendorName}</h2>
              <div className="flex gap-2">
                {(['all', 'bill', 'payment', 'credit'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxnFilter(f)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      txnFilter === f
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'bill' ? 'Bills' : f === 'payment' ? 'Payments' : 'Credits'}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Billed</p>
                <p className="text-xl font-bold text-gray-900 mt-1">Rs {totalBills.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{transactions.filter((t) => t.type === 'bill').length} bills</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Paid</p>
                <p className="text-xl font-bold text-green-700 mt-1">Rs {totalPayments.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{transactions.filter((t) => t.type === 'payment').length} payments</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Credits</p>
                <p className="text-xl font-bold text-blue-700 mt-1">Rs {totalCredits.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{transactions.filter((t) => t.type === 'credit').length} credits</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Balance Due</p>
                <p className={`text-xl font-bold mt-1 ${netBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  Rs {netBalance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{netBalance > 0 ? 'You owe' : netBalance < 0 ? 'Overpaid' : 'Settled'}</p>
              </div>
            </div>

            {/* Table */}
            {txnLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading transactions...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Transactions</h3>
                <p className="text-sm text-gray-500">No transactions found for this vendor in the selected period.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit (Bill)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit (Paid)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((txn) => (
                      <tr
                        key={`${txn.type}-${txn.id}`}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          if (txn.type === 'bill') navigate(`/purchases/bills/${txn.id}`);
                          else if (txn.type === 'payment') navigate(`/purchases/payments-made/${txn.id}`);
                          else navigate(`/purchases/vendor-credits/${txn.id}`);
                        }}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              txn.type === 'bill'
                                ? 'bg-orange-100 text-orange-700'
                                : txn.type === 'payment'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {txn.type === 'bill' ? 'Bill' : txn.type === 'payment' ? 'Payment' : 'Credit'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium whitespace-nowrap">
                          {txn.number}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              txn.status === 'paid' || txn.status === 'completed' || txn.status === 'closed'
                                ? 'bg-green-100 text-green-700'
                                : txn.status === 'draft'
                                ? 'bg-gray-100 text-gray-600'
                                : txn.status === 'cancelled'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {txn.status.charAt(0).toUpperCase() + txn.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-medium text-red-600">
                          {txn.amount > 0 ? `Rs ${txn.amount.toFixed(2)}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-medium text-green-600">
                          {txn.amount < 0 ? `Rs ${Math.abs(txn.amount).toFixed(2)}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-semibold">
                          Rs {txn.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">
                        Total ({filtered.length} transactions)
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                        Rs {filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        Rs {filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                        Rs {(filtered.length > 0 ? filtered[filtered.length - 1].balance : 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerAccountPage;
