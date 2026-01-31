import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useDateFilter } from '../contexts/DateFilterContext';
import { getReportConfig, formatCurrency, formatDate } from '../config/reportConfigs';
import { SYSTEM_REPORTS, reportsService } from '../services/reports.service';
import ReportHeader from '../components/reports/ReportHeader';
import ReportFilters from '../components/reports/ReportFilters';
import ReportDataTable from '../components/reports/ReportDataTable';
import { ReportFilters as ReportFiltersType } from '../types/reports';

const ReportViewerPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { dateRange } = useDateFilter();

  // State
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get report configuration
  const config = reportId ? getReportConfig(reportId) : undefined;
  const reportInfo = SYSTEM_REPORTS.find((r) => r.id === reportId);

  // Fetch report data
  const fetchData = useCallback(async () => {
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      const reportFilters: ReportFiltersType = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...filters,
      };

      const result = await config.dataFetcher(reportFilters);
      setData(result);
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to load report data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [config, dateRange, filters]);

  // Initial data fetch
  useEffect(() => {
    if (config) {
      fetchData();
      // Record visit
      if (reportId) {
        reportsService.recordVisit(reportId);
      }
    }
  }, [config, reportId]);

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    let comparison = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (!config || sortedData.length === 0) return;

    const headers = config.columns.map((col) => col.header);
    const rows = sortedData.map((row) =>
      config.columns.map((col) => {
        const value = row[col.key];
        if (col.type === 'currency') {
          return Number(value || 0).toFixed(2);
        }
        if (col.type === 'date') {
          return formatDate(value);
        }
        return value ?? '';
      })
    );

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join(
      '\n'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.exportFilename}_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Report not found
  if (!config || !reportInfo) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Report Not Found</h2>
        <p className="text-gray-500 mb-4">The report you're looking for doesn't exist or hasn't been configured yet.</p>
        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <ReportHeader
        config={config}
        dateRange={dateRange}
        onExportCSV={handleExportCSV}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Filters */}
      <ReportFilters
        config={config}
        filters={filters}
        onFilterChange={handleFilterChange}
        onRun={fetchData}
        onClear={handleClearFilters}
      />

      {/* Error state */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading report</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <ReportDataTable
          columns={config.columns}
          data={sortedData}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          showTotals={config.showTotals}
        />
      </div>
    </div>
  );
};

export default ReportViewerPage;
