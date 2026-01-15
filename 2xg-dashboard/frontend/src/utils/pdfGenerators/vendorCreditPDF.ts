import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VendorCredit, VendorCreditItem } from '../../services/vendor-credits.service';

export const generateVendorCreditPDF = (credit: VendorCredit) => {
  const doc = new jsPDF();

  // Set font
  doc.setFont('helvetica');

  // Header - Company Name
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('2XG Dashboard', 14, 20);

  doc.setFontSize(10);
  doc.text('Business Suite', 14, 26);

  // Document Title
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.text('VENDOR CREDIT NOTE', 14, 40);

  // Credit Details Box
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Left side - Vendor details
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(credit.vendor_name, 14, 58);
  if (credit.vendor_email) {
    doc.text(credit.vendor_email, 14, 64);
  }
  if (credit.vendor_phone) {
    doc.text(credit.vendor_phone, 14, 70);
  }

  // Right side - Credit information
  const rightColumn = 120;
  doc.setFont('helvetica', 'bold');
  doc.text('Credit Note#:', rightColumn, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(credit.credit_number, rightColumn + 35, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightColumn, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(credit.credit_date), rightColumn + 35, 58);

  if (credit.reference_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('Reference#:', rightColumn, 64);
    doc.setFont('helvetica', 'normal');
    doc.text(credit.reference_number, rightColumn + 35, 64);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', rightColumn, 70);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(getStatusColor(credit.status));
  doc.text(credit.status.toUpperCase(), rightColumn + 35, 70);
  doc.setTextColor(0, 0, 0);

  // Subject
  if (credit.subject) {
    doc.setFont('helvetica', 'bold');
    doc.text('Subject:', 14, 82);
    doc.setFont('helvetica', 'normal');
    doc.text(credit.subject, 14, 88);
  }

  // Items Table
  const startY = credit.subject ? 95 : 82;

  const tableData = credit.items?.map((item: VendorCreditItem) => [
    item.item_name,
    item.description || '-',
    item.account || '-',
    item.quantity.toString(),
    formatCurrency(item.rate),
    formatCurrency(item.amount)
  ]) || [];

  autoTable(doc, {
    startY: startY,
    head: [['Item Name', 'Description', 'Account', 'Quantity', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals section
  const totalsX = 140;
  let currentY = finalY;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, currentY);
  doc.text(formatCurrency(credit.subtotal), 185, currentY, { align: 'right' });

  currentY += 6;
  if (credit.discount_amount > 0) {
    doc.text('Discount:', totalsX, currentY);
    doc.text(`-${formatCurrency(credit.discount_amount)}`, 185, currentY, { align: 'right' });
    currentY += 6;
  }

  if (credit.tax_amount > 0) {
    const taxLabel = credit.tax_type === 'TDS' ? 'TDS (Deducted):' : credit.tax_type === 'TCS' ? 'TCS:' : 'Tax:';
    doc.text(taxLabel, totalsX, currentY);
    const taxDisplay = credit.tax_type === 'TDS'
      ? `-${formatCurrency(credit.tax_amount)}`
      : formatCurrency(credit.tax_amount);
    doc.text(taxDisplay, 185, currentY, { align: 'right' });
    currentY += 6;
  }

  if (credit.adjustment !== 0) {
    doc.text('Adjustment:', totalsX, currentY);
    doc.text(formatCurrency(credit.adjustment), 185, currentY, { align: 'right' });
    currentY += 6;
  }

  // Total line
  doc.setLineWidth(0.5);
  doc.line(totalsX, currentY, 185, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX, currentY);
  doc.text(formatCurrency(credit.total_amount), 185, currentY, { align: 'right' });

  // Balance
  currentY += 8;
  doc.setFontSize(10);
  doc.text('Balance Due:', totalsX, currentY);
  doc.text(formatCurrency(credit.balance), 185, currentY, { align: 'right' });

  // Notes
  if (credit.notes) {
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(credit.notes, 180);
    doc.text(splitNotes, 14, currentY);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by 2XG Dashboard - Business Suite', 14, pageHeight - 10);
  doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 185, pageHeight - 10, { align: 'right' });

  return doc;
};

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
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

const getStatusColor = (status: string): [number, number, number] => {
  switch (status) {
    case 'open':
      return [41, 128, 185]; // Blue
    case 'closed':
      return [39, 174, 96]; // Green
    case 'draft':
      return [149, 165, 166]; // Gray
    case 'cancelled':
      return [231, 76, 60]; // Red
    default:
      return [0, 0, 0]; // Black
  }
};

export const downloadVendorCreditPDF = (credit: VendorCredit) => {
  const doc = generateVendorCreditPDF(credit);
  const fileName = `Vendor_Credit_${credit.credit_number.replace(/\//g, '_')}.pdf`;
  doc.save(fileName);
};

export const openVendorCreditPDFInNewTab = (credit: VendorCredit) => {
  const doc = generateVendorCreditPDF(credit);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  // Clean up the URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 100);
};
