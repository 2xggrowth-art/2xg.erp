import { useState, useEffect } from 'react';
import { FileText, Package, Truck, CheckCircle, Plus, Filter, Download, Mail, Printer, MoreVertical, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProcessFlow from '../components/common/ProcessFlow';
import { salesOrdersService, SalesOrder } from '../services/sales-orders.service';
import BulkActionBar, { createBulkDeleteAction, createBulkExportAction, createBulkPrintAction, createBulkInvoiceAction } from '../components/common/BulkActionBar';

const SalesOrdersPage = () => {
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const salesOrderSteps = [
    {
      icon: FileText,
      title: 'Create Sales Order',
      description: 'Generate order from customer request',
    },
    {
      icon: CheckCircle,
      title: 'Confirm Order',
      description: 'Review and confirm order details',
    },
    {
      icon: Package,
      title: 'Pack Items',
      description: 'Prepare items for shipment',
    },
    {
      icon: Truck,
      title: 'Ship Order',
      description: 'Dispatch order to customer',
      status: 'success' as const,
    },
    {
      icon: CheckCircle,
      title: 'Order Fulfilled',
      description: 'Order completed and closed',
      status: 'success' as const,
    },
  ];

  useEffect(() => {
    fetchSalesOrders();
  }, [filterStatus]);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await salesOrdersService.getAllSalesOrders(filters);

      if (response.success && response.data) {
        setSalesOrders(response.data.salesOrders || []);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === salesOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(salesOrders.map(order => order.id!));
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/sales/sales-orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/sales/sales-orders/${orderId}/edit`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await salesOrdersService.deleteSalesOrder(orderId);
        fetchSalesOrders();
      } catch (error) {
        console.error('Error deleting sales order:', error);
        alert('Failed to delete sales order');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} sales order(s)?`)) {
      try {
        await Promise.all(selectedOrders.map(id => salesOrdersService.deleteSalesOrder(id)));
        setSelectedOrders([]);
        fetchSalesOrders();
      } catch (error) {
        console.error('Error deleting sales orders:', error);
        alert('Failed to delete some sales orders');
      }
    }
  };

  const handleBulkExport = () => {
    const selectedData = salesOrders.filter(order => selectedOrders.includes(order.id!));
    const csv = [
      ['Order Number', 'Date', 'Customer', 'Status', 'Amount'].join(','),
      ...selectedData.map(order => [
        order.sales_order_number,
        formatDate(order.sales_order_date),
        order.customer_name,
        order.status,
        order.total_amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_orders_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkPrint = () => {
    window.print();
  };

  const handleBulkCreateInvoice = () => {
    alert(`Creating invoices for ${selectedOrders.length} order(s)...`);
    // Navigate to bulk invoice creation or show modal
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const bulkActions = [
    createBulkInvoiceAction(handleBulkCreateInvoice),
    createBulkExportAction(handleBulkExport),
    createBulkPrintAction(handleBulkPrint),
    createBulkDeleteAction(handleBulkDelete),
  ];

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
      packed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Packed' },
      shipped: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Shipped' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
    };

    const style = statusMap[statusLower] || statusMap.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
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
          <div className="text-slate-600">Loading sales orders...</div>
        </div>
      </div>
    );
  }

  if (salesOrders.length === 0 && filterStatus === 'all') {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Sales Orders</h1>
              <p className="text-slate-600 mt-2">
                Create and manage customer sales orders.
              </p>
            </div>
            <button
              onClick={() => navigate('/sales/sales-orders/new')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              <span className="font-medium">New Sales Order</span>
            </button>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Start Creating Sales Orders
            </h2>
            <p className="text-slate-600 mb-6">
              Generate sales orders, track fulfillment, and manage customer orders.
            </p>
            <button
              onClick={() => navigate('/sales/sales-orders/new')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              NEW SALES ORDER
            </button>
          </div>

          {/* Process Flow */}
          <ProcessFlow title="Life cycle of a Sales Order" steps={salesOrderSteps} />
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
            <h1 className="text-3xl font-bold text-slate-800">All Sales Orders</h1>
            <p className="text-slate-600 mt-1">
              {salesOrders.length} sales order{salesOrders.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            onClick={() => navigate('/sales/sales-orders/new')}
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
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
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

        {/* Sales Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === salesOrders.length && salesOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">SALES ORDER#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">REFERENCE#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">CUSTOMER NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">SALESPERSON</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">SHIPMENT DATE</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">AMOUNT</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {salesOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleViewOrder(order.id!)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id!)}
                        onChange={() => handleSelectOrder(order.id!)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800">
                      {formatDate(order.sales_order_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        {order.sales_order_number}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {order.reference_number || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 font-medium">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {order.salesperson_name || '-'}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(order.status || 'draft')}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(order.expected_shipment_date || '')}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 text-right font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === order.id ? null : order.id!)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showActionMenu === order.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                            <button
                              onClick={() => {
                                handleViewOrder(order.id!);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              onClick={() => {
                                handleEditOrder(order.id!);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.sales_order_number || '');
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
                                handleDeleteOrder(order.id!);
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
            <div className="text-sm text-slate-600 mb-1">Total Orders</div>
            <div className="text-2xl font-bold text-slate-800">{salesOrders.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(salesOrders.reduce((sum, order) => sum + order.total_amount, 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Confirmed Orders</div>
            <div className="text-2xl font-bold text-blue-600">
              {salesOrders.filter(o => o.status?.toLowerCase() === 'confirmed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Delivered Orders</div>
            <div className="text-2xl font-bold text-green-600">
              {salesOrders.filter(o => o.status?.toLowerCase() === 'delivered').length}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedOrders.length}
          totalCount={salesOrders.length}
          onClearSelection={clearSelection}
          onSelectAll={handleSelectAll}
          actions={bulkActions}
          entityName="order"
        />
      </div>
    </div>
  );
};

export default SalesOrdersPage;
