import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Printer, Calendar, User, MapPin, CheckCircle, Clock, Package, XCircle, AlertTriangle, Save
} from 'lucide-react';
import { stockCountService, StockCount } from '../services/stockCount.service';

const StockCountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stockCount, setStockCount] = useState<StockCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusNotes, setStatusNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null);
  const [countedValues, setCountedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStockCountDetails();
  }, [id]);

  const fetchStockCountDetails = async () => {
    try {
      setLoading(true);
      const data = await stockCountService.getStockCountById(id!);
      if (data) {
        setStockCount(data);
        // Initialize counted values from existing data
        const values: Record<string, string> = {};
        (data.items || []).forEach(item => {
          if (item.counted_quantity !== null && item.counted_quantity !== undefined) {
            values[item.id] = String(item.counted_quantity);
          }
        });
        setCountedValues(values);
      }
    } catch (error) {
      console.error('Error fetching stock count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this stock count?')) {
      try {
        await stockCountService.deleteStockCount(id!);
        navigate('/items/stock-count');
      } catch (error) {
        console.error('Error deleting stock count:', error);
        alert('Failed to delete stock count. Only draft counts can be deleted.');
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await stockCountService.updateStatus(id!, newStatus, statusNotes || undefined);
      setShowStatusModal(null);
      setStatusNotes('');
      fetchStockCountDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleStartCounting = async () => {
    try {
      await stockCountService.updateStatus(id!, 'in_progress');
      fetchStockCountDetails();
    } catch (error: any) {
      console.error('Error starting count:', error);
      alert(error.response?.data?.error || 'Failed to start counting');
    }
  };

  const handleSave = async () => {
    if (!stockCount) return;

    const itemsToSave = Object.entries(countedValues)
      .filter(([, val]) => val !== '' && !isNaN(Number(val)))
      .map(([itemId, val]) => ({
        id: itemId,
        counted_quantity: Number(val),
      }));

    if (itemsToSave.length === 0) {
      alert('Please enter at least one counted quantity to save.');
      return;
    }

    setSaving(true);
    try {
      await stockCountService.updateCountedQuantities(id!, itemsToSave);
      alert('Progress saved successfully!');
      fetchStockCountDetails();
    } catch (error: any) {
      console.error('Error saving counts:', error);
      alert(error.response?.data?.error || 'Failed to save counted quantities.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!stockCount) return;

    const items = stockCount.items || [];
    const enteredCount = Object.values(countedValues).filter(v => v !== '' && !isNaN(Number(v))).length;

    if (enteredCount < items.length) {
      const proceed = window.confirm(
        `Only ${enteredCount} of ${items.length} items have been counted. Do you want to submit anyway?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      // Save any entered values first
      const itemsToSave = Object.entries(countedValues)
        .filter(([, val]) => val !== '' && !isNaN(Number(val)))
        .map(([itemId, val]) => ({
          id: itemId,
          counted_quantity: Number(val),
        }));

      if (itemsToSave.length > 0) {
        await stockCountService.updateCountedQuantities(id!, itemsToSave);
      }

      // Then submit
      await stockCountService.updateStatus(id!, 'submitted');
      alert('Stock count submitted for approval!');
      fetchStockCountDetails();
    } catch (error: any) {
      console.error('Error submitting count:', error);
      alert(error.response?.data?.error || 'Failed to submit stock count.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecount = async () => {
    try {
      await stockCountService.updateStatus(id!, 'in_progress');
      fetchStockCountDetails();
    } catch (error: any) {
      console.error('Error starting recount:', error);
      alert(error.response?.data?.error || 'Failed to start recount');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const isEditable = stockCount?.status === 'in_progress';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stockCount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Stock Count not found</h2>
          <button onClick={() => navigate('/items/stock-count')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Stock Counts
          </button>
        </div>
      </div>
    );
  }

  const items = stockCount.items || [];
  const countedCount = items.filter(i => {
    const val = countedValues[i.id];
    return (val !== undefined && val !== '' && !isNaN(Number(val))) || (i.counted_quantity !== null && i.counted_quantity !== undefined);
  }).length;
  const varianceItems = items.filter(i => i.variance !== null && i.variance !== 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/items/stock-count')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{stockCount.stock_count_number}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stockCount.status)}`}>
                    {formatStatus(stockCount.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Draft: Start Counting */}
              {stockCount.status === 'draft' && (
                <button
                  onClick={handleStartCounting}
                  className="px-4 py-2 text-white rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Clock size={16} />
                  Start Counting
                </button>
              )}

              {/* In Progress: Save + Submit */}
              {stockCount.status === 'in_progress' && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-white rounded-lg flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 py-2 text-white rounded-lg flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {submitting ? 'Submitting...' : 'Submit Count'}
                  </button>
                </>
              )}

              {/* Submitted: Approve + Reject */}
              {stockCount.status === 'submitted' && (
                <>
                  <button
                    onClick={() => setShowStatusModal('approved')}
                    className="px-4 py-2 text-white rounded-lg flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowStatusModal('rejected')}
                    className="px-4 py-2 text-white rounded-lg flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </>
              )}

              {/* Rejected: Re-count */}
              {stockCount.status === 'rejected' && (
                <button
                  onClick={handleRecount}
                  className="px-4 py-2 text-white rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Clock size={16} />
                  Re-count
                </button>
              )}

              <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                <Printer size={20} className="text-gray-600" />
              </button>
              {stockCount.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/items/stock-count/edit/${id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Delete">
                    <Trash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Banners */}
      {stockCount.status === 'submitted' && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <Clock size={20} className="text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800 font-medium">Submitted — Awaiting approval</p>
          </div>
        </div>
      )}
      {stockCount.status === 'approved' && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">Approved — Stock has been adjusted</p>
          </div>
        </div>
      )}
      {stockCount.status === 'rejected' && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">Rejected — Please re-count the items</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Package size={20} className="text-blue-600" /> Count Details
              </h2>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="font-medium text-gray-900">{stockCount.description || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date Created</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {formatDate(stockCount.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    {stockCount.location_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    {stockCount.assigned_to_name || '-'}
                  </p>
                </div>
                {stockCount.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="font-medium text-gray-900">{stockCount.notes}</p>
                  </div>
                )}
                {stockCount.approved_at && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Approved At</p>
                    <p className="font-medium text-gray-900">{formatDate(stockCount.approved_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items List with Inline Counting */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Items ({items.length})</h3>
                {isEditable && (
                  <span className="text-sm text-blue-600 font-medium">
                    {countedCount}/{items.length} counted
                  </span>
                )}
              </div>

              {/* Items as cards for better counting UX */}
              {isEditable ? (
                <div className="divide-y">
                  {items.map((item) => {
                    const currentValue = countedValues[item.id] || '';
                    const numericValue = currentValue !== '' ? Number(currentValue) : null;
                    const variance = numericValue !== null ? numericValue - item.expected_quantity : null;
                    const hasVariance = variance !== null && variance !== 0;

                    return (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 truncate">{item.item_name}</span>
                              {item.bin_code && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                                  {item.bin_code}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.sku || '-'}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Expected: <span className="font-semibold">{item.expected_quantity}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <label className="text-xs text-gray-500 font-medium">Counted</label>
                            <input
                              type="number"
                              value={currentValue}
                              onChange={(e) => {
                                setCountedValues(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }));
                              }}
                              placeholder="0"
                              className={`w-24 px-3 py-2 text-right text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                hasVariance ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
                              }`}
                              min="0"
                            />
                            {variance !== null && (
                              <span className={`text-xs font-medium ${variance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {variance === 0 ? 'Match' : `Variance: ${variance > 0 ? '+' : ''}${variance}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Read-only table for non-editable states */
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Item Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">SKU</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Bin</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Expected</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Counted</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.item_name}</td>
                        <td className="px-6 py-4 text-gray-600">{item.sku || '-'}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.bin_code ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                              {item.bin_code}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">{item.expected_quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          {item.counted_quantity !== null && item.counted_quantity !== undefined ? item.counted_quantity : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.variance !== null && item.variance !== undefined ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium ${
                              item.variance === 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                            }`}>
                              {item.variance > 0 && '+'}
                              {item.variance}
                              {item.variance !== 0 && <AlertTriangle size={14} />}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-medium text-gray-900">{items.length}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Counted</span>
                  <span className="font-medium text-gray-900">{countedCount}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">With Variance</span>
                  <span className="font-medium text-red-600">{varianceItems.length}</span>
                </div>

                {/* Progress */}
                {items.length > 0 && (
                  <div className="pb-4 border-b">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 text-sm">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round((countedCount / items.length) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          countedCount === items.length ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(countedCount / items.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(stockCount.status)}`}>
                    {formatStatus(stockCount.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for in_progress */}
            {isEditable && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Progress'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    {submitting ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Modal (Approve/Reject) */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showStatusModal === 'approved' ? 'Approve Stock Count' : 'Reject Stock Count'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {showStatusModal === 'approved'
                ? 'Approving will adjust inventory to match counted quantities. This cannot be undone.'
                : 'Rejecting will clear counted quantities and send back for re-counting.'}
            </p>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder={showStatusModal === 'approved' ? 'Approval notes (optional)' : 'Reason for rejection'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowStatusModal(null); setStatusNotes(''); }} className="px-4 py-2 border border-gray-300 rounded-lg">
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(showStatusModal)}
                className={`px-4 py-2 text-white rounded-lg ${showStatusModal === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {showStatusModal === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCountDetailPage;
