// Report Column Definition
export interface ReportColumn {
  key: string;
  header: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'status' | 'link';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  aggregation?: 'sum' | 'count' | 'average';
  width?: string;
  formatter?: (value: any, row: any) => string | JSX.Element | null;
}

// Report Filter Definition
export interface ReportFilter {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'text';
  options?: { value: string; label: string }[];
  optionsLoader?: () => Promise<{ value: string; label: string }[]>;
  defaultValue?: string;
}

// Report Configuration
export interface ReportConfig {
  id: string;
  name: string;
  category: string;
  description?: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  dataFetcher: (filters: ReportFilters) => Promise<any[]>;
  exportFilename: string;
  showTotals?: boolean;
}

// Active filter state
export interface ReportFilters {
  startDate: string;
  endDate: string;
  [key: string]: any;
}

// Report data row (generic)
export interface ReportDataRow {
  [key: string]: any;
}
