import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReportConfig } from '../../types/reports';

interface ReportHeaderProps {
  config: ReportConfig;
  dateRange: { startDate: string; endDate: string };
  onExportCSV: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

const ReportHeader = ({ config, dateRange, onExportCSV, onRefresh, loading }: ReportHeaderProps) => {
  const navigate = useNavigate();

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Top Bar */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Reports"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="text-sm text-gray-500">{config.category}</div>
            <h1 className="text-xl font-semibold text-gray-800">{config.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="px-6 py-3 flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">From</span>
        <span className="text-blue-600">{formatDateDisplay(dateRange.startDate)}</span>
        <span className="font-medium">To</span>
        <span className="text-blue-600">{formatDateDisplay(dateRange.endDate)}</span>
      </div>
    </div>
  );
};

export default ReportHeader;
