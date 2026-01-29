import { jsonToCSV, downloadCSV } from './csvParser';

/**
 * Complete field mapping for items import/export
 */
export const ITEM_IMPORT_FIELDS = {
  // Required fields
  item_name: { required: true, type: 'string', description: 'Item name' },
  sku: { required: true, type: 'string', description: 'Unique SKU code' },

  // Basic fields
  unit_of_measurement: { required: false, type: 'string', description: 'Unit (e.g., pieces, kg, liter)', default: 'pieces' },
  description: { required: false, type: 'string', description: 'Item description' },

  // Pricing
  unit_price: { required: false, type: 'number', description: 'Default unit price' },
  cost_price: { required: false, type: 'number', description: 'Cost price' },
  selling_price: { required: false, type: 'number', description: 'Selling price' },

  // Inventory
  current_stock: { required: false, type: 'number', description: 'Current stock quantity', default: 0 },
  reorder_point: { required: false, type: 'number', description: 'Reorder level', default: 10 },
  max_stock: { required: false, type: 'number', description: 'Maximum stock level' },

  // Identifiers
  barcode: { required: false, type: 'string', description: 'Barcode' },
  hsn_code: { required: false, type: 'string', description: 'HSN/SAC code' },
  upc: { required: false, type: 'string', description: 'UPC code' },
  mpn: { required: false, type: 'string', description: 'MPN code' },
  ean: { required: false, type: 'string', description: 'EAN code' },
  isbn: { required: false, type: 'string', description: 'ISBN code' },

  // Product details
  brand: { required: false, type: 'string', description: 'Brand name' },
  manufacturer: { required: false, type: 'string', description: 'Manufacturer name' },
  weight: { required: false, type: 'number', description: 'Weight (kg)' },
  dimensions: { required: false, type: 'string', description: 'Dimensions (LxWxH)' },

  // Tax & Accounts
  tax_rate: { required: false, type: 'number', description: 'Tax rate (%)' },
  sales_account: { required: false, type: 'string', description: 'Sales account' },
  purchase_account: { required: false, type: 'string', description: 'Purchase account' },
  inventory_account: { required: false, type: 'string', description: 'Inventory account' },

  // Flags
  is_active: { required: false, type: 'boolean', description: 'Active status (true/false)', default: true },
  is_sellable: { required: false, type: 'boolean', description: 'Can be sold (true/false)', default: true },
  is_purchasable: { required: false, type: 'boolean', description: 'Can be purchased (true/false)', default: true },
  is_returnable: { required: false, type: 'boolean', description: 'Returnable (true/false)', default: false },
  track_inventory: { required: false, type: 'boolean', description: 'Track inventory (true/false)', default: true },
  track_bin_location: { required: false, type: 'boolean', description: 'Track bin location (true/false)', default: false },

  // Advanced
  advanced_tracking_type: { required: false, type: 'string', description: 'Tracking type (none/serial/batch)', default: 'none' },
  valuation_method: { required: false, type: 'string', description: 'Valuation method (FIFO/LIFO/Average)' },

  // Other
  image_url: { required: false, type: 'string', description: 'Image URL' },
  sales_description: { required: false, type: 'string', description: 'Sales description' },
  purchase_description: { required: false, type: 'string', description: 'Purchase description' },
};

/**
 * Column order for export
 */
export const EXPORT_COLUMN_ORDER = [
  'item_name',
  'sku',
  'unit_of_measurement',
  'description',
  'unit_price',
  'cost_price',
  'selling_price',
  'current_stock',
  'reorder_point',
  'max_stock',
  'barcode',
  'hsn_code',
  'brand',
  'manufacturer',
  'tax_rate',
  'is_active',
  'is_sellable',
  'is_purchasable',
  'weight',
  'dimensions',
  'upc',
  'mpn',
  'ean',
  'isbn',
  'is_returnable',
  'track_inventory',
  'sales_account',
  'purchase_account',
  'inventory_account',
  'image_url',
];

/**
 * Generate CSV template with sample data
 */
