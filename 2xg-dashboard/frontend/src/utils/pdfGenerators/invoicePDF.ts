import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWordsIndian } from './numberToWords';

// Types for Invoice PDF
export interface InvoicePDFItem {
  item_name: string;
  description?: string;
  sku?: string;
  hsn_code?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
}

export interface InvoicePDFData {
  id: string;
  invoice_number: string;
  sales_order_number?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_gstin?: string;
  billing_address?: string;
  shipping_address?: string;
  place_of_supply?: string;
  invoice_date: string;
  due_date?: string;
  payment_terms?: string;
  salesperson_name?: string;
  status: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  shipping_charges?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string;
  terms_conditions?: string;
  line_items: InvoicePDFItem[];
}

interface CompanyInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  gstin: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
}

// Company information (can be made configurable via settings later)
const getCompanyInfo = (): CompanyInfo => ({
  name: '2XG BUSINESS SUITE',
  tagline: 'Business Suite',
  address: 'Business Address',
  city: 'City',
  state: 'State',
  postalCode: '000000',
  country: 'India',
  phone: '+91 98765 43210',
  email: 'info@2xg.com',
  gstin: '29XXXXXXXXXXXZX',
  bankName: 'State Bank of India',
  accountHolder: '2XG ENTERPRISES',
  accountNumber: '1234567890',
  ifscCode: 'SBIN0001234',
  branchName: 'Main Branch',
  accountType: 'CURRENT'
});

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const getStatusColor = (status: string): [number, number, number] => {
  switch (status.toLowerCase()) {
    case 'paid':
      return [39, 174, 96]; // Green
    case 'sent':
    case 'viewed':
      return [41, 128, 185]; // Blue
    case 'draft':
      return [149, 165, 166]; // Gray
    case 'overdue':
    case 'cancelled':
      return [231, 76, 60]; // Red
    case 'partial':
    case 'partially_paid':
      return [243, 156, 18]; // Orange
    default:
      return [0, 0, 0]; // Black
  }
};

/**
 * Generate a professional GST Tax Invoice PDF
 */
