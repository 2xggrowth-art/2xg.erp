import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Eye, Trash2, Filter, RefreshCw } from 'lucide-react';
import { damageReportsService, DamageReport } from '../services/damageReports.service';

const DamageReportsPage: React.FC = () => {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await damageReportsService.getAll(
        statusFilter ? { status: statusFilter } : undefined
      );
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching damage reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (report: DamageReport) => {
    setSelectedReport(report);
    setReviewNotes('');
    setShowModal(true);
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const response = await damageReportsService.review(selectedReport.id, {
        status,
        review_notes: reviewNotes,
      });

      if (response.success) {
        setShowModal(false);
        setSelectedReport(null);
        fetchReports();
      }
    } catch (error) {
      console.error('Error reviewing damage report:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this damage report?')) return;

    try {
      const response = await damageReportsService.delete(id);
      if (response.success) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error deleting damage report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Damage Reports</h1>
            <p className="text-gray-500">Review and manage damaged item reports</p>
          </div>
        </div>
        <button
          onClick={fetchReports}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Status:</span>
          <div className="flex gap-2">
            {['', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Damage Reports</h3>
          <p className="text-gray-500">
            {statusFilter
              ? `No ${statusFilter} damage reports found.`
              : 'No damage reports have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial / Bin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{report.item_name}</div>
                    {report.items?.sku && (
                      <div className="text-xs text-gray-500">SKU: {report.items.sku}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.serial_number || '—'}</div>
                    <div className="text-xs text-gray-500">
                      Bin: {report.bin_code || '—'}
                      {report.damaged_bins?.bin_code && (
                        <span className="ml-1 text-orange-600">
                          → {report.damaged_bins.bin_code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.reported_by_name || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{formatDate(report.reported_at)}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openReviewModal(report)}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              handleReview('approved');
                            }}
                            className="p-1.5 hover:bg-green-100 rounded text-green-600"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              handleReview('rejected');
                            }}
                            className="p-1.5 hover:bg-red-100 rounded text-red-600"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Damage Report Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Reported on {formatDate(selectedReport.reported_at)}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Item Info */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Item Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{selectedReport.item_name}</p>
                  {selectedReport.serial_number && (
                    <p className="text-sm text-gray-600 mt-1">
                      Serial: {selectedReport.serial_number}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Original Bin: {selectedReport.bin_code || 'Unknown'}
                  </p>
                  {selectedReport.damaged_bins?.bin_code && (
                    <p className="text-sm text-orange-600 mt-1">
                      Moved to: {selectedReport.damaged_bins.bin_code}
                    </p>
                  )}
                </div>
              </div>

              {/* Damage Photo */}
              {selectedReport.photo_base64 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Damage Photo</h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedReport.photo_base64}
                      alt="Damage"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedReport.damage_description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedReport.damage_description}</p>
                  </div>
                </div>
              )}

              {/* Reporter Info */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Reported By</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{selectedReport.reported_by_name || 'Unknown'}</p>
                </div>
              </div>

              {/* Review Notes (for pending) */}
              {selectedReport.status === 'pending' && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Review Notes (Optional)</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add any notes about your decision..."
                  />
                </div>
              )}

              {/* Previous Review (for approved/rejected) */}
              {selectedReport.status !== 'pending' && selectedReport.review_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Review Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedReport.review_notes}</p>
                    {selectedReport.reviewed_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Reviewed on {formatDate(selectedReport.reviewed_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedReport.status === 'pending' && (
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview('rejected')}
                  disabled={actionLoading}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleReview('approved')}
                  disabled={actionLoading}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageReportsPage;
