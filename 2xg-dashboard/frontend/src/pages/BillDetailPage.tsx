import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Printer,
  Mail,
  Download,
  MoreVertical,
  Calendar,
  Building2,
  Package,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  CreditCard
} from 'lucide-react';

interface LineItem {
  id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  total: number;
}

interface Bill {
  id: string;
  bill_number: string;
  vendor_bill_number?: string;
  po_number?: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_address?: string;
  bill_date: string;
  due_date: string;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
  line_items: LineItem[];
  payment_history?: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string;
  }>;
  created_at: string;
  updated_at?: string;
}

const BillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'activity'>('details');
  const [showActionMenu, setShowActionMenu] = useState(false);

  useEffect(() => {
    fetchBillDetails();
  }, [id]);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      // Mock data
      setBill({
        id: id!,
        bill_number: `BILL-${id?.slice(0, 8).toUpperCase()}`,
        vendor_bill_number: 'VB-2024-001234',
        po_number: 'PO-00123',
        vendor_name: 'Hero Cycles Ltd',
        vendor_email: 'accounts@herocycles.com',
        vendor_phone: '+91 98765 12345',
        vendor_address: 'Industrial Area Phase II, Ludhiana, Punjab 141003',
        bill_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        subtotal: 125000,
        tax_amount: 22500,
        discount_amount: 0,
        total_amount: 147500,
        amount_paid: 50000,
        balance_due: 97500,
        notes: 'Bill for goods received on 5th Jan 2026',
        line_items: [
          { id: '1', item_name: 'Hero Sprint Pro 26T Frame', sku: 'HRO-FRM-26T', quantity: 20, unit_price: 5000, tax_rate: 18, total: 100000 },
          { id: '2', item_name: 'Hero Wheel Set 26"', sku: 'HRO-WHL-26', quantity: 10, unit_price: 2500, tax_rate: 18, total: 25000 },
        ],
        payment_history: [
          { id: '1', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), amount: 50000, method: 'Bank Transfer', reference: 'TXN-987654' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <FileText size={16} />, label: 'Draft' },
      pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock size={16} />, label: 'Pending' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={16} />, label: 'Partially Paid' },
      paid: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={16} />, label: 'Paid' },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={16} />, label: 'Overdue' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <XCircle size={16} />, label: 'Cancelled' },
    };
    return configs[status] || configs.draft;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = () => {
    if (!bill) return 0;
    const dueDate = new Date(bill.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      navigate('/purchases/bills');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Bill not found</h2>
          <button
            onClick={() => navigate('/purchases/bills')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Bills
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(bill.status);
  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/purchases/bills')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{bill.bill_number}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                  {daysUntilDue > 0 && bill.status !== 'paid' && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                      Due in {daysUntilDue} days
                    </span>
                  )}
                  {daysUntilDue < 0 && bill.status !== 'paid' && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                      {Math.abs(daysUntilDue)} days overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {bill.vendor_bill_number && `Vendor Bill: ${bill.vendor_bill_number} • `}
                  {bill.po_number && `From ${bill.po_number}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                <Printer size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download PDF">
                <Download size={20} className="text-gray-600" />
              </button>
              {bill.status !== 'paid' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <CreditCard size={16} />
                  Make Payment
                </button>
              )}
              <button
                onClick={() => navigate(`/purchases/bills/${id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                {showActionMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <Copy size={16} /> Duplicate Bill
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4 border-b -mb-4">
            {['details', 'payments', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 px-1 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vendor Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  Vendor Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Vendor Name</p>
                    <p className="font-medium text-gray-900">{bill.vendor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{bill.vendor_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{bill.vendor_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{bill.vendor_address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    Bill Items ({bill.line_items.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Tax</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bill.line_items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{item.item_name}</p>
                            {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-6 py-4 text-right text-gray-500">{item.tax_rate ? `${item.tax_rate}%` : '-'}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Bill Summary */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Bill Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(bill.subtotal)}</span>
                  </div>
                  {bill.tax_amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax (GST)</span>
                      <span className="text-gray-900">{formatCurrency(bill.tax_amount)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(bill.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>{formatCurrency(bill.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-orange-600 text-lg">
                    <span>Balance Due</span>
                    <span>{formatCurrency(bill.balance_due)}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-purple-600" />
                  Important Dates
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Bill Date</p>
                    <p className="font-medium text-gray-900">{formatDate(bill.bill_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className={`font-medium ${daysUntilDue < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(bill.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {bill.balance_due > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 justify-center font-medium">
                    <CreditCard size={18} /> Make Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              {bill.balance_due > 0 && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <CreditCard size={16} />
                  Make Payment
                </button>
              )}
            </div>
            {bill.payment_history && bill.payment_history.length > 0 ? (
              <div className="divide-y">
                {bill.payment_history.map((payment) => (
                  <div key={payment.id} className="p-6 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">{payment.method} • {payment.reference}</p>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No payments recorded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Log</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {[
                  { date: bill.created_at, title: 'Bill Created', description: 'Bill was recorded in the system', icon: <FileText size={16} />, color: 'bg-blue-500' },
                  { date: bill.payment_history?.[0]?.date || bill.created_at, title: 'Payment Recorded', description: `Payment of ${formatCurrency(bill.payment_history?.[0]?.amount || 0)} received`, icon: <CreditCard size={16} />, color: 'bg-green-500' },
                ].map((event, index) => (
                  <div key={index} className="relative flex gap-4 pl-10">
                    <div className={`absolute left-2 w-5 h-5 rounded-full ${event.color} flex items-center justify-center text-white`}>
                      {event.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-500">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillDetailPage;
