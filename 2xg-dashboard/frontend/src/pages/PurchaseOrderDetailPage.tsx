import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Printer,
  Mail,
  Download,
  MoreVertical,
  Calendar,
  Building2,
  Package,
  DollarSign,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Share2,
  Receipt
} from 'lucide-react';
import { purchaseOrdersService } from '../services/purchase-orders.service';

interface LineItem {
  id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  received_quantity?: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_address?: string;
  order_date: string;
  expected_date?: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  payment_status?: 'pending' | 'partial' | 'paid';
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  shipping_charges?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string;
  terms_conditions?: string;
  line_items: LineItem[];
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'receiving' | 'timeline'>('details');
  const [showActionMenu, setShowActionMenu] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      try {
        const response = await purchaseOrdersService.getById(id!);
        if (response) {
          setOrder(response);
          return;
        }
      } catch (error) {
        console.log('Using mock data');
      }

      // Mock data
      setOrder({
        id: id!,
        po_number: `PO-${id?.slice(0, 8).toUpperCase()}`,
        vendor_name: 'Hero Cycles Ltd',
        vendor_email: 'orders@herocycles.com',
        vendor_phone: '+91 98765 12345',
        vendor_address: 'Industrial Area Phase II, Ludhiana, Punjab 141003',
        order_date: new Date().toISOString(),
        expected_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        payment_status: 'pending',
        subtotal: 125000,
        tax_amount: 22500,
        discount_amount: 5000,
        shipping_charges: 2500,
        total_amount: 145000,
        amount_paid: 50000,
        balance_due: 95000,
        notes: 'Urgent order for festive season stock',
        terms_conditions: 'Payment: 50% advance, 50% on delivery',
        line_items: [
          { id: '1', item_name: 'Hero Sprint Pro 26T Frame', sku: 'HRO-FRM-26T', quantity: 20, received_quantity: 0, unit_price: 5000, discount: 0, tax_rate: 18, total: 100000 },
          { id: '2', item_name: 'Hero Wheel Set 26"', sku: 'HRO-WHL-26', quantity: 10, received_quantity: 0, unit_price: 2500, discount: 0, tax_rate: 18, total: 25000 },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'Admin User'
      });
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <FileText size={16} />, label: 'Draft' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Mail size={16} />, label: 'Sent' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={16} />, label: 'Confirmed' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Package size={16} />, label: 'Partially Received' },
      received: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={16} />, label: 'Received' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={16} />, label: 'Cancelled' },
    };
    return configs[status] || configs.draft;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
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
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await purchaseOrdersService.delete(id!);
        navigate('/purchase-orders');
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Purchase Order not found</h2>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Purchase Orders
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/purchase-orders')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{order.po_number}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Created on {formatDate(order.created_at)} {order.created_by && `by ${order.created_by}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                <Printer size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Email to Vendor">
                <Mail size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download PDF">
                <Download size={20} className="text-gray-600" />
              </button>
              <button
                onClick={() => navigate(`/purchase-orders/${id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                {showActionMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <Copy size={16} /> Duplicate PO
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <Receipt size={16} /> Create Bill
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <Truck size={16} /> Receive Items
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4 border-b -mb-4">
            {['details', 'receiving', 'timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 px-1 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vendor Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  Vendor Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Vendor Name</p>
                    <p className="font-medium text-gray-900">{order.vendor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{order.vendor_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{order.vendor_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{order.vendor_address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    Order Items ({order.line_items.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ordered</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Received</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.line_items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{item.item_name}</p>
                            {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={item.received_quantity === item.quantity ? 'text-green-600' : 'text-orange-600'}>
                              {item.received_quantity || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-green-600">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  {order.tax_amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax (GST)</span>
                      <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                    </div>
                  )}
                  {order.shipping_charges && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-gray-900">{formatCurrency(order.shipping_charges)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.amount_paid !== undefined && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Amount Paid</span>
                        <span>{formatCurrency(order.amount_paid)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-orange-600">
                        <span>Balance Due</span>
                        <span>{formatCurrency(order.balance_due || 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-purple-600" />
                  Important Dates
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium text-gray-900">{formatDate(order.order_date)}</p>
                  </div>
                  {order.expected_date && (
                    <div>
                      <p className="text-sm text-gray-500">Expected Delivery</p>
                      <p className="font-medium text-gray-900">{formatDate(order.expected_date)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2 justify-center">
                    <Truck size={16} /> Receive Items
                  </button>
                  <button className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-2 justify-center">
                    <Receipt size={16} /> Create Bill
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 flex items-center gap-2 justify-center">
                    <DollarSign size={16} /> Record Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receiving' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Receiving Status</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Truck size={16} /> Receive Items
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ordered</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Received</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.line_items.map((item) => {
                    const pending = item.quantity - (item.received_quantity || 0);
                    const isComplete = pending === 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{item.item_name}</p>
                          <p className="text-sm text-gray-500">{item.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-green-600">{item.received_quantity || 0}</td>
                        <td className="px-6 py-4 text-right text-orange-600">{pending}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isComplete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {isComplete ? 'Complete' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Timeline</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {[
                  { date: order.created_at, title: 'PO Created', description: 'Purchase order was created', icon: <FileText size={16} />, color: 'bg-blue-500' },
                  { date: order.created_at, title: 'Sent to Vendor', description: 'PO was sent to vendor via email', icon: <Mail size={16} />, color: 'bg-purple-500' },
                  { date: order.created_at, title: 'Confirmed', description: 'Vendor confirmed the order', icon: <CheckCircle size={16} />, color: 'bg-green-500' },
                ].map((event, index) => (
                  <div key={index} className="relative flex gap-4 pl-10">
                    <div className={`absolute left-2 w-5 h-5 rounded-full ${event.color} flex items-center justify-center text-white`}>
                      {event.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-500">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
