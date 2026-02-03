import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  expenseNumber?: string;
  loading?: boolean;
}

const QUICK_REASONS = [
  'Missing receipt/voucher',
  'Insufficient details',
  'Not a valid business expense',
  'Duplicate expense',
  'Amount exceeds limit',
  'Wrong category selected',
];

const RejectReasonModal = ({
  isOpen,
  onClose,
  onReject,
  expenseNumber,
  loading = false
}: RejectReasonModalProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    onReject(reason.trim());
  };

  const handleQuickReason = (quickReason: string) => {
    setReason(quickReason);
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Expense</h3>
              {expenseNumber && (
                <p className="text-sm text-gray-500">{expenseNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Quick reasons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick reasons
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((quickReason) => (
                <button
                  key={quickReason}
                  type="button"
                  onClick={() => handleQuickReason(quickReason)}
                  className={`
                    px-3 py-1.5 text-sm rounded-full border transition-colors
                    ${reason === quickReason
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {quickReason}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              rows={3}
              placeholder="Enter the reason for rejecting this expense..."
              className={`
                w-full px-4 py-3 border rounded-xl resize-none
                focus:ring-2 focus:ring-red-500 focus:border-transparent
                ${error ? 'border-red-300' : 'border-gray-300'}
              `}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Rejecting...' : 'Reject Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectReasonModal;
