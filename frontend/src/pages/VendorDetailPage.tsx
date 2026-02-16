import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  Download
} from 'lucide-react';
import { vendorsService, Vendor } from '../services/vendors.service';
import { billsService, Bill } from '../services/bills.service';
import { paymentsService, PaymentMade } from '../services/payments.service';
import { vendorCreditsService, VendorCredit } from '../services/vendor-credits.service';

interface TransactionRow {
  date: string;
  type: 'bill' | 'payment' | 'credit';
  number: string;
  status: string;
  amount: number;       // positive = payable increased, negative = payable decreased
  balance: number;      // running balance (computed after sort)
  id: string;
}

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'documents'>('overview');
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnFilter, setTxnFilter] = useState<'all' | 'bill' | 'payment' | 'credit'>('all');

  useEffect(() => {
    if (id) {
      fetchVendorDetails();
      fetchTransactions();
    }
  }, [id]);

  const fetchTransactions = async () => {
    try {
      setTxnLoading(true);
      const [billsRes, paymentsRes, creditsRes] = await Promise.all([
        billsService.getAllBills({ vendor_id: id! }),
        paymentsService.getAllPayments({ vendor_id: id! }),
        vendorCreditsService.getAllVendorCredits({ vendor_id: id! }),
      ]);

      const rows: TransactionRow[] = [];

      // Bills = amount owed TO vendor (increases payable)
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

      // Payments = amount paid TO vendor (decreases payable)
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

      // Credits = return/deduction from vendor (decreases payable)
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

      // Compute running balance
      let bal = 0;
      rows.forEach((r) => {
        bal += r.amount;
        r.balance = bal;
      });

      // Reverse so newest is on top
      rows.reverse();
      setTransactions(rows);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTxnLoading(false);
    }
  };

  const handlePrintStatement = () => {
    const totalBills = transactions.filter((t) => t.type === 'bill').reduce((s, t) => s + t.amount, 0);
    const totalPayments = transactions.filter((t) => t.type === 'payment').reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
    const netBalance = totalBills - totalPayments - totalCredits;
    // Sort oldest first for statement
    const sorted = [...transactions].reverse();

    const html = `
      <html>
      <head>
        <title>Vendor Statement - ${vendor?.supplier_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
          .summary { display: flex; gap: 24px; margin-bottom: 24px; }
          .summary-box { border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; flex: 1; }
          .summary-box .label { font-size: 11px; color: #888; text-transform: uppercase; }
          .summary-box .value { font-size: 18px; font-weight: bold; margin-top: 4px; }
          .green { color: #15803d; }
          .red { color: #b91c1c; }
          .blue { color: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #f3f4f6; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; color: #666; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          tfoot td { border-top: 2px solid #333; font-weight: bold; background: #f9fafb; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Vendor Statement</h1>
        <div class="subtitle">
          <strong>${vendor?.supplier_name}</strong>
          ${vendor?.company_name ? ' | ' + vendor.company_name : ''}
          ${vendor?.phone ? ' | ' + vendor.phone : ''}
          <br/>Statement Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        <div class="summary">
          <div class="summary-box">
            <div class="label">Total Billed</div>
            <div class="value">₹${totalBills.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Paid</div>
            <div class="value green">₹${totalPayments.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div class="label">Credits</div>
            <div class="value blue">₹${totalCredits.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div class="label">Balance Due</div>
            <div class="value ${netBalance > 0 ? 'red' : 'green'}">₹${netBalance.toFixed(2)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Number</th>
              <th>Status</th>
              <th class="right">Debit</th>
              <th class="right">Credit</th>
              <th class="right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((txn) => `
              <tr>
                <td>${new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td>${txn.type === 'bill' ? 'Bill' : txn.type === 'payment' ? 'Payment' : 'Credit'}</td>
                <td>${txn.number}</td>
                <td>${txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}</td>
                <td class="right red">${txn.amount > 0 ? '₹' + txn.amount.toFixed(2) : ''}</td>
                <td class="right green">${txn.amount < 0 ? '₹' + Math.abs(txn.amount).toFixed(2) : ''}</td>
                <td class="right bold">₹${txn.balance.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">Total (${sorted.length} transactions)</td>
              <td class="right red">₹${totalBills.toFixed(2)}</td>
              <td class="right green">₹${(totalPayments + totalCredits).toFixed(2)}</td>
              <td class="right bold">₹${netBalance.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorsService.getVendorById(id!);

      if (response.data.success && response.data.data) {
        setVendor(response.data.data);
      } else {
        setError('Failed to load vendor details');
      }
    } catch (err: any) {
      console.error('Error fetching vendor:', err);
      setError(err.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      await vendorsService.deleteVendor(id!);
      navigate('/vendor-management');
    } catch (err: any) {
      alert('Failed to delete vendor: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium mb-4">{error || 'Vendor not found'}</p>
          <button
            onClick={() => navigate('/vendor-management')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Vendors
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
                onClick={() => navigate('/vendor-management')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">{vendor.supplier_name}</h1>
                <p className="text-sm text-gray-500 mt-1">Vendor Details</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/vendor-management/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Documents
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vendor.company_name && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Company</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.company_name}</p>
                      </div>
                    </div>
                  )}
                  {vendor.contact_person && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Contact Person</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.contact_person}</p>
                      </div>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.email}</p>
                      </div>
                    </div>
                  )}
                  {vendor.work_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Work Phone</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.work_phone}</p>
                      </div>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                        <p className="text-sm text-gray-900 mt-1">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Address
                </h2>
                <div className="text-sm text-gray-900 space-y-1">
                  {vendor.address && <p>{vendor.address}</p>}
                  <p>
                    {[vendor.city, vendor.state, vendor.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {vendor.country && <p>{vendor.country}</p>}
                </div>
              </div>

              {/* Tax & Compliance Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Tax & Compliance Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vendor.gst_treatment && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">GST Treatment</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.gst_treatment}</p>
                    </div>
                  )}
                  {vendor.gstin && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">GSTIN</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.gstin}</p>
                    </div>
                  )}
                  {vendor.pan && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">PAN</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.pan}</p>
                    </div>
                  )}
                  {vendor.source_of_supply && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Source of Supply</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.source_of_supply}</p>
                    </div>
                  )}
                  {vendor.payment_terms && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Payment Terms</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.payment_terms}</p>
                    </div>
                  )}
                  {vendor.currency && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Currency</p>
                      <p className="text-sm text-gray-900 mt-1">{vendor.currency}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      MSME Registered
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {vendor.is_msme_registered ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Financial Summary
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-600 uppercase font-medium">Current Payable</p>
                    <p className="text-2xl font-bold text-orange-700 mt-1">
                      ₹{(() => {
                        const totalBills = transactions.filter(t => t.type === 'bill').reduce((s, t) => s + t.amount, 0);
                        const totalPayments = transactions.filter(t => t.type === 'payment').reduce((s, t) => s + Math.abs(t.amount), 0);
                        const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
                        return (totalBills - totalPayments - totalCredits).toFixed(2);
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 uppercase font-medium">Total Billed</p>
                    <p className="text-xl font-semibold text-blue-700 mt-1">
                      ₹{transactions.filter(t => t.type === 'bill').reduce((s, t) => s + t.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 uppercase font-medium">Total Paid</p>
                    <p className="text-xl font-semibold text-green-700 mt-1">
                      ₹{transactions.filter(t => t.type === 'payment').reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(2)}
                    </p>
                  </div>
                  {vendor.credit_limit && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-medium">Credit Limit</p>
                      <p className="text-xl font-semibold text-gray-700 mt-1">
                        ₹{vendor.credit_limit.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Status & Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        vendor.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {vendor.rating && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Rating</p>
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < vendor.rating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created At
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(vendor.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Last Updated
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(vendor.updated_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center justify-between">
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
            {(() => {
              const filtered = txnFilter === 'all' ? transactions : transactions.filter((t) => t.type === txnFilter);
              const totalBills = transactions.filter((t) => t.type === 'bill').reduce((s, t) => s + t.amount, 0);
              const totalPayments = transactions.filter((t) => t.type === 'payment').reduce((s, t) => s + Math.abs(t.amount), 0);
              const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
              const netBalance = totalBills - totalPayments - totalCredits;

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 uppercase font-medium">Total Billed</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">₹{totalBills.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 uppercase font-medium">Total Paid</p>
                      <p className="text-xl font-bold text-green-700 mt-1">₹{totalPayments.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 uppercase font-medium">Credits</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">₹{totalCredits.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 uppercase font-medium">Balance Due</p>
                      <p className={`text-xl font-bold mt-1 ${netBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        ₹{netBalance.toFixed(2)}
                      </p>
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
                      <p className="text-sm text-gray-500">No transactions found for this vendor.</p>
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
                          {filtered.map((txn, idx) => (
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
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  txn.type === 'bill'
                                    ? 'bg-orange-100 text-orange-700'
                                    : txn.type === 'payment'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {txn.type === 'bill' ? 'Bill' : txn.type === 'payment' ? 'Payment' : 'Credit'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-medium whitespace-nowrap">
                                {txn.number}
                              </td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  txn.status === 'paid' || txn.status === 'completed' || txn.status === 'closed'
                                    ? 'bg-green-100 text-green-700'
                                    : txn.status === 'draft'
                                    ? 'bg-gray-100 text-gray-600'
                                    : txn.status === 'cancelled'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {txn.status.charAt(0).toUpperCase() + txn.status.slice(1).replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-medium text-red-600">
                                {txn.amount > 0 ? `₹${txn.amount.toFixed(2)}` : ''}
                              </td>
                              <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-medium text-green-600">
                                {txn.amount < 0 ? `₹${Math.abs(txn.amount).toFixed(2)}` : ''}
                              </td>
                              <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-semibold">
                                ₹{txn.balance.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'documents' && (() => {
          const totalBills = transactions.filter((t) => t.type === 'bill').reduce((s, t) => s + t.amount, 0);
          const totalPayments = transactions.filter((t) => t.type === 'payment').reduce((s, t) => s + Math.abs(t.amount), 0);
          const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
          const netBalance = totalBills - totalPayments - totalCredits;
          const sorted = [...transactions].reverse();

          return (
            <div className="space-y-4">
              {/* Header with print button */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Vendor Statement</h2>
                <button
                  onClick={handlePrintStatement}
                  disabled={txnLoading || transactions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Download size={16} />
                  Print / Download
                </button>
              </div>

              {txnLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading statement...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Statement</h3>
                  <p className="text-sm text-gray-500">No transactions found to generate a statement.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Statement header */}
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{vendor?.supplier_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {vendor?.company_name && <span>{vendor.company_name} | </span>}
                      {vendor?.phone && <span>{vendor.phone} | </span>}
                      {vendor?.email && <span>{vendor.email}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Statement as of {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Billed</p>
                      <p className="text-lg font-bold text-gray-900">₹{totalBills.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Paid</p>
                      <p className="text-lg font-bold text-green-700">₹{totalPayments.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Credits</p>
                      <p className="text-lg font-bold text-blue-700">₹{totalCredits.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Balance</p>
                      <p className={`text-lg font-bold ${netBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        ₹{netBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Statement table */}
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sorted.map((txn) => (
                        <tr key={`${txn.type}-${txn.id}`}>
                          <td className="px-3 py-2 text-gray-900">
                            {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {txn.type === 'bill' ? 'Bill' : txn.type === 'payment' ? 'Payment' : 'Credit'}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">{txn.number}</td>
                          <td className="px-3 py-2 text-gray-600 capitalize">{txn.status.replace('_', ' ')}</td>
                          <td className="px-3 py-2 text-right text-red-600 font-medium">
                            {txn.amount > 0 ? `₹${txn.amount.toFixed(2)}` : ''}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600 font-medium">
                            {txn.amount < 0 ? `₹${Math.abs(txn.amount).toFixed(2)}` : ''}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">₹{txn.balance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 font-semibold text-gray-700">
                          Total ({sorted.length} transactions)
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-red-600">₹{totalBills.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-bold text-green-600">₹{(totalPayments + totalCredits).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">₹{netBalance.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default VendorDetailPage;
