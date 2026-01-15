import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, ArrowRightLeft } from 'lucide-react';
import { transferOrdersService, TransferOrder } from '../services/transfer-orders.service';
import { useNavigate } from 'react-router-dom';

const TransferOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const response = await transferOrdersService.getAllTransferOrders(filters);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching transfer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchOrders();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transfer order?')) {
      try {
        await transferOrdersService.deleteTransferOrder(id);
        fetchOrders();
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
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transfer Orders</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage stock movements between locations
            </p>
          </div>
          <button
            onClick={() => navigate('/inventory/transfer-orders/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by transfer order number or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="initiated">Initiated</option>
            <option value="in_transit">In Transit</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} className="text-gray-600" />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading transfer orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ArrowRightLeft size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No transfer orders yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create transfer orders to move stock between locations
            </p>
            <button
              onClick={() => navigate('/inventory/transfer-orders/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Transfer Order
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer Order#
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.transfer_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {order.transfer_order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.source_location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.destination_location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {order.total_items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {order.total_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/inventory/transfer-orders/${order.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/inventory/transfer-orders/edit/${order.id}`)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferOrdersPage;
