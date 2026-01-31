import { useState, useEffect } from 'react';
import { Filter, Play, X, ChevronDown } from 'lucide-react';
import { ReportConfig, ReportFilter as ReportFilterDef } from '../../types/reports';
import { useDateFilter } from '../../contexts/DateFilterContext';

interface ReportFiltersProps {
  config: ReportConfig;
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onRun: () => void;
  onClear: () => void;
}

const ReportFilters = ({ config, filters, onFilterChange, onRun, onClear }: ReportFiltersProps) => {
  const { dateRange, setDateRange } = useDateFilter();
  const [filterOptions, setFilterOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Load async filter options
  useEffect(() => {
    const loadOptions = async () => {
      for (const filter of config.filters) {
        if (filter.optionsLoader) {
          setLoadingOptions((prev) => ({ ...prev, [filter.key]: true }));
          try {
            const options = await filter.optionsLoader();
            setFilterOptions((prev) => ({ ...prev, [filter.key]: options }));
          } catch (error) {
            console.error(`Failed to load options for ${filter.key}:`, error);
          } finally {
            setLoadingOptions((prev) => ({ ...prev, [filter.key]: false }));
          }
        }
      }
    };
    loadOptions();
  }, [config.filters]);

  const handleDatePreset = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (preset) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      preset: preset as any,
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== '');

  const renderFilter = (filter: ReportFilterDef) => {
    const options = filter.options || filterOptions[filter.key] || [];
    const isLoading = loadingOptions[filter.key];

    if (filter.type === 'select') {
      return (
        <div key={filter.key} className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{filter.label}:</span>
          <select
            value={filters[filter.key] || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
            disabled={isLoading}
          >
            <option value="">All</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side - Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>

          {/* Date Range Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Date Range:</span>
            <select
              value={dateRange.preset}
              onChange={(e) => handleDatePreset(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Primary filters (first 2) */}
          {config.filters.slice(0, 2).map(renderFilter)}

          {/* More Filters toggle */}
          {config.filters.length > 2 && (
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span>More Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Right side - Run Report Button */}
        <button
          onClick={onRun}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Play className="w-4 h-4" />
          Run Report
        </button>
      </div>

      {/* Expanded filters */}
      {showMoreFilters && config.filters.length > 2 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
          {config.filters.slice(2).map(renderFilter)}
        </div>
      )}
    </div>
  );
};

export default ReportFilters;
