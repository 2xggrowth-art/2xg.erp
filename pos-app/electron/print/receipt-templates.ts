interface ReceiptData {
  companyName: string;
  companyTagline?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyGstin?: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone?: string;
  salespersonName?: string;
  posOperator?: string;
  items: Array<{
    name: string;
    sku?: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  discountAmount?: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  total: number;
  paymentMode: string;
  referenceNumber?: string;
  amountPaid: number;
  balanceDue?: number;
  isCreditSale?: boolean;
}

export function generateReceiptHtml(data: ReceiptData, paperSize: string = '80mm'): string {
  const maxWidth = paperSize === '58mm' ? '58mm' : paperSize === '80mm' ? '80mm' : '210mm';
  const fontSize = paperSize === '58mm' ? '10px' : '12px';
  const isNarrow = paperSize === '58mm' || paperSize === '80mm';

  const itemRows = data.items
    .map(
      (item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <div style="font-weight:600">${item.name}</div>
        ${item.sku ? `<div style="font-size:${paperSize === '58mm' ? '8px' : '10px'};color:#777">SKU: ${item.sku}</div>` : ''}
      </td>
      <td class="center">${item.qty}</td>
      <td class="right">${formatCurrency(item.rate)}</td>
      <td class="right" style="font-weight:600">${formatCurrency(item.amount)}</td>
    </tr>`
    )
    .join('');

  const totalQty = data.items.reduce((sum, i) => sum + i.qty, 0);

  return `<!DOCTYPE html>
<html><head><title>Receipt - ${data.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    padding: ${isNarrow ? '5px' : '20px'};
    max-width: ${maxWidth};
    margin: 0 auto;
    font-size: ${fontSize};
    line-height: 1.4;
    color: #000;
  }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
  .company-name { font-size: ${isNarrow ? '16px' : '20px'}; font-weight: bold; letter-spacing: 1px; }
  .company-sub { font-size: ${isNarrow ? '9px' : '11px'}; color: #555; margin-top: 2px; }
  .bill-title { font-size: ${isNarrow ? '12px' : '14px'}; font-weight: bold; margin-top: 4px; letter-spacing: 2px; }
  .info-section { margin: 6px 0; }
  .info-row { display: flex; padding: 1px 0; font-size: ${isNarrow ? '10px' : '12px'}; }
  .info-label { width: ${isNarrow ? '80px' : '120px'}; flex-shrink: 0; color: #555; }
  .info-value { flex: 1; font-weight: 600; }
  .separator { border-top: 1px dashed #999; margin: 6px 0; }
  .separator-bold { border-top: 2px solid #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  thead th { text-align: left; font-size: ${isNarrow ? '9px' : '11px'}; font-weight: bold; text-transform: uppercase; padding: 4px 2px; border-bottom: 1px solid #000; }
  thead th.right { text-align: right; }
  thead th.center { text-align: center; }
  tbody td { padding: 3px 2px; font-size: ${fontSize}; border-bottom: 1px dashed #ddd; vertical-align: top; }
  tbody td.right { text-align: right; }
  tbody td.center { text-align: center; }
  .totals { margin: 6px 0; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: ${isNarrow ? '11px' : '12px'}; }
  .total-label { color: #555; }
  .total-value { font-weight: 600; }
  .grand-total { display: flex; justify-content: space-between; padding: 6px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 4px 0; }
  .grand-total span:first-child { font-size: ${isNarrow ? '14px' : '16px'}; font-weight: bold; }
  .grand-total span:last-child { font-size: ${isNarrow ? '14px' : '16px'}; font-weight: bold; }
  .payment-box { background: #f5f5f5; padding: 6px 8px; border-radius: 4px; margin: 6px 0; }
  .payment-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: ${isNarrow ? '10px' : '12px'}; }
  .paid-badge { text-align: center; font-size: ${isNarrow ? '10px' : '11px'}; font-weight: bold; letter-spacing: 2px; margin: 4px 0; }
  .footer { text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #999; }
  .footer p { font-size: ${isNarrow ? '9px' : '11px'}; color: #777; margin: 2px 0; }
  .thank-you { font-size: ${isNarrow ? '11px' : '13px'}; font-weight: bold; color: #333; }
  @media print { body { padding: ${isNarrow ? '2px' : '10px'}; } }
</style></head>
<body>
  <div class="header">
    <div class="company-name">${data.companyName}</div>
    ${data.companyTagline ? `<div class="company-sub">${data.companyTagline}</div>` : ''}
    ${data.companyAddress ? `<div class="company-sub">${data.companyAddress}</div>` : ''}
    ${data.companyPhone ? `<div class="company-sub">Tel: ${data.companyPhone}</div>` : ''}
    ${data.companyGstin ? `<div class="company-sub">GSTIN: ${data.companyGstin}</div>` : ''}
    <div class="bill-title">TAX INVOICE</div>
  </div>

  <div class="info-section">
    <div class="info-row"><span class="info-label">Invoice No</span><span class="info-value">: ${data.invoiceNumber}</span></div>
    <div class="info-row"><span class="info-label">Date</span><span class="info-value">: ${data.invoiceDate}</span></div>
    <div class="info-row"><span class="info-label">Customer</span><span class="info-value">: ${data.customerName}</span></div>
    ${data.customerPhone ? `<div class="info-row"><span class="info-label">Mobile</span><span class="info-value">: ${data.customerPhone}</span></div>` : ''}
    ${data.salespersonName ? `<div class="info-row"><span class="info-label">Salesperson</span><span class="info-value">: ${data.salespersonName}</span></div>` : ''}
    ${data.posOperator ? `<div class="info-row"><span class="info-label">Operator</span><span class="info-value">: ${data.posOperator}</span></div>` : ''}
  </div>

  <div class="separator-bold"></div>

  <table>
    <thead>
      <tr>
        <th style="width:8%">#</th>
        <th style="width:${isNarrow ? '38%' : '42%'}">Item</th>
        <th class="center" style="width:12%">Qty</th>
        <th class="right" style="width:${isNarrow ? '20%' : '18%'}">Rate</th>
        <th class="right" style="width:${isNarrow ? '22%' : '20%'}">Amt</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="separator"></div>

  <div class="totals">
    <div class="total-row">
      <span class="total-label">Subtotal (${data.items.length} items, ${totalQty} qty)</span>
      <span class="total-value">${formatCurrency(data.subtotal)}</span>
    </div>
    ${data.discountAmount && data.discountAmount > 0 ? `
    <div class="total-row">
      <span class="total-label">Discount${data.discountType === 'percentage' ? ` (${data.discountValue}%)` : ''}</span>
      <span class="total-value">-${formatCurrency(data.discountAmount)}</span>
    </div>` : ''}
    ${data.cgstAmount && data.cgstAmount > 0 ? `
    <div class="total-row">
      <span class="total-label">CGST (${data.cgstRate}%)</span>
      <span class="total-value">${formatCurrency(data.cgstAmount)}</span>
    </div>` : ''}
    ${data.sgstAmount && data.sgstAmount > 0 ? `
    <div class="total-row">
      <span class="total-label">SGST (${data.sgstRate}%)</span>
      <span class="total-value">${formatCurrency(data.sgstAmount)}</span>
    </div>` : ''}
  </div>

  <div class="grand-total">
    <span>TOTAL</span>
    <span>${formatCurrency(data.total)}</span>
  </div>

  <div class="payment-box">
    <div class="payment-row"><span>Payment Mode</span><span style="font-weight:bold;color:#16a34a">${data.paymentMode}</span></div>
    ${data.referenceNumber ? `<div class="payment-row"><span>Reference No</span><span style="font-weight:600">${data.referenceNumber}</span></div>` : ''}
    <div class="payment-row"><span>Amount Paid</span><span style="font-weight:600">${formatCurrency(data.amountPaid)}</span></div>
    ${data.balanceDue && data.balanceDue > 0 ? `<div class="payment-row"><span>Balance Due</span><span style="font-weight:600;color:#f97316">${formatCurrency(data.balanceDue)}</span></div>` : ''}
  </div>

  ${data.isCreditSale && data.balanceDue && data.balanceDue > 0
    ? `<div class="paid-badge" style="color:#f97316">--- CREDIT SALE - PENDING ---</div>`
    : `<div class="paid-badge" style="color:#16a34a">--- PAID ---</div>`}

  <div class="footer">
    <p class="thank-you">Thank You For Your Purchase!</p>
    <p>Visit us again</p>
    <p style="margin-top:6px">Powered by 2XG POS</p>
  </div>
</body></html>`;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}
