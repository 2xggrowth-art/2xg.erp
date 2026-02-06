import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  MapPin,
  Package,
  FileText,
  Truck,
  Phone
} from 'lucide-react';
import { deliveryChallansService, DeliveryChallan } from '../services/delivery-challans.service';

const DeliveryChallanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<DeliveryChallan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchChallanDetails();
  }, [id]);

  const fetchChallanDetails = async () => {
    try {
      setLoading(true);
      const response = await deliveryChallansService.getDeliveryChallanById(id!);
      if (response.success && response.data) {
        setChallan(response.data);
      }
    } catch (error) {
      console.error('Error fetching delivery challan:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusConfig = (status?: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
      in_transit: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Transit' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };
    return configs[status || 'draft'] || configs.draft;
  };

  const handleDownload = () => {
    if (!challan) return;
    const content = `
DELIVERY CHALLAN
================

Challan Number: ${challan.challan_number || '-'}
Date: ${formatDate(challan.challan_date)}
Status: ${challan.status || 'Draft'}

CUSTOMER DETAILS
----------------
Customer Name: ${challan.customer_name || '-'}
Invoice Number: ${challan.invoice_number || '-'}
Reference Number: ${challan.reference_number || '-'}
Alternate Phone: ${challan.alternate_phone || '-'}

DELIVERY DETAILS
----------------
Product Name: ${challan.product_name || '-'}
Delivery Location Type: ${challan.delivery_location_type || '-'}
Delivery Address: ${challan.delivery_address || '-'}
Pincode: ${challan.pincode || '-'}
Estimated Delivery: ${challan.estimated_delivery_day || '-'}

SALESPERSON
-----------
Salesperson: ${challan.salesperson_name || '-'}

ADDITIONAL INFO
---------------
Free Accessories: ${challan.free_accessories || '-'}
Reverse Pickup: ${challan.reverse_pickup ? 'Yes' : 'No'}
Notes: ${challan.notes || '-'}

AMOUNT
------
Total Amount: Rs.${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(challan.total_amount)}

================
Generated on: ${new Date().toLocaleString('en-IN')}
    `.trim();

    const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${challan.challan_number || 'challan'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this delivery challan?')) return;
    try {
      await deliveryChallansService.deleteDeliveryChallan(id);
      navigate('/logistics/delivery-challan');
    } catch (error) {
      console.error('Error deleting challan:', error);
      alert('Failed to delete delivery challan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Loading delivery challan...</div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-slate-500">Delivery challan not found</div>
        <button onClick={() => navigate('/logistics/delivery-challan')} className="text-blue-600 hover:underline">
          Back to Delivery Challans
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(challan.status);
  const items = challan.items || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/logistics/delivery-challan')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{challan.challan_number}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Created on {formatDate(challan.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="p-2 hover:bg-slate-100 rounded-lg" title="Download">
            <Download size={20} className="text-slate-600" />
          </button>
          <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
            <Trash2 size={20} className="text-red-500" />
          </button>
          <button
            onClick={() => navigate(`/logistics/delivery-challan/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Customer Name</p>
                <p className="font-medium text-slate-800">{challan.customer_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Invoice Number</p>
                <p className="font-medium text-slate-800">{challan.invoice_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Reference Number</p>
                <p className="font-medium text-slate-800">{challan.reference_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Alternate Phone</p>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  {challan.alternate_phone ? <><Phone size={14} />{challan.alternate_phone}</> : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Truck size={20} className="text-blue-600" />
              Delivery Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Product Name</p>
                <p className="font-medium text-slate-800">{challan.product_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Delivery Location Type</p>
                <p className="font-medium text-slate-800">{challan.delivery_location_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Pincode</p>
                <p className="font-medium text-slate-800">{challan.pincode || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-slate-500">Delivery Address</p>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" />
                  {challan.delivery_address || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Estimated Delivery</p>
                <p className="font-medium text-slate-800">{challan.estimated_delivery_day || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Salesperson</p>
                <p className="font-medium text-slate-800">{challan.salesperson_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Items ({items.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Item</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{item.item_name}</p>
                          {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-800">{item.quantity} {item.unit_of_measurement}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-800">{formatCurrency(item.rate)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Additional Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Free Accessories</p>
                <p className="font-medium text-slate-800">{challan.free_accessories || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Reverse Pickup</p>
                <p className="font-medium text-slate-800">{challan.reverse_pickup ? 'Yes' : 'No'}</p>
              </div>
              {challan.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="font-medium text-slate-800">{challan.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(challan.subtotal)}</span>
              </div>
              {challan.adjustment ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Adjustment</span>
                  <span className="font-medium">{formatCurrency(challan.adjustment)}</span>
                </div>
              ) : null}
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(challan.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Important Dates
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Challan Date</p>
                <p className="font-medium">{formatDate(challan.challan_date)}</p>
              </div>
              {challan.estimated_delivery_day && (
                <div>
                  <p className="text-sm text-slate-500">Estimated Delivery</p>
                  <p className="font-medium">{challan.estimated_delivery_day}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium">{formatDate(challan.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryChallanDetailPage;
