import { useState, useEffect } from 'react';
import { FileEdit, Send, CheckCircle, Package, Truck, ClipboardCheck, Plus, Search, Filter, Trash2, Download, Eye, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProcessFlow from '../components/common/ProcessFlow';
import { purchaseOrdersService, PurchaseOrder } from '../services/purchase-orders.service';

const PurchaseOrderPage = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await purchaseOrdersService.deletePurchaseOrder(id);
        fetchPurchaseOrders();
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        alert('Failed to delete purchase order');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one purchase order to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} purchase order(s)?`)) {
      try {
        await Promise.all(selectedOrders.map(id => purchaseOrdersService.deletePurchaseOrder(id)));
        setSelectedOrders([]);
        fetchPurchaseOrders();
      } catch (error) {
        console.error('Error deleting purchase orders:', error);
        alert('Failed to delete some purchase orders');
      }
    }
  };

  const handleExportPDF = () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one purchase order to export');
      return;
    }

    const selectedPOsData = purchaseOrders.filter(po => selectedOrders.includes(po.id));

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Orders Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { margin-bottom: 30px; }
            .status { padding: 4px 8px; border-radius: 4px; display: inline-block; }
            .status-draft { background-color: #f1f5f9; color: #475569; }
            .status-issued { background-color: #dbeafe; color: #1e40af; }
            .status-received { background-color: #d1fae5; color: #065f46; }
            .status-billed { background-color: #e9d5ff; color: #6b21a8; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Orders Report</h1>
            <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
            <p>Total Orders: ${selectedPOsData.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Expected Delivery</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${selectedPOsData.map(po => `
                <tr>
                  <td>${po.po_number}</td>
                  <td>${formatDate(po.order_date)}</td>
                  <td>${po.supplier_name || po.supplier_id}</td>
                  <td><span class="status status-${po.status}">${po.status.toUpperCase()}</span></td>
                  <td>${po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '-'}</td>
                  <td>${formatCurrency(po.total_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchase-orders-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(purchaseOrders.map(po => po.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

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
          <div className="flex items-center gap-3">
            {selectedOrders.length > 0 && (
              <>
                <div className="text-sm text-slate-600 mr-2">
                  {selectedOrders.length} selected
                </div>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Delete</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={18} />
                  <span>Export</span>
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/purchase-orders/new')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              <span className="font-medium">New PO</span>
            </button>
          </div>
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
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === purchaseOrders.length && purchaseOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">PO Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Vendor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Expected Delivery</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        Loading purchase orders...
                      </td>
                    </tr>
                  ) : filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(po.id)}
                            onChange={() => handleSelectOrder(po.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{po.po_number}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-800">
                          {po.supplier_name || po.supplier_id}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/purchase-orders/${po.id}`)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                              className="text-slate-600 hover:text-slate-800"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(po.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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
