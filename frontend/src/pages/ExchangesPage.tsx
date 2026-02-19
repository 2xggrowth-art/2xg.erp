import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, Eye, Trash2, X, ArrowRight } from 'lucide-react';
import { exchangesService, ExchangeItem, ExchangeStats } from '../services/exchanges.service';

const ExchangesPage: React.FC = () => {
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [stats, setStats] = useState<ExchangeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ExchangeItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, [statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await exchangesService.getAll(
        statusFilter ? { status: statusFilter } : undefined
      );
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await exchangesService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching exchange stats:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const response = await exchangesService.updateStatus(id, newStatus);
      if (response.success) {
        if (selectedItem?.id === id) {
          setSelectedItem({ ...selectedItem, status: newStatus as ExchangeItem['status'] });
        }
        fetchItems();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exchange item?')) return;
    try {
      const response = await exchangesService.delete(id);
      if (response.success) {
        setShowModal(false);
        setSelectedItem(null);
        fetchItems();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting exchange:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'good':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Good</span>;
      case 'ok':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">OK</span>;
      case 'bad':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Bad</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Received</span>;
      case 'listed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Listed</span>;
      case 'sold':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Sold</span>;
      default:
        return null;
    }
  };

  const nextStatus = (current: string): string | null => {
    if (current === 'received') return 'listed';
    if (current === 'listed') return 'sold';
    return null;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Items</h1>
          <p className="text-gray-500">Manage 2nd hand cycle exchanges</p>
        </div>
        <button
          onClick={() => { fetchItems(); fetchStats(); }}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-blue-600">Received</p>
            <p className="text-2xl font-bold text-blue-700">{stats.by_status.received}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-purple-600">Listed</p>
            <p className="text-2xl font-bold text-purple-700">{stats.by_status.listed}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-green-600">Sold</p>
            <p className="text-2xl font-bold text-green-700">{stats.by_status.sold}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Status:</span>
          <div className="flex gap-2">
            {['', 'received', 'listed', 'sold'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-4xl mb-4">🔄</p>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exchange Items</h3>
          <p className="text-gray-500">
            {statusFilter
              ? `No ${statusFilter} exchange items found.`
              : 'No exchange items have been recorded yet. Use the StockCount app to add items.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                    {item.invoice_reference && (
                      <div className="text-xs text-gray-500">Inv: {item.invoice_reference}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">{getConditionBadge(item.condition)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.customer_name || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {item.estimated_price != null ? `Rs. ${item.estimated_price}` : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{formatDate(item.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedItem(item); setShowModal(true); }}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {nextStatus(item.status) && (
                        <button
                          onClick={() => handleStatusChange(item.id, nextStatus(item.status)!)}
                          className="p-1.5 hover:bg-green-100 rounded text-green-600"
                          title={`Mark as ${nextStatus(item.status)}`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedItem.item_name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Received on {formatDate(selectedItem.created_at)}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Status + Condition */}
              <div className="flex items-center gap-3 mb-6">
                {getStatusBadge(selectedItem.status)}
                {getConditionBadge(selectedItem.condition)}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{selectedItem.customer_name || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Estimated Price</p>
                  <p className="font-medium text-gray-900">
                    {selectedItem.estimated_price != null ? `Rs. ${selectedItem.estimated_price}` : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Invoice Reference</p>
                  <p className="font-medium text-gray-900">{selectedItem.invoice_reference || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Received By</p>
                  <p className="font-medium text-gray-900">{selectedItem.received_by_name || '—'}</p>
                </div>
              </div>

              {/* Photo */}
              {selectedItem.photo_base64 ? (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Photo</h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedItem.photo_base64}
                      alt="Exchange item"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Photo</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 text-sm">
                    No photo attached
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedItem.notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedItem.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer — Status Actions */}
            {nextStatus(selectedItem.status) && (
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => handleStatusChange(selectedItem.id, nextStatus(selectedItem.status)!)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  Mark as {nextStatus(selectedItem.status) === 'listed' ? 'Listed' : 'Sold'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangesPage;