export const generateInvoicePDF = (invoice: InvoicePDFData): jsPDF => {
  const doc = new jsPDF();
  const company = getCompanyInfo();
  const pageWidth = doc.internal.pageSize.width;
  let currentY = 15;

  // ==================== SECTION 1: COMPANY HEADER ====================
  // Company name (left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(company.name, 14, currentY);

  // Company tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(company.tagline, 14, currentY + 6);

  // Company details (right side)
  const rightCol = pageWidth - 14;
  doc.setFontSize(8);
  doc.text(company.address, rightCol, currentY, { align: 'right' });
  doc.text(`${company.city}, ${company.state} ${company.postalCode}`, rightCol, currentY + 4, { align: 'right' });
  doc.text(company.country, rightCol, currentY + 8, { align: 'right' });
  doc.text(`GSTIN: ${company.gstin}`, rightCol, currentY + 12, { align: 'right' });
  doc.text(company.phone, rightCol, currentY + 16, { align: 'right' });
  doc.text(company.email, rightCol, currentY + 20, { align: 'right' });

  currentY += 30;

  // ==================== SECTION 2: TAX INVOICE TITLE ====================
  // Blue line
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.8);
  doc.line(14, currentY, pageWidth - 14, currentY);

  currentY += 8;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('TAX INVOICE', pageWidth / 2, currentY, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  currentY += 6;
  doc.line(14, currentY, pageWidth - 14, currentY);

  currentY += 10;

  // ==================== SECTION 3: INVOICE DETAILS BOX ====================
  // Two column layout
  const leftColX = 14;
  const midPoint = pageWidth / 2;

  // Left side - Invoice Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('#', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.invoice_number}`, leftColX + 30, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${formatDate(invoice.invoice_date)}`, leftColX + 30, currentY);

  if (invoice.payment_terms) {
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Terms', leftColX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${invoice.payment_terms}`, leftColX + 30, currentY);
  }

  if (invoice.due_date) {
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date', leftColX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${formatDate(invoice.due_date)}`, leftColX + 30, currentY);
  }

  // Right side - Place of Supply & Sales Person
  let rightY = currentY - (invoice.payment_terms ? 10 : 5);
  if (invoice.place_of_supply) {
    doc.setFont('helvetica', 'bold');
    doc.text('Place Of Supply', midPoint + 10, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${invoice.place_of_supply}`, midPoint + 45, rightY);
    rightY += 5;
  }

  if (invoice.salesperson_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Sales person', midPoint + 10, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${invoice.salesperson_name}`, midPoint + 45, rightY);
  }

  currentY += 12;

  // ==================== SECTION 4: BILL TO ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To', leftColX, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.customer_name, leftColX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (invoice.billing_address) {
    const addressLines = doc.splitTextToSize(invoice.billing_address, 80);
    doc.text(addressLines, leftColX, currentY);
    currentY += addressLines.length * 4;
  }

  if (invoice.customer_gstin) {
    doc.text(`GSTIN: ${invoice.customer_gstin}`, leftColX, currentY);
    currentY += 4;
  }

  if (invoice.customer_phone) {
    doc.text(invoice.customer_phone, leftColX, currentY);
    currentY += 4;
  }

  if (invoice.customer_email) {
    doc.text(invoice.customer_email, leftColX, currentY);
  }

  currentY += 10;

  // ==================== SECTION 5: ITEMS TABLE WITH GST ====================
  // Prepare table data with CGST/SGST split
  const tableBody = invoice.line_items.map((item, index) => {
    const taxRate = item.tax_rate || 0;
    const halfRate = taxRate / 2;
    const baseAmount = item.quantity * item.unit_price;
    const discountAmount = item.discount || 0;
    const taxableAmount = baseAmount - discountAmount;
    const cgstAmount = (taxableAmount * halfRate) / 100;
    const sgstAmount = (taxableAmount * halfRate) / 100;

    return [
      (index + 1).toString(),
      item.sku ? `${item.item_name}\nSKU : ${item.sku}` : item.item_name,
      item.hsn_code || '-',
      item.quantity.toFixed(2),
      formatCurrency(item.unit_price),
      `${halfRate}%`,
      formatCurrency(cgstAmount),
      `${halfRate}%`,
      formatCurrency(sgstAmount),
      formatCurrency(item.total)
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Item & Description', 'HSN\n/SAC', 'Qty', 'Rate', 'CGST\n%', 'CGST\nAmt', 'SGST\n%', 'SGST\nAmt', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 22, halign: 'right' }
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      // Wrap text for item description column
      if (data.column.index === 1 && data.section === 'body') {
        data.cell.styles.cellWidth = 50;
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==================== SECTION 6: TOTALS ====================
  // Calculate tax breakdown
  const totalTax = invoice.tax_amount || 0;
  const cgstTotal = totalTax / 2;
  const sgstTotal = totalTax / 2;
  const taxableAmount = invoice.subtotal - (invoice.discount_amount || 0);

  // Two column layout for totals
  const totalsLabelX = 130;
  const totalsValueX = pageWidth - 14;

  // Total in Words (left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total In Words', leftColX, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const totalWords = numberToWordsIndian(invoice.total_amount);
  const wordsLines = doc.splitTextToSize(totalWords, 100);
  doc.text(wordsLines, leftColX, currentY);

  // Totals (right side)
  let totalsY = currentY - 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Sub Total
  doc.text('Sub Total', totalsLabelX, totalsY);
  doc.text(formatCurrency(invoice.subtotal), totalsValueX, totalsY, { align: 'right' });
  totalsY += 5;
  doc.setFontSize(8);
  doc.text('(Tax Inclusive)', totalsLabelX, totalsY);
  totalsY += 6;

  // Total Taxable Amount
  doc.setFontSize(9);
  doc.text('Total Taxable Amount', totalsLabelX, totalsY);
  doc.text(formatCurrency(taxableAmount), totalsValueX, totalsY, { align: 'right' });
  totalsY += 6;

  // CGST
  const avgTaxRate = invoice.line_items.length > 0
    ? invoice.line_items.reduce((sum, item) => sum + (item.tax_rate || 0), 0) / invoice.line_items.length / 2
    : 9;
  doc.text(`CGST (${avgTaxRate.toFixed(1)}%)`, totalsLabelX, totalsY);
  doc.text(formatCurrency(cgstTotal), totalsValueX, totalsY, { align: 'right' });
  totalsY += 6;

  // SGST
  doc.text(`SGST (${avgTaxRate.toFixed(1)}%)`, totalsLabelX, totalsY);
  doc.text(formatCurrency(sgstTotal), totalsValueX, totalsY, { align: 'right' });
  totalsY += 6;

  // Discount if any
  if (invoice.discount_amount && invoice.discount_amount > 0) {
    doc.text('Discount', totalsLabelX, totalsY);
    doc.text(`-${formatCurrency(invoice.discount_amount)}`, totalsValueX, totalsY, { align: 'right' });
    totalsY += 6;
  }

  // Shipping if any
  if (invoice.shipping_charges && invoice.shipping_charges > 0) {
    doc.text('Shipping Charges', totalsLabelX, totalsY);
    doc.text(formatCurrency(invoice.shipping_charges), totalsValueX, totalsY, { align: 'right' });
    totalsY += 6;
  }

  // Total line
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.line(totalsLabelX, totalsY, totalsValueX, totalsY);
  totalsY += 6;

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total', totalsLabelX, totalsY);
  doc.text(`Rs.${formatCurrency(invoice.total_amount)}`, totalsValueX, totalsY, { align: 'right' });

  currentY = Math.max(currentY + wordsLines.length * 4 + 5, totalsY + 10);

  // ==================== SECTION 7: NOTES ====================
  if (invoice.notes) {
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Notes', leftColX, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(invoice.notes, 100);
    doc.text(noteLines, leftColX, currentY);
    currentY += noteLines.length * 4 + 5;
  }

  // ==================== SECTION 8: BANK DETAILS ====================
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Bank Account Details', leftColX, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Account Holder: ${company.accountHolder}`, leftColX, currentY);
  currentY += 4;
  doc.text(`Account Number: ${company.accountNumber}`, leftColX, currentY);
  currentY += 4;
  doc.text(`IFSC: ${company.ifscCode}`, leftColX, currentY);
  currentY += 4;
  doc.text(`Branch: ${company.branchName}`, leftColX, currentY);
  currentY += 4;
  doc.text(`Account Type: ${company.accountType}`, leftColX, currentY);

  // ==================== SECTION 9: TERMS & CONDITIONS ====================
  if (invoice.terms_conditions) {
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Terms & Conditions', leftColX, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const termLines = doc.splitTextToSize(invoice.terms_conditions, 110);
    doc.text(termLines, leftColX, currentY);
  }

  // ==================== SECTION 10: SIGNATURE ====================
  const signatureY = Math.max(currentY + 20, 250);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`For ${company.name}`, totalsValueX, signatureY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Authorized Signatory', totalsValueX, signatureY + 20, { align: 'right' });

  // ==================== FOOTER ====================
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer generated invoice.', leftColX, pageHeight - 10);
  doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, totalsValueX, pageHeight - 10, { align: 'right' });

  return doc;
};

/**
 * Download invoice as PDF file
 */
export const downloadInvoicePDF = (invoice: InvoicePDFData): void => {
  const doc = generateInvoicePDF(invoice);
  const fileName = `Invoice_${invoice.invoice_number.replace(/[\/\\]/g, '_')}.pdf`;
  doc.save(fileName);
};

/**
 * Open invoice PDF in new browser tab
 */
export const openInvoicePDFInNewTab = (invoice: InvoicePDFData): void => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  // Clean up the URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 100);
};

/**
 * Print invoice PDF
 */
export const printInvoicePDF = (invoice: InvoicePDFData): void => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Create hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.src = pdfUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    }, 500);
  };
};
