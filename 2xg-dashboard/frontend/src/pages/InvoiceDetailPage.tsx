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
  User,
  Package,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Share2,
  CreditCard,
  Send
} from 'lucide-react';
import { invoicesService } from '../services/invoices.service';
import { downloadInvoicePDF, printInvoicePDF, InvoicePDFData } from '../utils/pdfGenerators/invoicePDF';

interface LineItem {
  id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  sales_order_number?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: string;
  shipping_address?: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  shipping_charges?: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
  terms_conditions?: string;
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

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'activity'>('details');
  const [showActionMenu, setShowActionMenu] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await invoicesService.getInvoiceById(id!);
      if (response.success && response.data) {
        const backendData = response.data;
        // Map backend data to frontend Invoice interface
        const mappedInvoice: Invoice = {
          ...backendData,
          line_items: (backendData.items || []).map((item: any) => ({
            id: item.id || item.item_id || Math.random().toString(), // Fallback ID
            item_name: item.item_name,
            sku: item.sku || '', // Backend might not return SKU in items
            quantity: item.quantity,
            unit_price: item.rate,
            discount: item.discount || 0,
            tax_rate: item.tax_rate || 0,
            total: item.amount
          }))
        };
        setInvoice(mappedInvoice);
      } else {
        console.error('Failed to fetch invoice:', response.message);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <FileText size={16} />, label: 'Draft' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Send size={16} />, label: 'Sent' },
      viewed: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <CheckCircle size={16} />, label: 'Viewed' },
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
    if (!invoice) return 0;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesService.deleteInvoice(id!);
        navigate('/sales/invoices');
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  // Transform invoice data to PDF format
  const transformInvoiceToPDFData = (inv: Invoice): InvoicePDFData => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    sales_order_number: inv.sales_order_number,
    customer_name: inv.customer_name,
    customer_email: inv.customer_email,
    customer_phone: inv.customer_phone,
    billing_address: inv.billing_address,
    shipping_address: inv.shipping_address,
    invoice_date: inv.invoice_date,
    due_date: inv.due_date,
    payment_terms: 'Due on Receipt',
    status: inv.status,
    subtotal: inv.subtotal,
    tax_amount: inv.tax_amount,
    discount_amount: inv.discount_amount,
    shipping_charges: inv.shipping_charges,
    total_amount: inv.total_amount,
    amount_paid: inv.amount_paid,
    balance_due: inv.balance_due,
    notes: inv.notes,
    terms_conditions: inv.terms_conditions,
    line_items: inv.line_items.map(item => ({
      item_name: item.item_name,
      sku: item.sku,
      hsn_code: item.sku, // Use SKU as HSN code placeholder
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      tax_rate: item.tax_rate,
      total: item.total
    }))
  });

  const handlePrint = () => {
    if (invoice) {
      const pdfData = transformInvoiceToPDFData(invoice);
      printInvoicePDF(pdfData);
    }
  };

  const handleDownload = () => {
    if (invoice) {
      const pdfData = transformInvoiceToPDFData(invoice);
      downloadInvoicePDF(pdfData);
    }
  };

  const handleEmail = async () => {
    if (invoice) {
      try {
        // Open mailto with invoice details
        const subject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
        const body = encodeURIComponent(
          `Dear ${invoice.customer_name},\n\n` +
          `Please find attached Invoice ${invoice.invoice_number}.\n\n` +
          `Invoice Amount: ₹${invoice.total_amount.toLocaleString('en-IN')}\n` +
          `Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}\n\n` +
          `Thank you for your business!\n\n` +
          `Best regards,\n2XG Business Suite`
        );
        window.open(`mailto:${invoice.customer_email || ''}?subject=${subject}&body=${body}`);
      } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to open email client');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Invoice not found</h2>
          <button
            onClick={() => navigate('/sales/invoices')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/sales/invoices')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                  {daysUntilDue > 0 && invoice.status !== 'paid' && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                      Due in {daysUntilDue} days
                    </span>
                  )}
                  {daysUntilDue < 0 && invoice.status !== 'paid' && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                      {Math.abs(daysUntilDue)} days overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {invoice.sales_order_number && `From ${invoice.sales_order_number} • `}
                  Created on {formatDate(invoice.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print"
              >
                <Printer size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleEmail}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Send Email"
              >
                <Mail size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download size={20} className="text-gray-600" />
              </button>
              {invoice.status !== 'paid' && (
                <button
                  onClick={() => navigate('/sales/payment-received/new', { state: { invoice } })}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  {invoice.status === 'partial' || invoice.status === 'partially_paid' ? 'Pay Remaining Amount' : 'Record Payment'}
                </button>
              )}
              <button
                onClick={() => navigate(`/sales/invoices/${id}/edit`)}
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
                      <Copy size={16} /> Duplicate Invoice
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <Send size={16} /> Send Reminder
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <Share2 size={16} /> Share Link
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
                className={`pb-4 px-1 font-medium capitalize transition-colors ${activeTab === tab
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
              {/* Customer Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Bill To
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-medium text-gray-900">{invoice.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{invoice.customer_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Billing Address</p>
                    <p className="font-medium text-gray-900">{invoice.billing_address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shipping Address</p>
                    <p className="font-medium text-gray-900">{invoice.shipping_address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    Invoice Items ({invoice.line_items.length})
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
                      {invoice.line_items.map((item, index) => (
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
              {/* Invoice Summary */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Invoice Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount_amount && invoice.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-green-600">-{formatCurrency(invoice.discount_amount)}</span>
                    </div>
                  )}
                  {invoice.tax_amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax (GST)</span>
                      <span className="text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-orange-600 text-lg">
                    <span>Balance Due</span>
                    <span>{formatCurrency(invoice.balance_due)}</span>
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
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className={`font-medium ${daysUntilDue < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              {invoice.balance_due > 0 && (
                <button
                  onClick={() => navigate('/sales/payment-received/new', { state: { invoice } })}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  Record Payment
                </button>
              )}
            </div>
            {invoice.payment_history && invoice.payment_history.length > 0 ? (
              <div className="divide-y">
                {invoice.payment_history.map((payment) => (
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
                  { date: invoice.created_at, title: 'Invoice Created', description: 'Invoice was created', icon: <FileText size={16} />, color: 'bg-blue-500' },
                  { date: invoice.created_at, title: 'Invoice Sent', description: 'Invoice was sent to customer via email', icon: <Send size={16} />, color: 'bg-green-500' },
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

export default InvoiceDetailPage;
