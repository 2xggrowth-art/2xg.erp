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
  supply_type?: string;
  reverse_charge?: boolean;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  cess_amount?: number;
  invoice_date: string;
  due_date?: string;
  payment_terms?: string;
  salesperson_name?: string;
  source?: string;
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
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
}

// Company information
const getCompanyInfo = (): CompanyInfo => ({
  name: 'BHARAT CYCLE HUB',
  tagline: 'Defined By Service & Expertise',
  address: 'Main Road, Chikka Bommasandra, Yelahanka',
  addressLine2: 'Bengaluru, Karnataka 560065',
  city: 'bangalore',
  state: 'Karnataka',
  postalCode: '560065',
  country: 'India',
  phone: '9380097119',
  email: 'inventory.bharathcyclehub@gmail.com',
  website: 'Bharathcyclehub.com',
  gstin: '29AMVPI3949R1ZQ',
  bankName: 'HDFC',
  accountHolder: 'BHARAT CYCLE HUB',
  accountNumber: '50200078092592',
  ifscCode: 'HDFC0000371',
  branchName: 'YELAHANKA',
  accountType: 'CURRENT'
});

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

// Shared drawing constants
const ML = 14;       // margin left
const MR = 14;       // margin right
const LW = 0.3;      // line width for borders

/**
 * Generate a professional GST Tax Invoice PDF with proper bordered sections
 */
