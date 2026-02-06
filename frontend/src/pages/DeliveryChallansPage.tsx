import { useState, useEffect } from 'react';
import { Filter, Download, Printer, MoreVertical, Edit, Trash2, Eye, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deliveryChallansService, DeliveryChallan } from '../services/delivery-challans.service';

const DeliveryChallansPage = () => {
  const navigate = useNavigate();
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallans, setSelectedChallans] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchChallans();
  }, [filterStatus]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await deliveryChallansService.getAllDeliveryChallans(filters);

      if (response.success && response.data) {
        setChallans(response.data.deliveryChallans || []);
      }
    } catch (error) {
      console.error('Error fetching delivery challans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChallan = (challanId: string) => {
    setSelectedChallans(prev =>
      prev.includes(challanId)
        ? prev.filter(id => id !== challanId)
        : [...prev, challanId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChallans.length === challans.length) {
      setSelectedChallans([]);
    } else {
      setSelectedChallans(challans.map(challan => challan.id!));
    }
  };

  const handleViewChallan = (challanId: string) => {
    navigate(`/logistics/delivery-challan/${challanId}`);
  };

  const handleEditChallan = (challanId: string) => {
    navigate(`/logistics/delivery-challan/${challanId}/edit`);
  };

  const handleDeleteChallan = async (challanId: string) => {
    if (window.confirm('Are you sure you want to delete this delivery challan?')) {
      try {
        await deliveryChallansService.deleteDeliveryChallan(challanId);
        fetchChallans();
      } catch (error) {
        console.error('Error deleting delivery challan:', error);
        alert('Failed to delete delivery challan');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
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

  const handleDownloadChallan = (challan: DeliveryChallan, e: React.MouseEvent) => {
    e.stopPropagation();

    // Generate challan details as text content
    const challanContent = `
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

    // Create and download the file
    const blob = new Blob(['\uFEFF' + challanContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${challan.challan_number || 'challan'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading delivery challans...</div>
        </div>
      </div>
    );
  }

  if (challans.length === 0 && filterStatus === 'all') {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Delivery Challans</h1>
              <p className="text-slate-600 mt-2">
                Create and manage delivery challans for goods movement.
              </p>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              No Delivery Challans Found
            </h2>
            <p className="text-slate-600">
              Delivery challans will appear here once created from invoices.
            </p>
          </div>
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
            <h1 className="text-3xl font-bold text-slate-800">All Delivery Challans</h1>
            <p className="text-slate-600 mt-1">
              {challans.length} delivery challan{challans.length !== 1 ? 's' : ''} found
            </p>
          </div>
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
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Printer size={18} />
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Challans Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedChallans.length === challans.length && challans.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">CHALLAN#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">REFERENCE#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">CUSTOMER NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">STATUS</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">AMOUNT</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">DOWNLOAD</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {challans.map((challan) => (
                  <tr
                    key={challan.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleViewChallan(challan.id!)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedChallans.includes(challan.id!)}
                        onChange={() => handleSelectChallan(challan.id!)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800">
                      {formatDate(challan.challan_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        {challan.challan_number}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {challan.reference_number || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 font-medium">
                      {challan.customer_name}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(challan.status || 'draft')}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800 text-right font-medium">
                      {formatCurrency(challan.total_amount)}
                    </td>
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDownloadChallan(challan, e)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Challan"
                      >
                        <FileDown size={16} />
                        Download
                      </button>
                    </td>
                    <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === challan.id ? null : challan.id!)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showActionMenu === challan.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                            <button
                              onClick={() => {
                                handleViewChallan(challan.id!);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              onClick={() => {
                                handleEditChallan(challan.id!);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                handleDeleteChallan(challan.id!);
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
            <div className="text-sm text-slate-600 mb-1">Total Challans</div>
            <div className="text-2xl font-bold text-slate-800">{challans.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(challans.reduce((sum, challan) => sum + challan.total_amount, 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Draft Challans</div>
            <div className="text-2xl font-bold text-slate-600">
              {challans.filter(c => c.status?.toLowerCase() === 'draft').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-slate-600 mb-1">Delivered</div>
            <div className="text-2xl font-bold text-green-600">
              {challans.filter(c => c.status?.toLowerCase() === 'delivered').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryChallansPage;
