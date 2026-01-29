import { useState, useEffect } from 'react';
import { Plus, Filter, Download, Printer, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentsReceivedService, PaymentReceived } from '../services/payments-received.service';
import BulkActionBar, {
  createBulkDeleteAction,
  createBulkExportAction,
  createBulkPrintAction
} from '../components/common/BulkActionBar';

const PaymentsReceivedPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [filterPaymentMode]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const filters = filterPaymentMode !== 'all' ? { payment_mode: filterPaymentMode } : {};
      const response = await paymentsReceivedService.getAllPaymentsReceived(filters);

      if (response.success && response.data) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(payment => payment.id!));
    }
  };

  const handleViewPayment = (paymentId: string) => {
    navigate(`/sales/payment-received/${paymentId}`);
  };

  const handleEditPayment = (paymentId: string) => {
    navigate(`/sales/payment-received/${paymentId}/edit`);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentsReceivedService.deletePaymentReceived(paymentId);
        fetchPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment');
      }
    }
  };

  const clearSelection = () => {
    setSelectedPayments([]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedPayments.length} payment(s)?`)) {
      try {
        await Promise.all(
          selectedPayments.map(id => paymentsReceivedService.deletePaymentReceived(id))
        );
        clearSelection();
        fetchPayments();
      } catch (error) {
        console.error('Error deleting payments:', error);
        alert('Failed to delete some payments');
      }
    }
  };

  const handleBulkExport = () => {
    const selectedPaymentData = payments.filter(p => selectedPayments.includes(p.id!));

    const csv = [
      ['Date', 'Payment Number', 'Customer Name', 'Payment Mode', 'Reference Number', 'Amount'].join(','),
      ...selectedPaymentData.map(payment => [
        formatDate(payment.payment_date),
        payment.payment_number,
        payment.customer_name,
        payment.payment_mode,
        payment.reference_number || '',
        payment.amount_received.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-received-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkPrint = () => {
    window.print();
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

  const getPaymentModeBadge = (mode: string) => {
    const modeMap: Record<string, { bg: string; text: string }> = {
      cash: { bg: 'bg-green-100', text: 'text-green-700' },
      upi: { bg: 'bg-blue-100', text: 'text-blue-700' },
      'bank transfer': { bg: 'bg-purple-100', text: 'text-purple-700' },
      cheque: { bg: 'bg-orange-100', text: 'text-orange-700' },
      card: { bg: 'bg-pink-100', text: 'text-pink-700' },
    };

    const style = modeMap[mode.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-700' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {mode}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading payments...</div>
        </div>
      </div>
    );
  }

  if (payments.length === 0 && filterPaymentMode === 'all') {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Payments Received</h1>
              <p className="text-slate-600 mt-2">
                Record and track customer payments
              </p>
            </div>
            <button
              onClick={() => navigate('/sales/payment-received/new')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              <span className="font-medium">New Payment</span>
            </button>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Start Recording Payments
            </h2>
            <p className="text-slate-600 mb-6">
              Record customer payments, track payment modes, and manage your cash flow.
            </p>
            <button
              onClick={() => navigate('/sales/payment-received/new')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              RECORD PAYMENT
            </button>
          </div>
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
            <h1 className="text-3xl font-bold text-slate-800">All Payments Received</h1>
            <p className="text-slate-600 mt-1">
              {payments.length} payment{payments.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            onClick={() => navigate('/sales/payment-received/new')}
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
                value={filterPaymentMode}
                onChange={(e) => setFilterPaymentMode(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="HDFC (Hub)">HDFC (Hub)</option>
                <option value="ICICI">ICICI</option>
                <option value="Dhanalakhmi">Dhanalakhmi</option>
                <option value="HDFC (Center)">HDFC (Center)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Printer size={18} />
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPayments.length === payments.length && payments.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">PAYMENT#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">REFERENCE#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">CUSTOMER NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">MODE</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">AMOUNT</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleViewPayment(payment.id!)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id!)}
                        onChange={() => handleSelectPayment(payment.id!)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        {payment.payment_number}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {payment.reference_number || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 font-medium">
                      {payment.customer_name}
                    </td>
                    <td className="px-4 py-4">
                      {getPaymentModeBadge(payment.payment_mode)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 text-right font-medium">
                      {formatCurrency(payment.amount_received)}
                    </td>
                    <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === payment.id ? null : payment.id!)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showActionMenu === payment.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                            <button
                              onClick={() => {
                                handleViewPayment(payment.id!);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              onClick={() => {
                                handleEditPayment(payment.id!);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                handleDeletePayment(payment.id!);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Total Payments</div>
            <div className="text-2xl font-bold text-slate-800">{payments.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount_received, 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">This Month</div>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter(p => {
                const paymentDate = new Date(p.payment_date);
                const now = new Date();
                return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedPayments.length}
        totalCount={payments.length}
        onClearSelection={clearSelection}
        onSelectAll={handleSelectAll}
        actions={[
          createBulkDeleteAction(handleBulkDelete),
          createBulkExportAction(handleBulkExport),
          createBulkPrintAction(handleBulkPrint)
        ]}
        entityName="payments"
      />
    </div>
  );
};

export default PaymentsReceivedPage;
