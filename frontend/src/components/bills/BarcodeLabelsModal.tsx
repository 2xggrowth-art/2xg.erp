import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { itemsService } from '../../services/items.service';

interface BillItem {
  id: string;
  item_id?: string;
  item_name: string;
  quantity: number;
  serial_numbers?: string[];
}

interface ItemDetails {
  id: string;
  item_name: string;
  sku?: string;
  variant?: string;
  color?: string;
  size?: string;
}

interface BarcodeLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billNumber: string;
  items: BillItem[];
}

interface LabelData {
  serialNumber: string;
  itemName: string;
  sku: string;
  variant: string;
  color: string;
  size: string;
}

const BarcodeLabelsModal: React.FC<BarcodeLabelsModalProps> = ({
  isOpen,
  onClose,
  billNumber,
  items,
}) => {
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const printRef = useRef<HTMLDivElement>(null);
  const barcodeRefs = useRef<(SVGSVGElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchItemDetails();
    }
  }, [isOpen, items]);

  useEffect(() => {
    // Generate barcodes after labels are set
    if (labels.length > 0) {
      labels.forEach((label, index) => {
        const svgElement = barcodeRefs.current[index];
        if (svgElement && label.serialNumber) {
          try {
            JsBarcode(svgElement, label.serialNumber, {
              format: 'CODE128',
              width: labelSize === 'small' ? 1 : labelSize === 'medium' ? 1.5 : 2,
              height: labelSize === 'small' ? 30 : labelSize === 'medium' ? 40 : 50,
              displayValue: true,
              fontSize: labelSize === 'small' ? 10 : labelSize === 'medium' ? 12 : 14,
              margin: 5,
            });
          } catch (e) {
            console.error('Barcode generation error:', e);
          }
        }
      });
    }
  }, [labels, labelSize]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const itemIds = items.filter(i => i.item_id).map(i => i.item_id!);
      const uniqueItemIds = [...new Set(itemIds)];

      const itemDetailsMap: Record<string, ItemDetails> = {};

      // Fetch item details for each unique item
      for (const itemId of uniqueItemIds) {
        try {
          const response = await itemsService.getItemById(itemId);
          if (response.success && response.data) {
            itemDetailsMap[itemId] = response.data;
          }
        } catch (e) {
          console.error('Error fetching item:', itemId, e);
        }
      }

      // Build labels array - one label per serial number
      const labelsList: LabelData[] = [];

      for (const item of items) {
        const serialNumbers = item.serial_numbers || [];
        const details = item.item_id ? itemDetailsMap[item.item_id] : null;

        if (serialNumbers.length > 0) {
          // Create a label for each serial number
          for (const serial of serialNumbers) {
            labelsList.push({
              serialNumber: serial,
              itemName: item.item_name,
              sku: details?.sku || serial.split('/')[0] || '',
              variant: details?.variant || '',
              color: details?.color || '',
              size: details?.size || '',
            });
          }
        }
      }

      setLabels(labelsList);
    } catch (error) {
      console.error('Error fetching item details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print labels');
      return;
    }

    const labelWidth = labelSize === 'small' ? '50mm' : labelSize === 'medium' ? '70mm' : '100mm';
    const labelHeight = labelSize === 'small' ? '30mm' : labelSize === 'medium' ? '40mm' : '60mm';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Labels - ${billNumber}</title>
          <style>
            @page {
              size: auto;
              margin: 5mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10px;
            }
            .labels-container {
              display: flex;
              flex-wrap: wrap;
              gap: 5mm;
              justify-content: flex-start;
            }
            .label {
              width: ${labelWidth};
              height: ${labelHeight};
              border: 1px solid #ccc;
              padding: 3mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
              background: white;
            }
            .label-header {
              text-align: center;
            }
            .item-name {
              font-size: ${labelSize === 'small' ? '8px' : labelSize === 'medium' ? '10px' : '12px'};
              font-weight: bold;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .item-details {
              font-size: ${labelSize === 'small' ? '7px' : labelSize === 'medium' ? '8px' : '10px'};
              color: #666;
              margin-top: 1mm;
            }
            .barcode-container {
              text-align: center;
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .barcode-container svg {
              max-width: 100%;
              height: auto;
            }
            @media print {
              .label {
                border: 1px dashed #999;
              }
            }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${labels.map((label, index) => `
              <div class="label">
                <div class="label-header">
                  <div class="item-name">${label.itemName}</div>
                  <div class="item-details">
                    ${[label.variant, label.color, label.size].filter(Boolean).join(' | ') || 'SKU: ' + label.sku}
                  </div>
                </div>
                <div class="barcode-container">
                  ${barcodeRefs.current[index]?.outerHTML || ''}
                </div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const serialItemsCount = items.reduce((count, item) => count + (item.serial_numbers?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Print Barcode Labels</h2>
            <p className="text-sm text-gray-500 mt-1">
              Bill: {billNumber} | {serialItemsCount} labels to print
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Label Size:</span>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="small">Small (50x30mm)</option>
              <option value="medium">Medium (70x40mm)</option>
              <option value="large">Large (100x60mm)</option>
            </select>
          </div>
          <div className="flex-1" />
          <button
            onClick={handlePrint}
            disabled={loading || labels.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Printer size={18} />
            Print Labels
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6" ref={printRef}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : labels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium">No Serial Numbers Found</p>
              <p className="text-sm mt-1">This bill doesn't have any serial-tracked items.</p>
              <p className="text-sm mt-4 text-gray-400">
                To generate barcodes, items must have "Serial Number" tracking enabled.
              </p>
            </div>
          ) : (
            <div className="grid gap-4" style={{
              gridTemplateColumns: labelSize === 'small'
                ? 'repeat(auto-fill, minmax(180px, 1fr))'
                : labelSize === 'medium'
                  ? 'repeat(auto-fill, minmax(250px, 1fr))'
                  : 'repeat(auto-fill, minmax(350px, 1fr))'
            }}>
              {labels.map((label, index) => (
                <div
                  key={`${label.serialNumber}-${index}`}
                  className="border rounded-lg p-3 bg-white shadow-sm"
                  style={{
                    minHeight: labelSize === 'small' ? '100px' : labelSize === 'medium' ? '130px' : '180px'
                  }}
                >
                  <div className="text-center mb-2">
                    <p className="font-semibold text-gray-900 text-sm truncate" title={label.itemName}>
                      {label.itemName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[label.variant, label.color, label.size].filter(Boolean).join(' | ') || `SKU: ${label.sku}`}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <svg
                      ref={(el) => (barcodeRefs.current[index] = el)}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {labels.length > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500">
            Tip: For best results, use label paper and adjust printer settings to match label size.
          </div>
        )}
      </div>
    </div>
  );
};

// Package icon for empty state
const Package = ({ size, className }: { size: number; className: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

export default BarcodeLabelsModal;