export const generateImportTemplate = () => {
  const sampleData = [
    {
      item_name: 'Sample Product 1',
      sku: 'SKU-001',
      unit_of_measurement: 'pieces',
      description: 'Sample product description',
      unit_price: '100.00',
      cost_price: '75.00',
      selling_price: '120.00',
      current_stock: '50',
      reorder_point: '10',
      max_stock: '200',
      barcode: '1234567890123',
      hsn_code: '8517',
      brand: 'Sample Brand',
      manufacturer: 'Sample Manufacturer',
      tax_rate: '18',
      is_active: 'true',
      is_sellable: 'true',
      is_purchasable: 'true',
    },
    {
      item_name: 'Sample Product 2',
      sku: 'SKU-002',
      unit_of_measurement: 'kg',
      description: '',
      unit_price: '50.00',
      cost_price: '35.00',
      selling_price: '60.00',
      current_stock: '100',
      reorder_point: '20',
      max_stock: '',
      barcode: '',
      hsn_code: '1001',
      brand: '',
      manufacturer: '',
      tax_rate: '5',
      is_active: 'true',
      is_sellable: 'true',
      is_purchasable: 'true',
    },
  ];

  const csv = jsonToCSV(sampleData, EXPORT_COLUMN_ORDER.slice(0, 18)); // First 18 most common fields
  downloadCSV(csv, `items_import_template_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Map CSV data to Item creation format
 */
export const mapCSVToItemData = (csvRow: any): any => {
  return {
    name: csvRow.item_name,
    sku: csvRow.sku,
    unit: csvRow.unit_of_measurement || 'pieces',
    description: csvRow.description || null,
    unit_price: csvRow.unit_price ? parseFloat(csvRow.unit_price) : 0,
    cost_price: csvRow.cost_price ? parseFloat(csvRow.cost_price) : 0,
    selling_price: csvRow.selling_price ? parseFloat(csvRow.selling_price) : null,
    current_stock: csvRow.current_stock ? parseInt(csvRow.current_stock) : 0,
    reorder_point: csvRow.reorder_point ? parseInt(csvRow.reorder_point) : 10,
    max_stock: csvRow.max_stock ? parseInt(csvRow.max_stock) : null,
    barcode: csvRow.barcode || null,
    hsn_code: csvRow.hsn_code || null,
    brand: csvRow.brand || null,
    manufacturer: csvRow.manufacturer || null,
    weight: csvRow.weight ? parseFloat(csvRow.weight) : null,
    dimensions: csvRow.dimensions || null,
    tax_rate: csvRow.tax_rate ? parseFloat(csvRow.tax_rate) : 0,
    is_active: csvRow.is_active === 'false' ? false : true,
    is_sellable: csvRow.is_sellable === 'false' ? false : true,
    is_purchasable: csvRow.is_purchasable === 'false' ? false : true,
    is_returnable: csvRow.is_returnable === 'true' ? true : false,
    track_inventory: csvRow.track_inventory === 'false' ? false : true,
    track_bin_location: csvRow.track_bin_location === 'true' ? true : false,
    upc: csvRow.upc || null,
    mpn: csvRow.mpn || null,
    ean: csvRow.ean || null,
    isbn: csvRow.isbn || null,
    sales_account: csvRow.sales_account || null,
    purchase_account: csvRow.purchase_account || null,
    inventory_account: csvRow.inventory_account || null,
    advanced_tracking_type: csvRow.advanced_tracking_type || 'none',
    valuation_method: csvRow.valuation_method || null,
    image_url: csvRow.image_url || null,
    sales_description: csvRow.sales_description || null,
    purchase_description: csvRow.purchase_description || null,
  };
};

/**
 * Map Item to CSV export format
 */
export const mapItemToCSV = (item: any): any => {
  return {
    item_name: item.item_name,
    sku: item.sku,
    unit_of_measurement: item.unit_of_measurement,
    description: item.description || '',
    unit_price: item.unit_price,
    cost_price: item.cost_price,
    selling_price: item.selling_price || '',
    current_stock: item.current_stock,
    reorder_point: item.reorder_point,
    max_stock: item.max_stock || '',
    barcode: item.barcode || '',
    hsn_code: item.hsn_code || '',
    brand: item.brand || '',
    manufacturer: item.manufacturer || '',
    tax_rate: item.tax_rate,
    is_active: item.is_active,
    is_sellable: item.is_sellable,
    is_purchasable: item.is_purchasable,
    weight: item.weight || '',
    dimensions: item.dimensions || '',
    upc: item.upc || '',
    mpn: item.mpn || '',
    ean: item.ean || '',
    isbn: item.isbn || '',
    is_returnable: item.is_returnable,
    track_inventory: item.track_inventory,
    track_bin_location: item.track_bin_location,
    advanced_tracking_type: item.advanced_tracking_type || '',
    valuation_method: item.valuation_method || '',
    sales_account: item.sales_account || '',
    purchase_account: item.purchase_account || '',
    inventory_account: item.inventory_account || '',
    image_url: item.image_url || '',
  };
};
