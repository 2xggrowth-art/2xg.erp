import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Calendar, User, Package, MapPin } from 'lucide-react';
import { damageReportsService, DamageReport } from '../services/damageReports.service';

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  broken: 'Broken',
  water_damage: 'Water Damage',
  expired: 'Expired',
  other: 'Other',
};

const DamageReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<DamageReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await damageReportsService.getById(id!);
      setReport(data);
    } catch (error) {
      console.error('Error fetching damage report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    const confirmMsg = status === 'written_off'
      ? 'Writing off will deduct the damaged quantity from inventory. Continue?'
      : 'Mark this report as reviewed?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await damageReportsService.updateStatus(id!, status);
      fetchReport();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'written_off': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Damage Report not found</h2>
          <button onClick={() => navigate('/damage-reports')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Damage Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/damage-reports')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{report.report_number}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                  {formatStatus(report.status)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {report.status === 'reported' && (
                <>
                  <button
                    onClick={() => handleStatusChange('reviewed')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleStatusChange('written_off')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Write Off
                  </button>
                </>
              )}
              {report.status === 'reviewed' && (
                <button
                  onClick={() => handleStatusChange('written_off')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Write Off Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> Damage Details
              </h2>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Item</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Package size={16} className="text-gray-400" />
                    {report.item_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quantity</p>
                  <p className="font-medium text-red-600 text-xl">{report.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Damage Type</p>
                  <p className="font-medium text-gray-900">{DAMAGE_TYPE_LABELS[report.damage_type] || report.damage_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date Reported</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {formatDate(report.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reported By</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    {report.reported_by_name || '-'}
                  </p>
                </div>
                {report.reviewed_at && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reviewed At</p>
                    <p className="font-medium text-gray-900">{formatDate(report.reviewed_at)}</p>
                  </div>
                )}
                {report.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="font-medium text-gray-900">{report.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Current</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                    {formatStatus(report.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Stock Adjusted</span>
                  <span className={`font-medium ${report.stock_adjusted ? 'text-red-600' : 'text-gray-400'}`}>
                    {report.stock_adjusted ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageReportDetailPage;
