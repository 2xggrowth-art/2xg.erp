import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Package, ArrowRight, Truck, CheckCircle, XCircle, PlayCircle, Paperclip, FileText, Image, ExternalLink } from 'lucide-react';
import { transferOrdersService, TransferOrder } from '../services/transfer-orders.service';

const TransferOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<TransferOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await transferOrdersService.getTransferOrderById(id!);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error('Error fetching transfer order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, confirmMessage: string) => {
    if (!window.confirm(confirmMessage)) return;
    try {
      setStatusUpdating(true);
      const response = await transferOrdersService.updateTransferOrderStatus(id!, newStatus);
      if (response.success) {
        setOrder(response.data);
        // Re-fetch to get items too
        await fetchOrderDetails();
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || error.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    const hasAllocations = order?.status === 'initiated' || order?.status === 'in_transit';
    const message = hasAllocations
      ? 'This transfer order has active stock allocations. Deleting it will reverse all stock movements. Are you sure?'
      : 'Are you sure you want to delete this transfer order?';
    if (window.confirm(message)) {
      try {
        // If there are allocations, cancel first to clean up stock, then delete
        if (hasAllocations) {
          await transferOrdersService.updateTransferOrderStatus(id!, 'cancelled');
        }
        await transferOrdersService.deleteTransferOrder(id!);
        navigate('/inventory/transfer-orders');
      } catch (error) {
        console.error('Error deleting transfer order:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'initiated':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Determine which status action buttons to show
  const getStatusActions = () => {
    if (!order) return null;
    switch (order.status) {
      case 'draft':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusUpdate('initiated', 'Initiate this transfer? Stock will be allocated from the source location.')}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              {statusUpdating ? 'Processing...' : 'Initiate Transfer'}
            </button>
            <button
              onClick={() => handleStatusUpdate('cancelled', 'Cancel this transfer order?')}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </div>
        );
      case 'initiated':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusUpdate('in_transit', 'Mark this transfer as in transit?')}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              {statusUpdating ? 'Processing...' : 'Mark In Transit'}
            </button>
            <button
              onClick={() => handleStatusUpdate('cancelled', 'Cancel this transfer? Stock allocations will be reversed.')}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel Transfer
            </button>
          </div>
        );
      case 'in_transit':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusUpdate('received', 'Confirm that the items have been received at the destination?')}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {statusUpdating ? 'Processing...' : 'Mark as Received'}
            </button>
            <button
              onClick={() => handleStatusUpdate('cancelled', 'Cancel this transfer? Stock allocations will be reversed.')}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel Transfer
            </button>
          </div>
        );
      default:
        return null; // received and cancelled are terminal states
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transfer order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Order Not Found</h2>
          <button
            onClick={() => navigate('/inventory/transfer-orders')}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back to Transfer Orders
          </button>
        </div>
      </div>
    );
  }

  const isDraft = order.status === 'draft';
  const isTerminal = order.status === 'received' || order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inventory/transfer-orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {order.transfer_order_number}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Transfer Order Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
            {isDraft && (
              <button
                onClick={() => navigate(`/inventory/transfer-orders/edit/${order.id}`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {!isTerminal && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Action Bar */}
      {getStatusActions() && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {order.status === 'draft' && 'This transfer order is a draft. Initiate it to allocate stock.'}
              {order.status === 'initiated' && 'Stock has been allocated. Mark as in transit when items are dispatched.'}
              {order.status === 'in_transit' && 'Items are in transit. Mark as received when they arrive at the destination.'}
            </p>
            {getStatusActions()}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transfer Route */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer Route</h2>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">From</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{order.source_location}</p>
                </div>
                <ArrowRight className="w-8 h-8 text-gray-400 mx-4" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">To</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{order.destination_location}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.item_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.transfer_quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit_of_measurement}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            {/* Attachments */}
            {order.attachment_urls && order.attachment_urls.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments ({order.attachment_urls.length})
                </h2>
                <div className="space-y-2">
                  {order.attachment_urls.map((url: string, index: number) => {
                    const fileName = url.split('/').pop() || `File ${index + 1}`;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
                    const fullUrl = `${apiBase}${url}`;

                    return (
                      <a
                        key={index}
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                      >
                        {isImage ? (
                          <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-blue-700">
                          {fileName}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Transfer Date</p>
                    <p className="font-medium text-gray-900">{formatDate(order.transfer_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="font-medium text-gray-900">{order.total_items}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Total Quantity</p>
                    <p className="font-medium text-gray-900">{order.total_quantity}</p>
                  </div>
                </div>
                {order.reason && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reason</p>
                    <p className="font-medium text-gray-900">{order.reason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                {order.created_at && (
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</p>
                  </div>
                )}
                {order.updated_at && (
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(order.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferOrderDetailPage;
