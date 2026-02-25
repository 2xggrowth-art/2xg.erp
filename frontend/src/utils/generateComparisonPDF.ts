import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FeatureRow {
  feature: string;
  zoho: string;
  twoxg: string;
  status: 'done' | 'partial' | 'missing';
}

interface FeatureCategory {
  category: string;
  features: FeatureRow[];
}

const getStatusSymbol = (status: string): string => {
  switch (status) {
    case 'done': return 'DONE';
    case 'partial': return 'PARTIAL';
    case 'missing': return 'MISSING';
    default: return '-';
  }
};

export const generateComparisonPDF = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let currentY = 15;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('2XG ERP vs Zoho Inventory', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Feature Comparison & Gap Analysis', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, currentY, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  currentY += 8;

  // Legend
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Legend:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 139, 34);
  doc.text('DONE = Fully implemented', 35, currentY);
  doc.setTextColor(200, 150, 0);
  doc.text('PARTIAL = Partially done', 80, currentY);
  doc.setTextColor(200, 0, 0);
  doc.text('MISSING = Not yet built', 125, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 6;

  // Summary stats
  const allFeatures = featureData.flatMap(c => c.features);
  const done = allFeatures.filter(f => f.status === 'done').length;
  const partial = allFeatures.filter(f => f.status === 'partial').length;
  const missing = allFeatures.filter(f => f.status === 'missing').length;
  const total = allFeatures.length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Summary: ${done} Done (${Math.round(done/total*100)}%)  |  ${partial} Partial (${Math.round(partial/total*100)}%)  |  ${missing} Missing (${Math.round(missing/total*100)}%)  |  Total: ${total} features`, 14, currentY);
  currentY += 8;

  // Generate tables for each category
  featureData.forEach((category) => {
    // Check if we need a new page
    if (currentY > 260) {
      doc.addPage();
      currentY = 15;
    }

    // Category header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(41, 128, 185);
    doc.text(category.category, 14, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 2;

    const tableBody = category.features.map(f => [
      f.feature,
      f.zoho,
      f.twoxg,
      getStatusSymbol(f.status)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Feature', 'Zoho Inventory', '2XG ERP', 'Status']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 55 },
        2: { cellWidth: 55 },
        3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const val = data.cell.raw as string;
          if (val === 'DONE') {
            data.cell.styles.textColor = [34, 139, 34];
          } else if (val === 'PARTIAL') {
            data.cell.styles.textColor = [200, 150, 0];
          } else if (val === 'MISSING') {
            data.cell.styles.textColor = [200, 0, 0];
          }
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  });

  // Priority recommendations page
  doc.addPage();
  currentY = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text('Priority Recommendations', 14, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 10;

  const priorities = [
    { priority: 'HIGH', items: [
      'Estimates/Quotes - Essential for sales workflow before SO creation',
      'Credit Notes (Sales) - Required for handling returns and credits',
      'Inventory Adjustments - Critical for stock accuracy beyond stock counts',
      'Sales Returns (RMA) - Formal return process with stock restoration',
      'Organization Settings Page - Configurable company info for invoices/PDFs',
      'Reorder Alerts - Auto notifications when stock hits reorder point',
      'Custom Fields on Items - Extensibility for business-specific data',
      'Multi-warehouse stock visibility per item - See stock across all locations',
    ]},
    { priority: 'MEDIUM', items: [
      'Packages & Packing Slips - Order fulfillment workflow',
      'Shipment Tracking - Carrier integration for delivery tracking',
      'Recurring Invoices/Bills - Auto-generation for repeat transactions',
      'Landed Costs - Freight/customs allocation on purchases',
      'Price Lists - Customer/vendor specific pricing tiers',
      'Approval Workflows - Multi-level PO/SO/Bill approvals',
      'Audit Trail - Version history for all transactions',
      'PDF Template Customization - Per-module template editor',
    ]},
    { priority: 'LOW', items: [
      'Customer/Vendor Portal - Self-service portals',
      'Payment Links - Online payment collection',
      'Multi-Currency - Multiple currency support',
      'Multi-Language - Template language customization',
      'Drop Shipments - Direct vendor-to-customer shipping',
      'Composite Items (Kits/Bundles) - Item grouping without assembly',
      'Webhook/API integrations - External system connectivity',
      'Scheduled Reports - Auto-email reports on interval',
    ]}
  ];

  priorities.forEach(p => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const color: [number, number, number] = p.priority === 'HIGH' ? [200, 0, 0] : p.priority === 'MEDIUM' ? [200, 150, 0] : [100, 100, 100];
    doc.setTextColor(...color);
    doc.text(`${p.priority} PRIORITY`, 14, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    p.items.forEach(item => {
      if (currentY > 280) {
        doc.addPage();
        currentY = 15;
      }
      doc.text(`•  ${item}`, 18, currentY);
      currentY += 4;
    });
    currentY += 4;
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 8, { align: 'center' });
    doc.text('2XG ERP - Feature Gap Analysis', 14, doc.internal.pageSize.height - 8);
  }

  doc.save('2XG_ERP_vs_Zoho_Inventory_Comparison.pdf');
};

// ==================== FEATURE DATA ====================
const featureData: FeatureCategory[] = [
  {
    category: '1. ITEM & INVENTORY MANAGEMENT',
    features: [
      { feature: 'Items CRUD', zoho: 'Full CRUD with images, custom fields', twoxg: 'Full CRUD with SKU, category, subcategory', status: 'done' },
      { feature: 'Item Categories', zoho: 'Categories with custom fields', twoxg: 'Categories + subcategories', status: 'done' },
      { feature: 'Item Variants', zoho: 'Item groups by size/color/etc', twoxg: 'Size, color, variant fields on items', status: 'partial' },
      { feature: 'Composite/Assembly Items', zoho: 'BOM, bundle, unbundle, multi-level', twoxg: 'Buildline assembly with stages/checklists', status: 'partial' },
      { feature: 'Kit Items (no assembly)', zoho: 'Grouped items sold as unit', twoxg: 'Not available', status: 'missing' },
      { feature: 'Serial Number Tracking', zoho: 'Full lifecycle tracking', twoxg: 'Auto-generated on bills, tracked in JSONB', status: 'done' },
      { feature: 'Batch Tracking', zoho: 'Batch with expiry dates', twoxg: 'Batch tracking with FIFO deduction', status: 'done' },
      { feature: 'Inventory Adjustments', zoho: 'Qty & value adjustments with reasons', twoxg: 'Stock counts only (no direct adjustments)', status: 'partial' },
      { feature: 'Stock Counts', zoho: 'Basic stock count', twoxg: 'Full workflow: claim > count > submit > approve', status: 'done' },
      { feature: 'Reorder Point Alerts', zoho: 'Auto notifications at reorder level', twoxg: 'Reorder point field exists, no alerts', status: 'partial' },
      { feature: 'Item Images', zoho: 'Multiple images per item', twoxg: 'No image support', status: 'missing' },
      { feature: 'Custom Fields', zoho: 'Up to 5 custom fields per module', twoxg: 'Not available', status: 'missing' },
      { feature: 'Barcode Generation', zoho: 'EAN-13, UPC-A, Code 39, ITF', twoxg: 'Barcode labels from bills', status: 'partial' },
      { feature: 'QR Code', zoho: 'QR code generation & scanning', twoxg: 'Not available', status: 'missing' },
      { feature: 'Brands & Manufacturers', zoho: 'Via custom fields', twoxg: 'Dedicated brands & manufacturers module', status: 'done' },
      { feature: 'Units of Measurement', zoho: 'Custom UoM', twoxg: 'unit_of_measurement field', status: 'done' },
      { feature: 'Price Lists', zoho: 'Sales/purchase, volume, per-currency', twoxg: 'Not available', status: 'missing' },
      { feature: 'Inventory Valuation', zoho: 'FIFO and Weighted Average', twoxg: 'Not implemented', status: 'missing' },
    ]
  },
  {
    category: '2. WAREHOUSING & LOCATIONS',
    features: [
      { feature: 'Multi-Location', zoho: 'Unlimited warehouses', twoxg: 'Locations table with CRUD', status: 'done' },
      { feature: 'Bin Locations', zoho: 'Zones + bins (2000-5000/warehouse)', twoxg: 'Bin locations with dynamic stock calc', status: 'done' },
      { feature: 'Bin Stock Tracking', zoho: 'Bin-level stock visibility', twoxg: 'Dynamic: purchases - sales - transfers', status: 'done' },
      { feature: 'Stock Transfers', zoho: 'Full transfer order workflow', twoxg: 'Transfer orders with allocation records', status: 'done' },
      { feature: 'Putaway/Placement', zoho: 'Putaway from purchase receives', twoxg: 'Placement tasks from bills', status: 'done' },
      { feature: 'Transfer Tasks', zoho: 'Via transfer orders', twoxg: 'Dedicated transfer task management', status: 'done' },
      { feature: 'Picklists', zoho: 'Auto-generate from SO, barcode scan', twoxg: 'Not available', status: 'missing' },
      { feature: 'Move Orders (within WH)', zoho: 'Move items between bins', twoxg: 'Not available', status: 'missing' },
      { feature: 'Zone Management', zoho: 'Define zones within warehouses', twoxg: 'Assembly bins have zone support', status: 'partial' },
    ]
  },
  {
    category: '3. PURCHASES',
    features: [
      { feature: 'Purchase Orders', zoho: 'Full PO lifecycle, approvals', twoxg: 'PO CRUD with status tracking', status: 'done' },
      { feature: 'Bills (Vendor Invoices)', zoho: 'Bills from PO, partial payments', twoxg: 'Bills with serial/batch, tax, bin allocation', status: 'done' },
      { feature: 'Vendor Management', zoho: 'Full profiles, statements, portal', twoxg: 'Vendor CRUD with summary', status: 'done' },
      { feature: 'Vendor Credits', zoho: 'Credits applied to bills', twoxg: 'Vendor credits with bill application', status: 'done' },
      { feature: 'Payments Made', zoho: 'Payment tracking to vendors', twoxg: 'Payment made with tracking', status: 'done' },
      { feature: 'Purchase Receives', zoho: 'Receive against PO, partial', twoxg: 'Bills serve as receive records', status: 'partial' },
      { feature: 'Landed Costs', zoho: 'Freight, customs allocation', twoxg: 'Not available', status: 'missing' },
      { feature: 'Backorders', zoho: 'Auto PO from out-of-stock sales', twoxg: 'Not available', status: 'missing' },
      { feature: 'Drop Shipments', zoho: 'Vendor direct to customer', twoxg: 'Not available', status: 'missing' },
      { feature: 'Ledger Account', zoho: 'Via Zoho Books integration', twoxg: 'Ledger account view', status: 'done' },
    ]
  },
  {
    category: '4. SALES',
    features: [
      { feature: 'Estimates/Quotes', zoho: 'Create, send, convert to SO/Invoice', twoxg: 'Not available', status: 'missing' },
      { feature: 'Sales Orders', zoho: 'Full SO lifecycle, approvals', twoxg: 'SO CRUD with status tracking', status: 'done' },
      { feature: 'Invoices', zoho: 'Full invoice lifecycle, online payment', twoxg: 'Invoice CRUD with PDF, print, email', status: 'done' },
      { feature: 'Invoice PDF', zoho: 'Customizable templates, multi-lang', twoxg: 'GST tax invoice PDF with CGST/SGST', status: 'done' },
      { feature: 'Delivery Challans', zoho: 'Challan creation and tracking', twoxg: 'Delivery challan CRUD', status: 'done' },
      { feature: 'Customer Management', zoho: 'Full profiles, statements, portal', twoxg: 'Customer CRUD with summary', status: 'done' },
      { feature: 'Payments Received', zoho: 'Multi-invoice payment, gateways', twoxg: 'Payment received tracking', status: 'done' },
      { feature: 'Credit Notes (Sales)', zoho: 'Credits for returns, apply to invoices', twoxg: 'Not available', status: 'missing' },
      { feature: 'Sales Returns (RMA)', zoho: 'Return flow with stock restoration', twoxg: 'Exchanges module (basic)', status: 'partial' },
      { feature: 'Packages & Packing Slips', zoho: 'Package from SO, barcode picking', twoxg: 'Not available', status: 'missing' },
      { feature: 'Shipment Tracking', zoho: '40+ carriers, labels, tracking', twoxg: 'Not available', status: 'missing' },
      { feature: 'Recurring Invoices', zoho: 'Auto-generate on schedule', twoxg: 'Not available', status: 'missing' },
      { feature: 'Payment Links', zoho: 'Online payment collection links', twoxg: 'Not available', status: 'missing' },
    ]
  },
  {
    category: '5. POINT OF SALE (POS)',
    features: [
      { feature: 'POS Sessions', zoho: 'Multi-branch, cash/card/bank', twoxg: 'POS sessions with cash movements', status: 'done' },
      { feature: 'Quick Billing', zoho: 'Barcode scan, tap-to-add', twoxg: 'Item search and add to cart', status: 'done' },
      { feature: 'Payment Methods', zoho: 'Cash, card, check, bank', twoxg: 'Multiple payment methods', status: 'done' },
      { feature: 'Sales Lock (Assembly)', zoho: 'N/A', twoxg: 'Block POS sale if assembly incomplete', status: 'done' },
      { feature: 'POS Reports', zoho: 'Product & customer analytics', twoxg: 'Session detail with sales data', status: 'partial' },
    ]
  },
  {
    category: '6. BUILDLINE / MANUFACTURING',
    features: [
      { feature: 'Assembly Journeys', zoho: 'Bundle/unbundle composites', twoxg: 'Full assembly journey with stages', status: 'done' },
      { feature: 'Assembly Checklists', zoho: 'N/A (basic BOM only)', twoxg: 'Per-stage checklists with completion tracking', status: 'done' },
      { feature: 'Technician Dashboard', zoho: 'N/A', twoxg: 'Mobile queue, scanner, checklist UI', status: 'done' },
      { feature: 'Supervisor Kanban', zoho: 'N/A', twoxg: 'Kanban board for assembly stages', status: 'done' },
      { feature: 'QC Process', zoho: 'N/A', twoxg: 'QC submission and result tracking', status: 'done' },
      { feature: 'Damage Reporting', zoho: 'N/A', twoxg: 'Damage reports with photos and review', status: 'done' },
      { feature: 'Bike Inward (Bulk)', zoho: 'N/A', twoxg: 'Single and bulk inward operations', status: 'done' },
      { feature: 'Assembly Bin Tracking', zoho: 'N/A', twoxg: 'Bin movements during assembly', status: 'done' },
      { feature: 'Bill of Materials', zoho: 'Multi-level BOM with cost calc', twoxg: 'Not available (uses journey stages)', status: 'missing' },
    ]
  },
  {
    category: '7. EXPENSES',
    features: [
      { feature: 'Expense Tracking', zoho: 'Via Zoho Books/Expense', twoxg: 'Expense CRUD with categories', status: 'done' },
      { feature: 'Expense Categories', zoho: 'Customizable categories', twoxg: 'Category management', status: 'done' },
      { feature: 'Voucher Attachments', zoho: 'Receipt image uploads', twoxg: 'Voucher file uploads', status: 'done' },
      { feature: 'Expense Approval', zoho: 'Multi-level approval workflow', twoxg: 'Not available', status: 'missing' },
    ]
  },
  {
    category: '8. REPORTS & ANALYTICS',
    features: [
      { feature: 'Dashboard Metrics', zoho: 'Sales, inventory, financial KPIs', twoxg: 'ERP dashboard with sales, stock metrics', status: 'done' },
      { feature: 'Inventory Reports', zoho: 'Summary, valuation, FIFO, batch', twoxg: 'Report templates (basic)', status: 'partial' },
      { feature: 'Sales Reports', zoho: 'By customer, item, history', twoxg: 'Top customers, sales by status', status: 'partial' },
      { feature: 'Purchase Reports', zoho: 'PO history, vendor balances', twoxg: 'Purchase summary, by status', status: 'partial' },
      { feature: 'AI Insights', zoho: 'Zia AI assistant (via CRM)', twoxg: 'AI insights, predictions, health score', status: 'done' },
      { feature: 'Export Reports', zoho: 'CSV, XLS, PDF export', twoxg: 'CSV export available', status: 'partial' },
      { feature: 'Scheduled Reports', zoho: 'Auto-generate and email on schedule', twoxg: 'Not available', status: 'missing' },
      { feature: 'Custom Report Builder', zoho: 'Via Zoho Analytics', twoxg: 'Not available', status: 'missing' },
    ]
  },
  {
    category: '9. TAX MANAGEMENT',
    features: [
      { feature: 'GST (CGST/SGST/IGST)', zoho: 'Full Indian GST with HSN/SAC', twoxg: 'CGST/SGST split on invoices/bills', status: 'done' },
      { feature: 'TDS/TCS', zoho: 'Tax deducted/collected at source', twoxg: 'TDS/TCS on bills and invoices', status: 'done' },
      { feature: 'Tax Groups', zoho: 'Combine multiple taxes', twoxg: 'TDS/TCS group management', status: 'partial' },
      { feature: 'Tax Inclusive Pricing', zoho: 'Configurable per item', twoxg: 'Supported in invoice PDF', status: 'done' },
      { feature: 'HSN/SAC Codes', zoho: 'Per-item HSN/SAC assignment', twoxg: 'Not available on items', status: 'missing' },
      { feature: 'GST Returns Data', zoho: 'GSTR-1, GSTR-3B data', twoxg: 'Not available', status: 'missing' },
    ]
  },
  {
    category: '10. USERS, ROLES & SETTINGS',
    features: [
      { feature: 'User Management', zoho: 'Invite, roles, permissions', twoxg: 'Admin user CRUD', status: 'done' },
      { feature: 'Role-Based Access', zoho: 'Granular per-module permissions', twoxg: 'Admin/Staff + buildline roles', status: 'partial' },
      { feature: 'Mobile Users (PIN)', zoho: 'Mobile app with full auth', twoxg: 'Phone + PIN for technicians', status: 'done' },
      { feature: 'Organization Settings', zoho: 'Company profile, logo, fiscal year', twoxg: 'Hardcoded in PDF generator', status: 'missing' },
      { feature: 'Approval Workflows', zoho: 'Multi-level approvals for PO/SO/Bill', twoxg: 'Not available', status: 'missing' },
      { feature: 'Audit Trail', zoho: 'Full version history, user attribution', twoxg: 'Audit log table (migration 027)', status: 'partial' },
      { feature: 'Auto-Numbering', zoho: 'Custom prefixes for all transaction types', twoxg: 'Auto-generated numbers for all modules', status: 'done' },
    ]
  },
  {
    category: '11. DOCUMENTS & TEMPLATES',
    features: [
      { feature: 'Invoice PDF', zoho: 'Multiple customizable templates', twoxg: 'Single GST invoice PDF template', status: 'done' },
      { feature: 'PDF Template Editor', zoho: 'Drag-drop, show/hide fields', twoxg: 'Not available (hardcoded template)', status: 'missing' },
      { feature: 'Email Templates', zoho: 'Per-module custom templates', twoxg: 'Basic mailto integration', status: 'partial' },
      { feature: 'Barcode Labels', zoho: 'Customizable label printing', twoxg: 'Barcode label generation from bills', status: 'done' },
      { feature: 'Multiple Templates', zoho: 'Multiple templates per module', twoxg: 'Single template per module', status: 'missing' },
    ]
  },
  {
    category: '12. INTEGRATIONS & AUTOMATION',
    features: [
      { feature: 'Accounting Integration', zoho: 'Zoho Books, QuickBooks, Xero', twoxg: 'Not available', status: 'missing' },
      { feature: 'Ecommerce Integration', zoho: 'Amazon, Shopify, WooCommerce', twoxg: 'Not available', status: 'missing' },
      { feature: 'Shipping Carriers', zoho: '40+ carriers, rate comparison', twoxg: 'Not available', status: 'missing' },
      { feature: 'Payment Gateways', zoho: 'Stripe, PayPal, Razorpay', twoxg: 'Not available', status: 'missing' },
      { feature: 'REST API', zoho: 'Full CRUD API', twoxg: '39 API route prefixes', status: 'done' },
      { feature: 'Webhooks', zoho: 'Event-driven notifications', twoxg: 'Not available', status: 'missing' },
      { feature: 'Google Sheets Import', zoho: 'N/A (uses CSV)', twoxg: 'Google Sheets item import', status: 'done' },
      { feature: 'Auto Stock Count Schedule', zoho: 'N/A', twoxg: 'Hourly auto-generation from schedules', status: 'done' },
    ]
  },
  {
    category: '13. MOBILE APP',
    features: [
      { feature: 'Mobile App', zoho: 'iOS + Android, full features', twoxg: 'React Native (technician/buildline)', status: 'partial' },
      { feature: 'Barcode Scanner', zoho: 'Camera + external scanner', twoxg: 'Built-in barcode scanner', status: 'done' },
      { feature: 'Mobile Stock Count', zoho: 'Adjustments from mobile', twoxg: 'Full stock count mobile app', status: 'done' },
      { feature: 'Mobile Inventory View', zoho: 'View/manage items', twoxg: 'Buildline focused (not general)', status: 'partial' },
    ]
  },
  {
    category: '14. MULTI-CURRENCY & LANGUAGE',
    features: [
      { feature: 'Multi-Currency', zoho: 'Unlimited currencies, auto rates', twoxg: 'INR only', status: 'missing' },
      { feature: 'Multi-Language', zoho: 'Templates in customer language', twoxg: 'English only', status: 'missing' },
    ]
  },
  {
    category: '15. CUSTOMER/VENDOR PORTALS',
    features: [
      { feature: 'Customer Portal', zoho: 'View orders, pay invoices, track', twoxg: 'Not available', status: 'missing' },
      { feature: 'Vendor Portal', zoho: 'View POs, update info', twoxg: 'Not available', status: 'missing' },
    ]
  },
];

export default generateComparisonPDF;
