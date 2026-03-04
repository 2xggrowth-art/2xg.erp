import React, { useState } from 'react';
import { Search, RotateCcw, Check, X, Package } from 'lucide-react';
import { invoicesService, Invoice } from '../../services/invoices.service';
import { creditNotesService, CreditNoteItem } from '../../services/credit-notes.service';

interface ReturnItem {
  item_id: string;
  item_name: string;
  original_quantity: number;
  return_quantity: number;
  rate: number;
  selected: boolean;
  reason: string;
}

interface ReturnTabProps {
  activeSessionId?: string;
  onReturnComplete?: () => void;
}

const ReturnTab: React.FC<ReturnTabProps> = ({ activeSessionId, onReturnComplete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ creditNoteNumber: string; amount: number } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    setInvoice(null);
    setReturnItems([]);
    setSuccess(null);

    try {
      // Search by invoice number - get all and find match
      const result = await invoicesService.getAllInvoices({ status: undefined });
      if (result.success && result.data?.invoices) {
        const found = result.data.invoices.find(
          (inv: Invoice) => inv.invoice_number.toLowerCase() === searchQuery.trim().toLowerCase()
        );
        if (found) {
          // Fetch full invoice with items
          const fullResult = await invoicesService.getInvoiceById(found.id);
          if (fullResult.success && fullResult.data) {
            const fullInvoice = fullResult.data as Invoice;
            setInvoice(fullInvoice);
            setReturnItems(
              (fullInvoice.items || []).map((item) => ({
                item_id: item.item_id,
                item_name: item.item_name,
                original_quantity: item.quantity,
                return_quantity: 0,
                rate: item.rate,
                selected: false,
                reason: '',
              }))
            );
          } else {
            setError('Could not load invoice details.');
          }
        } else {
          setError(`No invoice found with number "${searchQuery.trim()}"`);
        }
      } else {
        setError('Failed to search invoices.');
      }
    } catch (err) {
      setError('An error occurred while searching.');
      console.error('Return search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleItem = (index: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              selected: !item.selected,
              return_quantity: !item.selected ? item.original_quantity : 0,
            }
          : item
      )
    );
  };

  const updateReturnQuantity = (index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, return_quantity: Math.min(Math.max(0, qty), item.original_quantity) }
          : item
      )
    );
  };

  const updateReason = (index: number, reason: string) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, reason } : item))
    );
  };

  const selectedItems = returnItems.filter((item) => item.selected && item.return_quantity > 0);
  const refundAmount = selectedItems.reduce((sum, item) => sum + item.rate * item.return_quantity, 0);

  const handleProcessReturn = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const creditNoteItems: CreditNoteItem[] = selectedItems.map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: item.return_quantity,
        rate: item.rate,
        amount: item.rate * item.return_quantity,
        reason: item.reason || undefined,
      }));

      const reason = returnType === 'refund' ? 'Customer return - refund' : 'Customer return - exchange';

      const response = await creditNotesService.create({
        invoice_id: invoice?.id,
        invoice_number: invoice?.invoice_number,
        customer_id: invoice?.customer_id,
        customer_name: invoice?.customer_name,
        reason: activeSessionId ? `${reason} (Session: ${activeSessionId})` : reason,
        items: creditNoteItems,
      });

      const creditNote = response.data?.data || response.data;
      setSuccess({
        creditNoteNumber: creditNote?.credit_note_number || 'CN-CREATED',
        amount: refundAmount,
      });
      onReturnComplete?.();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to process return.');
      console.error('Process return error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setInvoice(null);
    setReturnItems([]);
    setReturnType('refund');
    setError('');
    setSuccess(null);
  };

  // Success state
  if (success) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Return Processed</h3>
            <p className="text-sm text-gray-600 mb-1">
              Credit Note: <span className="font-semibold text-blue-600">{success.creditNoteNumber}</span>
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Refund Amount:{' '}
              <span className="font-semibold text-green-600">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(success.amount)}
              </span>
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Process Another Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Returns & Exchanges</h2>
        <p className="text-sm text-gray-500 mt-1">Search for an invoice to process a return or exchange</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter invoice number (e.g. INV-0001)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {searching ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!invoice && !error && !searching && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <RotateCcw className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">Search for an invoice to process a return</p>
            <p className="text-sm mt-1">Enter the invoice number above to get started</p>
          </div>
        </div>
      )}

      {/* Invoice Found - Return Form */}
      {invoice && (
        <div className="space-y-4">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Invoice Details</h3>
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X size={12} />
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Invoice #</span>
                <p className="font-medium text-blue-600">{invoice.invoice_number}</p>
              </div>
              <div>
                <span className="text-gray-500">Customer</span>
                <p className="font-medium text-gray-800">{invoice.customer_name || 'Walk-in'}</p>
              </div>
              <div>
                <span className="text-gray-500">Date</span>
                <p className="font-medium text-gray-800">
                  {new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total</span>
                <p className="font-medium text-gray-800">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(invoice.total_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Return Type Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Return Type</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setReturnType('refund')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  returnType === 'refund'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Refund (Cash)
              </button>
              <button
                onClick={() => setReturnType('exchange')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  returnType === 'exchange'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Exchange
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">Select Items to Return</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Orig Qty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Return Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Refund
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returnItems.map((item, index) => (
                  <tr
                    key={item.item_id}
                    className={`transition-colors ${item.selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItem(index)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {item.item_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {item.original_quantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.original_quantity}
                        value={item.return_quantity}
                        onChange={(e) => updateReturnQuantity(index, parseInt(e.target.value) || 0)}
                        disabled={!item.selected}
                        className="w-20 text-center py-1 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(item.rate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {item.selected && item.return_quantity > 0 ? (
                        <span className="text-green-600">
                          {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(item.rate * item.return_quantity)}
                        </span>
                      ) : (
                        <span className="text-gray-400">0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateReason(index, e.target.value)}
                        disabled={!item.selected}
                        placeholder="Reason..."
                        className="w-full py-1 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Refund Summary & Action */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">
                  {selectedItems.length} item(s) selected for return
                </div>
                <div className="text-2xl font-bold text-gray-800 mt-1">
                  Refund:{' '}
                  <span className="text-green-600">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(refundAmount)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleProcessReturn}
                disabled={loading || selectedItems.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Package size={16} />
                )}
                Process Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnTab;
