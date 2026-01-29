import { jsonToCSV, downloadCSV } from './csvParser';

/**
 * Invoice import fields
 */
export const INVOICE_IMPORT_FIELDS = {
  // Required fields
  invoice_number: { required: true, type: 'string', description: 'Unique invoice number' },
  customer_name: { required: true, type: 'string', description: 'Customer name' },
  invoice_date: { required: true, type: 'date', description: 'Invoice date (YYYY-MM-DD)' },

  // Financial fields
  taxable_value: { required: true, type: 'number', description: 'Taxable amount (before GST)' },
  gst: { required: true, type: 'number', description: 'GST amount' },
  invoice_value: { required: true, type: 'number', description: 'Total invoice value (incl. GST)' },

  // Optional fields
  order_number: { required: false, type: 'string', description: 'Related order number' },
  due_date: { required: false, type: 'date', description: 'Payment due date (YYYY-MM-DD)' },
  customer_email: { required: false, type: 'string', description: 'Customer email' },
  customer_phone: { required: false, type: 'string', description: 'Customer phone' },
  customer_gstin: { required: false, type: 'string', description: 'Customer GSTIN' },
  billing_address: { required: false, type: 'string', description: 'Billing address' },
  shipping_address: { required: false, type: 'string', description: 'Shipping address' },
  place_of_supply: { required: false, type: 'string', description: 'Place of supply' },
  payment_terms: { required: false, type: 'string', description: 'Payment terms' },
  salesperson_name: { required: false, type: 'string', description: 'Salesperson name' },
  subject: { required: false, type: 'string', description: 'Invoice subject/title' },
  customer_notes: { required: false, type: 'string', description: 'Notes for customer' },
  terms_conditions: { required: false, type: 'string', description: 'Terms and conditions' },
  discount_amount: { required: false, type: 'number', description: 'Discount amount', default: 0 },
  shipping_charges: { required: false, type: 'number', description: 'Shipping charges', default: 0 },
  adjustment: { required: false, type: 'number', description: 'Adjustment amount', default: 0 },
  status: { required: false, type: 'string', description: 'Invoice status (draft/sent/paid)', default: 'draft' },
};

/**
 * Column order for export
 */
export const EXPORT_COLUMN_ORDER = [
  'invoice_number',
  'customer_name',
  'invoice_date',
  'due_date',
  'taxable_value',
  'gst',
  'invoice_value',
  'order_number',
  'customer_email',
  'customer_phone',
  'customer_gstin',
  'billing_address',
  'shipping_address',
  'place_of_supply',
  'payment_terms',
  'salesperson_name',
  'subject',
  'discount_amount',
  'shipping_charges',
  'status',
];

/**
 * Generate CSV template with sample data
 */
export const generateInvoiceImportTemplate = () => {
  const sampleData = [
    {
      invoice_number: 'INV-001',
      customer_name: 'Sample Customer 1',
      invoice_date: '2026-01-29',
      due_date: '2026-02-28',
      taxable_value: '10000.00',
      gst: '1800.00',
      invoice_value: '11800.00',
      order_number: 'SO-001',
      customer_email: 'customer1@example.com',
      customer_phone: '+91-9876543210',
      customer_gstin: '29ABCDE1234F1Z5',
      billing_address: '123 Main St, City',
      shipping_address: '123 Main St, City',
      place_of_supply: 'Karnataka',
      payment_terms: 'Net 30',
      salesperson_name: 'John Doe',
      subject: 'Invoice for Services',
      discount_amount: '0',
      shipping_charges: '0',
      status: 'draft',
    },
    {
      invoice_number: 'INV-002',
      customer_name: 'Sample Customer 2',
      invoice_date: '2026-01-29',
      due_date: '2026-02-15',
      taxable_value: '25000.00',
      gst: '4500.00',
      invoice_value: '29500.00',
      order_number: 'SO-002',
      customer_email: 'customer2@example.com',
      customer_phone: '+91-9876543211',
      customer_gstin: '',
      billing_address: '456 Park Ave, Town',
      shipping_address: '456 Park Ave, Town',
      place_of_supply: 'Maharashtra',
      payment_terms: 'Net 15',
      salesperson_name: 'Jane Smith',
      subject: '',
      discount_amount: '500',
      shipping_charges: '0',
      status: 'sent',
    },
  ];

  const csv = jsonToCSV(sampleData, EXPORT_COLUMN_ORDER);
  downloadCSV(csv, `invoice_import_template_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Map CSV data to Invoice creation format
 */
export const mapCSVToInvoiceData = (csvRow: any): any => {
  // Calculate subtotal and tax from provided values
  const taxable_value = csvRow.taxable_value ? parseFloat(csvRow.taxable_value) : 0;
  const gst = csvRow.gst ? parseFloat(csvRow.gst) : 0;
  const invoice_value = csvRow.invoice_value ? parseFloat(csvRow.invoice_value) : taxable_value + gst;

  return {
    invoice_number: csvRow.invoice_number,
    customer_name: csvRow.customer_name,
    customer_email: csvRow.customer_email || null,
    customer_phone: csvRow.customer_phone || null,
    customer_gstin: csvRow.customer_gstin || null,
    invoice_date: csvRow.invoice_date,
    due_date: csvRow.due_date || null,
    order_number: csvRow.order_number || null,
    billing_address: csvRow.billing_address || null,
    shipping_address: csvRow.shipping_address || null,
    place_of_supply: csvRow.place_of_supply || null,
    payment_terms: csvRow.payment_terms || null,
    salesperson_name: csvRow.salesperson_name || null,
    subject: csvRow.subject || null,
    customer_notes: csvRow.customer_notes || null,
    terms_conditions: csvRow.terms_conditions || null,
    discount_amount: csvRow.discount_amount ? parseFloat(csvRow.discount_amount) : 0,
    shipping_charges: csvRow.shipping_charges ? parseFloat(csvRow.shipping_charges) : 0,
    adjustment: csvRow.adjustment ? parseFloat(csvRow.adjustment) : 0,
    subtotal: taxable_value,
    tax_amount: gst,
    total_amount: invoice_value,
    balance_due: invoice_value, // Initially, balance due equals total amount
    status: csvRow.status || 'draft',
    payment_status: 'Unpaid',
  };
};

/**
 * Map Invoice to CSV export format
 */
export const mapInvoiceToCSV = (invoice: any): any => {
  return {
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer_name,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date || '',
    taxable_value: invoice.subtotal || invoice.taxable_value || '',
    gst: invoice.tax_amount || invoice.gst || '',
    invoice_value: invoice.total_amount || invoice.invoice_value || '',
    order_number: invoice.order_number || invoice.sales_order_number || '',
    customer_email: invoice.customer_email || '',
    customer_phone: invoice.customer_phone || '',
    customer_gstin: invoice.customer_gstin || '',
    billing_address: invoice.billing_address || '',
    shipping_address: invoice.shipping_address || '',
    place_of_supply: invoice.place_of_supply || '',
    payment_terms: invoice.payment_terms || '',
    salesperson_name: invoice.salesperson_name || '',
    subject: invoice.subject || '',
    discount_amount: invoice.discount_amount || '',
    shipping_charges: invoice.shipping_charges || '',
    status: invoice.status || '',
  };
};
