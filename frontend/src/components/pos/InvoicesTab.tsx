import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { invoicesService, Invoice } from '../../services/invoices.service';

interface InvoicesTabProps {
  sessionId?: string;
}

const InvoicesTab: React.FC<InvoicesTabProps> = ({ sessionId }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await invoicesService.getAllInvoices({ pos_session_id: sessionId });
        if (result.success && result.data?.invoices) {
          setInvoices(result.data.invoices);
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [sessionId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Session Invoices</h2>
        <p className="text-sm text-gray-500 mt-1">Invoices created during this POS session</p>
      </div>

      {!sessionId ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No active session</p>
            <p className="text-sm mt-1">Start a POS session to view invoices</p>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No invoices yet</p>
            <p className="text-sm mt-1">Invoices will appear here as you make sales</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {invoice.customer_name || 'Walk-in'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-center">
                    {invoice.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.payment_status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.payment_status === 'Partially Paid'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {invoice.payment_status || invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">
                    {invoice.created_at
                      ? new Date(invoice.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-semibold text-gray-800">
              Total: {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;
