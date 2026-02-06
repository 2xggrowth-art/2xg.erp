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
  XCircle,
  Copy,
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
  // Order Details
  payment_terms?: string;
  other_references?: string;
  terms_of_delivery?: string;
  // Receipt Details
  dispatch_through?: string;
  destination?: string;
  carrier_name_agent?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
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
      const response = await purchaseOrdersService.getPurchaseOrderById(id!);
      if (response.success && response.data) {
        // Map the API response to match our interface
        const poData = response.data;
        setOrder({
          id: poData.id,
          po_number: poData.po_number,
          vendor_name: poData.supplier_name || 'Unknown Vendor',
          vendor_email: poData.supplier_email,
          vendor_phone: '',
          vendor_address: poData.delivery_address || '',
          order_date: poData.order_date,
          expected_date: poData.expected_delivery_date,
          status: poData.status as any,
          subtotal: poData.subtotal,
          discount_amount: poData.discount_amount,
          total_amount: poData.total_amount,
          // Order Details
          payment_terms: poData.payment_terms,
          other_references: poData.other_references,
          terms_of_delivery: poData.terms_of_delivery,
          // Receipt Details
          dispatch_through: poData.dispatch_through,
          destination: poData.destination,
          carrier_name_agent: poData.carrier_name_agent,
          bill_of_lading_no: poData.bill_of_lading_no,
          bill_of_lading_date: poData.bill_of_lading_date,
          motor_vehicle_no: poData.motor_vehicle_no,
          terms_conditions: poData.terms_and_conditions,
          line_items: (poData.purchase_order_items || poData.items || []).map((item: any) => ({
            id: item.id,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price || item.rate,
            total: item.total || item.amount
          })),
          created_at: poData.created_at,
          updated_at: poData.updated_at
        });
      } else {
        console.error('Failed to fetch purchase order');
        setOrder(null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder(null);
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
        const response = await purchaseOrdersService.deletePurchaseOrder(id!);
        if (response.success) {
          navigate('/purchase-orders');
        } else {
          alert('Failed to delete purchase order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete purchase order');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!order) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order - ${order.po_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; margin-bottom: 5px; }
            .header { margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            .text-right { text-align: right; }
            .summary { float: right; width: 300px; margin-top: 20px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Order: ${order.po_number}</h1>
            <p>Status: ${order.status.toUpperCase()}</p>
            <p>Order Date: ${formatDate(order.order_date)}</p>
            ${order.expected_date ? `<p>Expected Delivery: ${formatDate(order.expected_date)}</p>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Vendor Information</div>
            <p><strong>Vendor:</strong> ${order.vendor_name}</p>
            ${order.vendor_email ? `<p><strong>Email:</strong> ${order.vendor_email}</p>` : ''}
            ${order.vendor_phone ? `<p><strong>Phone:</strong> ${order.vendor_phone}</p>` : ''}
            ${order.vendor_address ? `<p><strong>Address:</strong> ${order.vendor_address}</p>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.line_items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.item_name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unit_price)}</td>
                    <td class="text-right">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(order.subtotal)}</span>
            </div>
            ${order.discount_amount ? `
            <div class="summary-row">
              <span>Discount:</span>
              <span>-${formatCurrency(order.discount_amount)}</span>
            </div>
            ` : ''}
            ${order.tax_amount ? `
            <div class="summary-row">
              <span>Tax:</span>
              <span>${formatCurrency(order.tax_amount)}</span>
            </div>
            ` : ''}
            ${order.shipping_charges ? `
            <div class="summary-row">
              <span>Shipping:</span>
              <span>${formatCurrency(order.shipping_charges)}</span>
            </div>
            ` : ''}
            <div class="summary-row summary-total">
              <span>Total:</span>
              <span>${formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          <div style="clear: both; margin-top: 40px;">
            <div class="section" style="margin-bottom: 20px;">
              <div class="section-title" style="text-decoration: underline;">Order Details</div>
              <p><strong>Mode/Terms of Payment:</strong> ${order.payment_terms || '-'}</p>
              <p><strong>Other References:</strong> ${order.other_references || '-'}</p>
              <p><strong>Terms of Delivery:</strong> ${order.terms_of_delivery || '-'}</p>
            </div>
            <div class="section" style="margin-bottom: 20px;">
              <div class="section-title" style="text-decoration: underline;">Receipt Details</div>
              <p><strong>Dispatch through:</strong> ${order.dispatch_through || '-'}</p>
              <p><strong>Destination:</strong> ${order.destination || '-'}</p>
              <p><strong>Carrier Name/Agent:</strong> ${order.carrier_name_agent || '-'}</p>
              <p><strong>Bill of Lading/LR-RR No.:</strong> ${order.bill_of_lading_no || '-'} ${order.bill_of_lading_date ? `<strong>Date:</strong> ${formatDate(order.bill_of_lading_date)}` : ''}</p>
              <p><strong>Motor Vehicle No.:</strong> ${order.motor_vehicle_no || '-'}</p>
            </div>
            ${order.terms_conditions ? `<p><strong>Terms & Conditions:</strong> ${order.terms_conditions}</p>` : ''}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `po-${order.po_number}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    if (!order) return;

    // Create email template
    const subject = `Purchase Order ${order.po_number}`;
    const body = `Dear ${order.vendor_name},

Please find attached our Purchase Order ${order.po_number} dated ${formatDate(order.order_date)}.

Order Details:
- Total Amount: ${formatCurrency(order.total_amount)}
- Expected Delivery: ${order.expected_date ? formatDate(order.expected_date) : 'TBD'}
- Items: ${order.line_items.length} item(s)

Please confirm receipt of this purchase order.

Best regards,
2XG Business Suite`;

    // Open email client
    const mailtoLink = `mailto:${order.vendor_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
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
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print"
              >
                <Printer size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleEmail}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Email to Vendor"
              >
                <Mail size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleDownloadPDF}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download PDF"
              >
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

              {/* Order Details & Receipt Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Details */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 underline">Order Details</h3>
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="w-48 text-gray-500">Mode/Terms of Payment</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">{order.payment_terms || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Other References</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">{order.other_references || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Terms of Delivery</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">{order.terms_of_delivery || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 underline">Receipt Details</h3>
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="w-48 text-gray-500">Dispatch through</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">{order.dispatch_through || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Destination</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">{order.destination || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Carrier Name/Agent</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">{order.carrier_name_agent || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Bill of Lading/LR-RR No.</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">
                        {order.bill_of_lading_no || '-'}
                        {order.bill_of_lading_date && (
                          <span className="ml-4 text-gray-500">
                            Date: <span className="text-gray-900">{formatDate(order.bill_of_lading_date)}</span>
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Motor Vehicle No.</span>
                      <span className="mr-2">:</span>
                      <span className="text-gray-900">{order.motor_vehicle_no || '-'}</span>
                    </div>
                  </div>
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
