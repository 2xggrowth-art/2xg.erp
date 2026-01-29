export class GoogleSheetsService {
  /**
   * Fetch data from a public Google Sheets URL
   * URL format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
   */
  async fetchPublicSheet(sheetUrl: string): Promise<any[][]> {
    try {
      // Extract sheet ID and gid from URL
      const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/);

      if (!sheetIdMatch) {
        throw new Error('Invalid Google Sheets URL');
      }

      const sheetId = sheetIdMatch[1];
      const gid = gidMatch ? gidMatch[1] : '0';

      // Build export URL for CSV format
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch Google Sheet. Make sure the sheet is publicly accessible.');
      }

      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error: any) {
      throw new Error(`Google Sheets import failed: ${error.message}`);
    }
  }

  /**
   * Parse CSV text to 2D array
   */
  private parseCSV(csvText: string): any[][] {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  }

  /**
   * Convert 2D array to JSON with headers
   */
  arrayToJSON(data: any[][]): any[] {
    if (data.length < 2) return [];

    const headers = data[0];
    return data.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || null;
      });
      return obj;
    });
  }
}