export const generateInvoicePDF = (invoice: InvoicePDFData): jsPDF => {
  const doc = new jsPDF();
  const company = getCompanyInfo();
  const PW = doc.internal.pageSize.width;   // page width
  const CW = PW - ML - MR;                 // content width
  const RE = PW - MR;                      // right edge

  // Set consistent border style
  const setBorder = () => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(LW);
  };

  let currentY = 10;

  // ====================================================================
  // SECTION 1: COMPANY HEADER (bordered box)
  // ====================================================================
  const headerTop = currentY;

  // Logo placeholder (left side)
  const logoX = ML + 4;
  const logoY = headerTop + 4;
  const logoW = 30;
  const logoH = 30;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(logoX, logoY, logoW, logoH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('LOGO', logoX + logoW / 2, logoY + logoH / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Company details (right of logo)
  const compX = logoX + logoW + 6;
  let ty = headerTop + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(company.name, compX, ty);
  ty += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(company.tagline, compX, ty);
  ty += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(company.address, compX, ty);
  ty += 3.5;
  doc.text(company.addressLine2, compX, ty);
  ty += 3.5;
  doc.text(`GSTIN ${company.gstin}`, compX, ty);
  ty += 3.5;
  doc.text(company.phone, compX, ty);
  ty += 3.5;
  doc.text(company.email, compX, ty);
  ty += 3.5;
  doc.text(company.website, compX, ty);

  // "TAX INVOICE" or "BILL OF SUPPLY" on the right
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const invoiceTitle = invoice.reverse_charge ? 'TAX INVOICE (RCM)' : 'TAX INVOICE';
  doc.text(invoiceTitle, RE - 4, headerTop + 20, { align: 'right' });
  if (invoice.supply_type) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.supply_type === 'inter_state' ? 'Inter-State Supply' : 'Intra-State Supply', RE - 4, headerTop + 26, { align: 'right' });
  }

  const headerBottom = Math.max(ty + 5, logoY + logoH + 6);

  // Draw header border
  setBorder();
  doc.rect(ML, headerTop, CW, headerBottom - headerTop);

  currentY = headerBottom;

  // ====================================================================
  // SECTION 2: INVOICE DETAILS (bordered box with vertical divider)
  // ====================================================================
  const detTop = currentY;
  const midX = ML + CW / 2;
  const pad = 4;
  const rowH = 5.5;
  const lLabelX = ML + pad;
  const lValX = ML + 33;
  const rLabelX = midX + pad;
  const rValX = midX + 38;

  let dy = detTop + pad + 3;
  doc.setFontSize(9);

  // Row 1: # | Place Of Supply
  doc.setFont('helvetica', 'bold');
  doc.text('#', lLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.invoice_number}`, lValX, dy);
  doc.setFont('helvetica', 'bold');
  doc.text('Place Of Supply', rLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.place_of_supply || 'Karnataka (29)'}`, rValX, dy);
  dy += rowH;

  // Row 2: Invoice Date | Sales person
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date', lLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${formatDate(invoice.invoice_date)}`, lValX, dy);
  doc.setFont('helvetica', 'bold');
  doc.text('Sales person', rLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.salesperson_name || '-'}`, rValX, dy);
  dy += rowH;

  // Row 3: Terms | source
  doc.setFont('helvetica', 'bold');
  doc.text('Terms', lLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.payment_terms || 'Due on Receipt'}`, lValX, dy);
  doc.setFont('helvetica', 'bold');
  doc.text('source', rLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.source || 'walking'}`, rValX, dy);
  dy += rowH;

  // Row 4: Due Date | Client No.
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date', lLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.due_date ? formatDate(invoice.due_date) : formatDate(invoice.invoice_date)}`, lValX, dy);
  doc.setFont('helvetica', 'bold');
  doc.text('Client No.', rLabelX, dy);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${invoice.customer_phone || '-'}`, rValX, dy);

  const detBottom = dy + pad;

  // Draw invoice details bordered box + vertical divider
  setBorder();
  doc.rect(ML, detTop, CW, detBottom - detTop);
  doc.line(midX, detTop, midX, detBottom);

  currentY = detBottom;

  // ====================================================================
  // SECTION 3: BILL TO (bordered box)
  // ====================================================================
  const billTop = currentY;
  let by = billTop + pad + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To', lLabelX, by);
  by += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.customer_name, lLabelX, by);
  by += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (invoice.customer_phone) {
    doc.text(invoice.customer_phone, lLabelX, by);
    by += 4;
  }

  if (invoice.billing_address) {
    const addrLines = doc.splitTextToSize(invoice.billing_address, 80);
    doc.text(addrLines, lLabelX, by);
    by += addrLines.length * 4;
  }

  if (invoice.customer_gstin) {
    doc.text(`GSTIN: ${invoice.customer_gstin}`, lLabelX, by);
    by += 4;
  }

  if (invoice.customer_email) {
    doc.text(invoice.customer_email, lLabelX, by);
    by += 4;
  }

  const billBottom = by + pad;

  // Draw bill to bordered box
  setBorder();
  doc.rect(ML, billTop, CW, billBottom - billTop);

  currentY = billBottom;

  // ====================================================================
  // SECTION 4: ITEMS TABLE (grid theme with matching borders)
  // ====================================================================
  // Calculate effective GST rate from invoice-level tax if per-item rates are missing
  // Default to 12% GST (6% CGST + 6% SGST) - tax inclusive pricing
  const DEFAULT_GST_RATE = 12;
  const hasItemTaxRates = invoice.line_items.some(item => (item.tax_rate || 0) > 0);
  const effectiveTaxRate = hasItemTaxRates
    ? 0
    : (invoice.tax_amount || 0) > 0 && invoice.subtotal > 0
      ? ((invoice.tax_amount || 0) / invoice.subtotal) * 100
      : DEFAULT_GST_RATE;

  const tableBody = invoice.line_items.map((item, index) => {
    const taxRate = item.tax_rate || effectiveTaxRate;
    const halfRate = taxRate / 2;
    // Tax inclusive: extract tax from the total amount
    const cgstAmount = (item.total * halfRate) / (100 + taxRate);
    const sgstAmount = (item.total * halfRate) / (100 + taxRate);

    return [
      (index + 1).toString(),
      item.description
        ? `${item.item_name}\n${item.description}`
        : item.item_name,
      item.quantity.toFixed(2),
      halfRate > 0 ? `${halfRate}%` : '-',
      halfRate > 0 ? formatCurrency(cgstAmount) : '-',
      halfRate > 0 ? `${halfRate}%` : '-',
      halfRate > 0 ? formatCurrency(sgstAmount) : '-',
      formatCurrency(item.total)
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[
      '#',
      'Item & Description',
      'Qty',
      { content: 'CGST\n%', styles: { halign: 'center' as const } },
      { content: 'Amt', styles: { halign: 'right' as const } },
      { content: 'SGST\n%', styles: { halign: 'center' as const } },
      { content: 'Amt', styles: { halign: 'right' as const } },
      'Amount'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: LW,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' }
    },
    margin: { left: ML, right: MR },
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // ====================================================================
  // SECTION 5: COMBINED — Left: Total In Words + Notes + Bank + Terms
  //                        Right: Totals + Authorized Signature
  // ====================================================================
  const comboTop = currentY;
  const comboDivX = ML + CW * 0.52; // vertical divider
  const leftW = comboDivX - ML - pad * 2;

  // Use stored GST breakdown if available, otherwise fallback to 50/50 split
  const hasStoredGst = (invoice.cgst_amount || 0) > 0 || (invoice.sgst_amount || 0) > 0 || (invoice.igst_amount || 0) > 0;

  let cgstTotal: number;
  let sgstTotal: number;
  let igstTotal: number;
  let displayCgstRate: number;
  let displaySgstRate: number;
  let displayIgstRate: number;

  if (hasStoredGst) {
    cgstTotal = invoice.cgst_amount || 0;
    sgstTotal = invoice.sgst_amount || 0;
    igstTotal = invoice.igst_amount || 0;
    displayCgstRate = invoice.cgst_rate || 0;
    displaySgstRate = invoice.sgst_rate || 0;
    displayIgstRate = invoice.igst_rate || 0;
  } else {
    const fallbackTaxRate = hasItemTaxRates
      ? (invoice.line_items.reduce((sum, item) => sum + (item.tax_rate || 0), 0) / invoice.line_items.length)
      : effectiveTaxRate;
    const totalTax = (invoice.tax_amount || 0) > 0
      ? invoice.tax_amount!
      : (invoice.subtotal * fallbackTaxRate) / (100 + fallbackTaxRate);
    cgstTotal = totalTax / 2;
    sgstTotal = totalTax / 2;
    igstTotal = 0;
    displayCgstRate = fallbackTaxRate / 2;
    displaySgstRate = fallbackTaxRate / 2;
    displayIgstRate = 0;
  }

  // ---- RIGHT SIDE: Totals breakdown ----
  const tLabelX = comboDivX + pad;
  const tValX = RE - pad;
  let tY = comboTop + pad + 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Sub Total
  doc.text('Sub Total', tLabelX, tY);
  doc.text(formatCurrency(invoice.subtotal), tValX, tY, { align: 'right' });
  tY += 4;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('(Tax Inclusive)', tLabelX, tY);
  doc.setTextColor(0, 0, 0);
  tY += 5;

  doc.setFontSize(9);

  if (igstTotal > 0) {
    // Inter-state: show IGST
    const igstStr = displayIgstRate % 1 === 0 ? String(Math.round(displayIgstRate)) : parseFloat(displayIgstRate.toFixed(2)).toString();
    const igstLabel = displayIgstRate > 0 ? `IGST (${igstStr}%)` : 'IGST';
    doc.text(igstLabel, tLabelX, tY);
    doc.text(formatCurrency(igstTotal), tValX, tY, { align: 'right' });
    tY += 5;
  } else {
    // Intra-state: show CGST + SGST
    const cgstStr = displayCgstRate % 1 === 0 ? String(Math.round(displayCgstRate)) : parseFloat(displayCgstRate.toFixed(2)).toString();
    const cgstLabel = displayCgstRate > 0 ? `CGST (${cgstStr}%)` : 'CGST';
    doc.text(cgstLabel, tLabelX, tY);
    doc.text(formatCurrency(cgstTotal), tValX, tY, { align: 'right' });
    tY += 5;

    const sgstStr = displaySgstRate % 1 === 0 ? String(Math.round(displaySgstRate)) : parseFloat(displaySgstRate.toFixed(2)).toString();
    const sgstLabel = displaySgstRate > 0 ? `SGST (${sgstStr}%)` : 'SGST';
    doc.text(sgstLabel, tLabelX, tY);
    doc.text(formatCurrency(sgstTotal), tValX, tY, { align: 'right' });
    tY += 5;
  }

  // Reverse charge note
  if (invoice.reverse_charge) {
    doc.setFontSize(7);
    doc.setTextColor(200, 0, 0);
    doc.text('Tax payable under Reverse Charge', tLabelX, tY);
    doc.setTextColor(0, 0, 0);
    tY += 5;
  }

  // Discount
  if (invoice.discount_amount && invoice.discount_amount > 0) {
    doc.text('Discount', tLabelX, tY);
    doc.text(`-${formatCurrency(invoice.discount_amount)}`, tValX, tY, { align: 'right' });
    tY += 5;
  }

  // Shipping
  if (invoice.shipping_charges && invoice.shipping_charges > 0) {
    doc.text('Shipping Charges', tLabelX, tY);
    doc.text(formatCurrency(invoice.shipping_charges), tValX, tY, { align: 'right' });
    tY += 5;
  }

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total', tLabelX, tY);
  doc.text(`Rs.${formatCurrency(invoice.total_amount)}`, tValX, tY, { align: 'right' });
  tY += 6;

  // Payment Made
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const amountPaid = invoice.amount_paid || 0;
  doc.text('Payment Made', tLabelX, tY);
  doc.text(`(-) ${formatCurrency(amountPaid)}`, tValX, tY, { align: 'right' });
  tY += 5;

  // Balance Due
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const balanceDue = invoice.balance_due ?? (invoice.total_amount - amountPaid);
  doc.text('Balance Due', tLabelX, tY);
  doc.text(`Rs.${formatCurrency(balanceDue)}`, tValX, tY, { align: 'right' });

  const balanceDueEndY = tY + pad;

  // ---- LEFT SIDE: Total In Words + Notes + Bank + Terms ----
  let ly = comboTop + pad + 3;

  // Total In Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total In Words', lLabelX, ly);
  ly += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const totalWords = `Indian Rupee ${numberToWordsIndian(invoice.total_amount).replace(' Rupees ', ' ').replace(' Rupees', '').replace(' Only', '')} Only`;
  const wordsLines = doc.splitTextToSize(totalWords, leftW);
  doc.text(wordsLines, lLabelX, ly);
  ly += wordsLines.length * 4 + 3;

  // Notes
  const notesText = invoice.notes || 'PLEASE CHECKOUT BHARATHCYCLEHUB.COM FOR MORE DETAILS.';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Notes', lLabelX, ly);
  ly += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const noteLines = doc.splitTextToSize(notesText, leftW);
  doc.text(noteLines, lLabelX, ly);
  ly += noteLines.length * 4 + 4;

  // Bank Details
  doc.text(`Account Holder: ${company.accountHolder}`, lLabelX, ly);
  ly += 4;
  doc.text('Account Number: ', lLabelX, ly);
  doc.setFont('helvetica', 'bold');
  doc.text(company.accountNumber, lLabelX + 30, ly);
  doc.setFont('helvetica', 'normal');
  ly += 4;
  doc.text('IFSC: ', lLabelX, ly);
  doc.setFont('helvetica', 'bold');
  doc.text(company.ifscCode, lLabelX + 11, ly);
  doc.setFont('helvetica', 'normal');
  ly += 4;
  doc.text(`Branch: ${company.branchName}`, lLabelX, ly);
  ly += 4;
  doc.text(`Account Type: ${company.accountType}`, lLabelX, ly);
  ly += 6;

  // Terms & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Terms & Conditions', lLabelX, ly);
  ly += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const termsText = invoice.terms_conditions || 'Good once sold will not be taken back or exchanged\nFrame and fork is guaranteed for long life regarding manufacturing defects only, please refer to the\nmanufacturer\'s warranty policy.\nNo guarantee for tyre, tube, plastic goods, side support wheel, wearable item and tricycles\n1 year service free at the store, this doesn\'t include the bicycle wash\nBusiness time 10:00 am to 9:00 pm';
  const termLines = doc.splitTextToSize(termsText, leftW);
  doc.text(termLines, lLabelX, ly);
  ly += termLines.length * 3.5;

  // Right side: horizontal line after Balance Due (right side only)
  setBorder();
  doc.line(comboDivX, balanceDueEndY, RE, balanceDueEndY);

  // Authorized Signature on right side, right after Balance Due
  const sigLineY = balanceDueEndY + 18;
  doc.line(comboDivX + pad + 10, sigLineY, RE - pad, sigLineY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Authorized Signature', RE - pad, sigLineY + 5, { align: 'right' });

  const rightEndY = sigLineY + 10;

  // Box height = whichever side is taller
  const comboBottom = Math.max(ly + pad, rightEndY);

  // Draw outer border
  setBorder();
  doc.rect(ML, comboTop, CW, comboBottom - comboTop);

  // Vertical divider runs from top to signature section bottom
  doc.line(comboDivX, comboTop, comboDivX, rightEndY);

  // Horizontal line at bottom of signature section (right side only)
  doc.line(comboDivX, rightEndY, RE, rightEndY);

  currentY = comboBottom;

  // ====================================================================
  // FOOTER
  // ====================================================================
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer generated invoice.', ML, pageHeight - 8);
  doc.setTextColor(0, 0, 0);

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
  setTimeout(() => { URL.revokeObjectURL(pdfUrl); }, 60000);
};

/**
 * Print invoice PDF - opens in new tab for reliable printing
 */
export const printInvoicePDF = (invoice: InvoicePDFData): void => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfUrl, '_blank');

  if (!printWindow) {
    doc.save(`Invoice_${invoice.invoice_number.replace(/[\/\\]/g, '_')}.pdf`);
    URL.revokeObjectURL(pdfUrl);
    return;
  }

  setTimeout(() => { URL.revokeObjectURL(pdfUrl); }, 60000);
};
