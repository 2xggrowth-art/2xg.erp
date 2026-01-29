export interface CSVParseResult {
  data: any[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse CSV file to JSON array
 */
export const parseCSV = (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseCSVText(text);
        resolve(result);
      } catch (error: any) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Parse CSV text to JSON array
 */
export const parseCSVText = (csvText: string): CSVParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = csvText.split('\n').filter(line => line.trim() !== '');

  if (lines.length < 2) {
    errors.push('CSV file must contain at least a header row and one data row');
    return { data: [], errors, warnings };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const data: any[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) {
      warnings.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
    }

    const row: any = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      row[header.trim()] = value === '' ? null : value;
    });

    data.push(row);
  }

  return { data, errors, warnings };
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

/**
 * Convert JSON array to CSV text
 */
export const jsonToCSV = (data: any[], columns: string[]): string => {
  const headers = columns.join(',');
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col];
      if (value === null || value === undefined) return '';

      // Escape quotes and wrap in quotes if contains comma or newline
      const strValue = String(value);
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
