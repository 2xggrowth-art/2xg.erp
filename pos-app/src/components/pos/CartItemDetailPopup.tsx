import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CartItem } from './posTypes';

interface CartItemDetailPopupProps {
  item: CartItem;
  onApply: (updates: { serial_number?: string; rate: number; note?: string }) => void;
  onRemove: () => void;
  onClose: () => void;
}

const CartItemDetailPopup: React.FC<CartItemDetailPopupProps> = ({
  item,
  onApply,
  onRemove,
  onClose,
}) => {
  const [serialNumber, setSerialNumber] = useState(item.serial_number || '');
  const [rate, setRate] = useState(item.rate);
  const [note, setNote] = useState(item.note || '');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleApply = () => {
    onApply({
      serial_number: serialNumber.trim() || undefined,
      rate,
      note: note.trim() || undefined,
    });
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">SKU: {item.sku}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Serial Number</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Enter serial number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rate</label>
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent px-3 bg-white dark:bg-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">₹</span>
              <input
                type="number"
                value={rate || ''}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full py-2 text-sm bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this item"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={14} />
            Remove
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemDetailPopup;
