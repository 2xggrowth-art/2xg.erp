import { ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { ReportColumn } from '../../types/reports';
import { formatCurrency, formatDate } from '../../config/reportConfigs';

interface ReportDataTableProps {
  columns: ReportColumn[];
  data: any[];
  loading: boolean;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  showTotals?: boolean;
}

const ReportDataTable = ({
  columns,
  data,
  loading,
  sortField,
  sortDirection,
  onSort,
  showTotals,
}: ReportDataTableProps) => {
  // Format cell value based on column type
  const formatCellValue = (value: any, column: ReportColumn, row: any) => {
    if (column.formatter) {
      return column.formatter(value, row);
    }

    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'date':
        return formatDate(value);
      case 'number':
        return Number(value).toLocaleString('en-IN');
      case 'status':
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}
          >
            {String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        );
      case 'link':
        return <span className="text-blue-600 hover:underline cursor-pointer">{value}</span>;
      default:
        return String(value);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('paid') && !statusLower.includes('partially')) {
      return 'bg-green-100 text-green-800';
    }
    if (statusLower.includes('partially')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (statusLower.includes('overdue') || statusLower.includes('cancelled')) {
      return 'bg-red-100 text-red-800';
    }
    if (statusLower.includes('draft')) {
      return 'bg-gray-100 text-gray-800';
    }
    if (statusLower.includes('sent') || statusLower.includes('open')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Calculate totals for aggregation columns
  const calculateTotals = () => {
    const totals: Record<string, number> = {};
    columns.forEach((col) => {
      if (col.aggregation) {
        if (col.aggregation === 'sum') {
          totals[col.key] = data.reduce((sum, row) => sum + (Number(row[col.key]) || 0), 0);
        } else if (col.aggregation === 'count') {
          totals[col.key] = data.length;
        } else if (col.aggregation === 'average') {
          const sum = data.reduce((s, row) => s + (Number(row[col.key]) || 0), 0);
          totals[col.key] = data.length > 0 ? sum / data.length : 0;
        }
      }
    });
    return totals;
  };

  const totals = showTotals ? calculateTotals() : {};

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.align === 'right'
                        ? 'text-right'
                        : column.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && onSort(column.key)}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        column.align === 'right'
                          ? 'justify-end'
                          : column.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{column.header}</span>
                      {column.sortable && sortField === column.key && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-12 h-12 mb-3" />
                      <p className="text-lg font-medium">No data found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or date range</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 text-sm ${
                          column.align === 'right'
                            ? 'text-right'
                            : column.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${column.type === 'currency' ? 'font-mono' : ''}`}
                      >
                        {formatCellValue(row[column.key], column, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals Row */}
            {showTotals && data.length > 0 && Object.keys(totals).length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr className="font-semibold">
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm ${
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${column.type === 'currency' ? 'font-mono' : ''}`}
                    >
                      {index === 0 ? (
                        <span className="text-gray-700">Total</span>
                      ) : totals[column.key] !== undefined ? (
                        column.type === 'currency' ? (
                          formatCurrency(totals[column.key])
                        ) : (
                          totals[column.key].toLocaleString('en-IN')
                        )
                      ) : (
                        ''
                      )}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Results count */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          Showing {data.length} {data.length === 1 ? 'result' : 'results'}
        </div>
      </div>
    </div>
  );
};

export default ReportDataTable;
