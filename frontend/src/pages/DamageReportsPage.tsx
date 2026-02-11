import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, AlertTriangle } from 'lucide-react';
import { damageReportsService, DamageReport } from '../services/damageReports.service';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'reported', label: 'Reported' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'written_off', label: 'Written Off' },
];

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  broken: 'Broken',
  water_damage: 'Water Damage',
  expired: 'Expired',
  other: 'Other',
};

const DamageReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const filters = statusFilter ? { status: statusFilter } : undefined;
      const data = await damageReportsService.getAll(filters);
      setReports(data);
    } catch (error) {
      console.error('Error loading damage reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      case 'written_off': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={28} />
              Damage Reports
            </h1>
            <p className="text-slate-600 mt-2">Track and manage damaged inventory items.</p>
          </div>
          <button
            onClick={() => navigate('/damage-reports/new')}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            <span className="font-medium">New Report</span>
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading damage reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertTriangle size={48} className="text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No damage reports</h2>
            <p className="text-slate-600">No damage reports found{statusFilter ? ` with status "${formatStatus(statusFilter)}"` : ''}.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Report #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Damage Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Reported By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/damage-reports/${report.id}`)}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-blue-600">{report.report_number}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">{report.item_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{DAMAGE_TYPE_LABELS[report.damage_type] || report.damage_type}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.reported_by_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(report.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                        {formatStatus(report.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/damage-reports/${report.id}`)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DamageReportsPage;
