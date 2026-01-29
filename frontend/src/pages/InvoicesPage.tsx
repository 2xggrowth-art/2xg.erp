import { useState, useEffect } from 'react';
import { FileText, Send, Eye, CreditCard, CheckCircle, Plus, Filter, Download, Mail, Printer, MoreVertical, Edit, Trash2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProcessFlow from '../components/common/ProcessFlow';
import { invoicesService } from '../services/invoices.service';
import BulkActionBar, { createBulkDeleteAction, createBulkExportAction, createBulkPrintAction, createBulkEmailAction } from '../components/common/BulkActionBar';

interface Invoice {
  id: string;
  invoice_number: string;
  order_number?: string;
  invoice_date: string;
  due_date?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  status: string;
  payment_status?: string;
  total_amount: number;
  balance_due: number;
  subtotal?: number;
  tax_amount?: number;
  items?: any[];
}

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const invoiceSteps = [
    {
      icon: FileText,
      title: 'Create Invoice',
      description: 'Generate invoice from sales order',
    },
    {
      icon: Send,
      title: 'Send to Customer',
      description: 'Email invoice to customer',
    },
    {
      icon: Eye,
      title: 'Customer Views',
      description: 'Customer reviews invoice details',
    },
    {
      icon: CreditCard,
      title: 'Payment Received',
      description: 'Customer makes payment',
      status: 'success' as const,
    },
    {
      icon: CheckCircle,
      title: 'Invoice Closed',
      description: 'Invoice marked as paid and closed',
      status: 'success' as const,
    },
  ];

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await invoicesService.getAllInvoices(filters);

      if (response.success && response.data) {
        setInvoices(response.data.invoices || response.data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(inv => inv.id));
    }
  };

  const clearSelection = () => {
    setSelectedInvoices([]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`)) {
      try {
        await Promise.all(selectedInvoices.map(id => invoicesService.deleteInvoice(id)));
        setSelectedInvoices([]);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoices:', error);
        alert('Failed to delete some invoices. Please try again.');
      }
    }
  };

  const handleBulkExport = () => {
    const selectedData = invoices.filter(invoice => selectedInvoices.includes(invoice.id));
    const csv = [
      ['Date', 'Invoice#', 'Order#', 'Customer Name', 'Status', 'Due Date', 'Amount', 'Balance Due'].join(','),
      ...selectedData.map(invoice => [
        invoice.invoice_date,
        invoice.invoice_number,
        invoice.order_number || '',
        invoice.customer_name,
        invoice.status,
        invoice.due_date || '',
        invoice.total_amount.toString(),
        invoice.balance_due.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleBulkPrint = () => {
    window.print();
  };

  const handleBulkEmail = () => {
    alert(`Sending ${selectedInvoices.length} invoice(s) via email...`);
  };

  const bulkActions = [
    createBulkEmailAction(handleBulkEmail),
    createBulkExportAction(handleBulkExport),
    createBulkPrintAction(handleBulkPrint),
    createBulkDeleteAction(handleBulkDelete)
  ];

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/sales/invoices/${invoiceId}`);
  };

  const handleEditInvoice = (invoiceId: string) => {
    navigate(`/sales/invoices/${invoiceId}/edit`);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesService.deleteInvoice(invoiceId);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    const statusLower = status.toLowerCase();
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sent' },
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      partially_paid: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Partially Paid' },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
    };

    const style = statusMap[statusLower] || statusMap.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus?: string, balanceDue?: number) => {
    if (!paymentStatus) return null;

    const statusMap: Record<string, { bg: string; text: string }> = {
      'Paid': { bg: 'bg-green-100', text: 'text-green-700' },
      'Partially Paid': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'Unpaid': { bg: 'bg-red-100', text: 'text-red-700' },
    };

    const style = statusMap[paymentStatus] || statusMap['Unpaid'];

    return (
      <div className="flex flex-col gap-1">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
          {paymentStatus}
        </span>
        {paymentStatus === 'Partially Paid' && balanceDue && balanceDue > 0 && (
          <span className="text-xs text-orange-600 font-medium">
            Credit Sale Pending
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading invoices...</div>
        </div>
      </div>
    );
  }

  if (invoices.length === 0 && filterStatus === 'all') {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
              <p className="text-slate-600 mt-2">
                Create, send, and track customer invoices.
              </p>
            </div>
            <button
              onClick={() => navigate('/sales/invoices/new')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              <span className="font-medium">New Invoice</span>
            </button>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Start Creating Invoices
            </h2>
            <p className="text-slate-600 mb-6">
              Generate invoices, send to customers, and track payments.
            </p>
            <button
              onClick={() => navigate('/sales/invoices/new')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              NEW INVOICE
            </button>
          </div>

          {/* Process Flow */}
          <ProcessFlow title="Life cycle of an Invoice" steps={invoiceSteps} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">All Invoices</h1>
            <p className="text-slate-600 mt-1">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            onClick={() => navigate('/sales/invoices/new')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            <span className="font-medium">New</span>
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid / Credit Sale</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Mail size={18} />
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Printer size={18} />
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">INVOICE#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">ORDER NUMBER</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">CUSTOMER NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">PAYMENT STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">DUE DATE</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">AMOUNT</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">BALANCE DUE</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleViewInvoice(invoice.id)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelectInvoice(invoice.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        {invoice.invoice_number}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {invoice.order_number || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 font-medium">
                      {invoice.customer_name}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(invoice.status, invoice.payment_status)}
                    </td>
                    <td className="px-4 py-4">
                      {getPaymentStatusBadge(invoice.payment_status, invoice.balance_due)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(invoice.due_date || '')}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 text-right font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 text-right font-medium">
                      {formatCurrency(invoice.balance_due)}
                    </td>
                    <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === invoice.id ? null : invoice.id)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showActionMenu === invoice.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                            <button
                              onClick={() => {
                                handleViewInvoice(invoice.id);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              onClick={() => {
                                handleEditInvoice(invoice.id);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(invoice.invoice_number);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Copy size={16} />
                              Copy Number
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                handleDeleteInvoice(invoice.id);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Total Invoices</div>
            <div className="text-2xl font-bold text-slate-800">{invoices.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Total Due</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.balance_due, 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Paid Amount</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total_amount - inv.balance_due), 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedInvoices.length > 0 && (
        <BulkActionBar
          selectedCount={selectedInvoices.length}
          totalCount={invoices.length}
          onClearSelection={clearSelection}
          onSelectAll={handleSelectAll}
          actions={bulkActions}
          entityName="invoice"
        />
      )}
    </div>
  );
};

export default InvoicesPage;
