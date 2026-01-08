import { useState, useEffect } from 'react';
import { FileEdit, Send, CheckCircle, Package, Truck, ClipboardCheck, Plus, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProcessFlow from '../components/common/ProcessFlow';
import { purchaseOrdersService, PurchaseOrder } from '../services/purchase-orders.service';

const PurchaseOrderPage = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const purchaseOrderSteps = [
    {
      icon: FileEdit,
      title: 'Create PO',
      description: 'Draft purchase order with items and quantities',
    },
    {
      icon: Send,
      title: 'Send to Vendor',
      description: 'Email PO to vendor for confirmation',
    },
    {
      icon: CheckCircle,
      title: 'Vendor Confirms',
      description: 'Vendor accepts and confirms the order',
      status: 'success' as const,
    },
    {
      icon: Truck,
      title: 'Items Shipped',
      description: 'Vendor ships the ordered items',
    },
    {
      icon: Package,
      title: 'Receive Items',
      description: 'Receive and verify items against PO',
    },
    {
      icon: ClipboardCheck,
      title: 'Create Bill',
      description: 'Convert PO to bill for payment',
    },
  ];

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const response = await purchaseOrdersService.getAllPurchaseOrders(filters);
      if (response.success && response.data) {
        setPurchaseOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPOs = purchaseOrders.filter(po =>
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      issued: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      billed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Purchase Orders</h1>
            <p className="text-slate-600 mt-2">
              Create and manage purchase orders with vendors.
            </p>
          </div>
          <button
            onClick={() => navigate('/purchase-orders/new')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            <span className="font-medium">New PO</span>
          </button>
        </div>

        {purchaseOrders.length === 0 && !loading ? (
          <>
            {/* Empty State */}
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Start Creating Purchase Orders
              </h2>
              <p className="text-slate-600 mb-6">
                Create POs, send to vendors, and track order fulfillment.
              </p>
              <button
                onClick={() => navigate('/purchase-orders/new')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                NEW PURCHASE ORDER
              </button>
            </div>

            {/* Process Flow */}
            <ProcessFlow title="Life cycle of a Purchase Order" steps={purchaseOrderSteps} />
          </>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by PO number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="issued">Issued</option>
                    <option value="received">Received</option>
                    <option value="billed">Billed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Purchase Orders List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">PO Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Vendor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Expected Delivery</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        Loading purchase orders...
                      </td>
                    </tr>
                  ) : filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map((po) => (
                      <tr
                        key={po.id}
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{po.po_number}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-800">
                          {po.supplier_id}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(po.status)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {po.expected_delivery_date
                            ? new Date(po.expected_delivery_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-800">
                          ₹{po.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Process Flow */}
            <ProcessFlow title="Life cycle of a Purchase Order" steps={purchaseOrderSteps} />
          </>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderPage;
