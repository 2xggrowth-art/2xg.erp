import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Printer,
  Download,
  Calendar,
  User,
  CreditCard,
  Hash,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Building2
} from 'lucide-react';
import { paymentsReceivedService, PaymentReceived } from '../services/payments-received.service';

const PaymentReceivedDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentReceived | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentDetails();
  }, [id]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentsReceivedService.getPaymentReceivedById(id!);
      if (response.success && response.data) {
        setPayment(response.data);
      } else {
        console.error('Failed to fetch payment:', response.message);
        setPayment(null);
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={16} />, label: 'Completed' },
      pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock size={16} />, label: 'Pending' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={16} />, label: 'Failed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <XCircle size={16} />, label: 'Cancelled' },
    };
    return configs[status.toLowerCase()] || configs.completed;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        const response = await paymentsReceivedService.deletePaymentReceived(id!);
        if (response.success) {
          navigate('/sales/payment-received');
        } else {
          alert('Failed to delete payment: ' + response.message);
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment');
      }
    }
  };

  const handleEdit = () => {
    navigate(`/sales/payment-received/${id}/edit`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const printContent = document.getElementById('payment-content');
    if (!printContent) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment - ${payment?.payment_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; margin-bottom: 10px; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #2563eb; text-transform: uppercase; }
            .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { width: 200px; font-weight: 600; color: #6b7280; }
            .detail-value { flex: 1; color: #111827; }
            .amount-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .amount-label { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
            .amount-value { font-size: 28px; font-weight: bold; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <p style="font-size: 18px; color: #6b7280;">${payment?.payment_number}</p>
          </div>

          <div class="section">
            <div class="section-title">Payment Information</div>
            <div class="detail-row">
              <div class="detail-label">Payment Date:</div>
              <div class="detail-value">${formatDate(payment?.payment_date || '')}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Payment Number:</div>
              <div class="detail-value">${payment?.payment_number}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Payment Mode:</div>
              <div class="detail-value">${payment?.payment_mode}</div>
            </div>
            ${payment?.reference_number ? `
              <div class="detail-row">
                <div class="detail-label">Reference Number:</div>
                <div class="detail-value">${payment.reference_number}</div>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="detail-row">
              <div class="detail-label">Customer Name:</div>
              <div class="detail-value">${payment?.customer_name}</div>
            </div>
          </div>

          ${payment?.deposit_to ? `
            <div class="section">
              <div class="section-title">Banking Details</div>
              <div class="detail-row">
                <div class="detail-label">Deposit To:</div>
                <div class="detail-value">${payment.deposit_to}</div>
              </div>
              ${payment?.bank_charges ? `
                <div class="detail-row">
                  <div class="detail-label">Bank Charges:</div>
                  <div class="detail-value">${formatCurrency(payment.bank_charges)}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${payment?.notes ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <div style="padding: 15px; background: #f9fafb; border-radius: 8px;">
                ${payment.notes}
              </div>
            </div>
          ` : ''}

          <div class="amount-box">
            <div class="amount-label">Total Amount Received</div>
            <div class="amount-value">${formatCurrency(payment?.amount_received || 0)}</div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-${payment?.payment_number}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading payment details...</div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Payment not found</div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.status || 'completed');

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sales/payment-received')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-800">{payment.payment_number}</h1>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-slate-600 mt-1">Payment Receipt Details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit size={16} />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Payment Content */}
        <div id="payment-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Payment Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                  <Calendar size={18} className="text-slate-400" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Payment Date</div>
                    <div className="text-sm font-medium text-slate-800">{formatDate(payment.payment_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                  <Hash size={18} className="text-slate-400" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Payment Number</div>
                    <div className="text-sm font-medium text-slate-800">{payment.payment_number}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                  <CreditCard size={18} className="text-slate-400" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Payment Mode</div>
                    <div className="text-sm font-medium text-slate-800">{payment.payment_mode}</div>
                  </div>
                </div>
                {payment.reference_number && (
                  <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                    <Hash size={18} className="text-slate-400" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-500">Reference Number</div>
                      <div className="text-sm font-medium text-slate-800">{payment.reference_number}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                  <User size={18} className="text-slate-400" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Customer Name</div>
                    <div className="text-sm font-medium text-slate-800">{payment.customer_name}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Banking Details Card */}
            {(payment.deposit_to || payment.bank_charges) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  Banking Details
                </h2>
                <div className="space-y-3">
                  {payment.deposit_to && (
                    <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                      <Building2 size={18} className="text-slate-400" />
                      <div className="flex-1">
                        <div className="text-xs text-slate-500">Deposit To</div>
                        <div className="text-sm font-medium text-slate-800">{payment.deposit_to}</div>
                      </div>
                    </div>
                  )}
                  {payment.bank_charges && payment.bank_charges > 0 && (
                    <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                      <DollarSign size={18} className="text-slate-400" />
                      <div className="flex-1">
                        <div className="text-xs text-slate-500">Bank Charges</div>
                        <div className="text-sm font-medium text-slate-800">{formatCurrency(payment.bank_charges)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Card */}
            {payment.notes && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Notes
                </h2>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{payment.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Amount Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
              <h2 className="text-sm font-medium text-blue-900 mb-2">Total Amount Received</h2>
              <div className="text-3xl font-bold text-blue-700 mb-4">
                {formatCurrency(payment.amount_received)}
              </div>

              {payment.bank_charges && payment.bank_charges > 0 && (
                <>
                  <div className="border-t border-blue-200 pt-4 mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-blue-800">Amount Received:</span>
                      <span className="font-medium text-blue-900">{formatCurrency(payment.amount_received)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-800">Bank Charges:</span>
                      <span className="font-medium text-blue-900">{formatCurrency(payment.bank_charges)}</span>
                    </div>
                  </div>
                  <div className="border-t border-blue-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-blue-900">Net Amount:</span>
                      <span className="text-lg font-bold text-blue-700">
                        {formatCurrency(payment.amount_received - payment.bank_charges)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Info</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Payment Mode</span>
                  <span className="text-sm font-medium text-slate-800">{payment.payment_mode}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600">Payment Date</span>
                  <span className="text-sm font-medium text-slate-800">{formatDate(payment.payment_date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceivedDetailPage;
