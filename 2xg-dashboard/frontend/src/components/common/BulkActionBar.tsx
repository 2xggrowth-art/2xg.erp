import React from 'react';
import { Trash2, Download, Mail, Printer, X, CheckSquare, Archive, FileText } from 'lucide-react';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  actions: BulkAction[];
  entityName?: string;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  actions,
  entityName = 'items'
}) => {
  if (selectedCount === 0) return null;

  const getButtonStyles = (variant?: 'default' | 'danger' | 'success') => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-gray-700 hover:bg-gray-600 text-white';
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 border border-gray-700">
        {/* Selection Info */}
        <div className="flex items-center gap-3 pr-4 border-r border-gray-600">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <CheckSquare size={20} />
          </div>
          <div>
            <p className="font-semibold text-lg">
              {selectedCount} {entityName} selected
            </p>
            <p className="text-xs text-gray-400">
              of {totalCount} total
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 px-2">
          {selectedCount < totalCount && (
            <button
              onClick={onSelectAll}
              className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckSquare size={16} />
              Select All
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-600">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${getButtonStyles(action.variant)} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={action.label}
            >
              {action.icon}
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClearSelection}
          className="ml-2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

// Pre-built action configurations for common use cases
export const createBulkDeleteAction = (onDelete: () => void, disabled?: boolean): BulkAction => ({
  id: 'delete',
  label: 'Delete',
  icon: <Trash2 size={16} />,
  onClick: onDelete,
  variant: 'danger',
  disabled
});

export const createBulkExportAction = (onExport: () => void): BulkAction => ({
  id: 'export',
  label: 'Export',
  icon: <Download size={16} />,
  onClick: onExport,
  variant: 'default'
});

export const createBulkEmailAction = (onEmail: () => void): BulkAction => ({
  id: 'email',
  label: 'Email',
  icon: <Mail size={16} />,
  onClick: onEmail,
  variant: 'default'
});

export const createBulkPrintAction = (onPrint: () => void): BulkAction => ({
  id: 'print',
  label: 'Print',
  icon: <Printer size={16} />,
  onClick: onPrint,
  variant: 'default'
});

export const createBulkArchiveAction = (onArchive: () => void): BulkAction => ({
  id: 'archive',
  label: 'Archive',
  icon: <Archive size={16} />,
  onClick: onArchive,
  variant: 'default'
});

export const createBulkInvoiceAction = (onCreateInvoice: () => void): BulkAction => ({
  id: 'invoice',
  label: 'Create Invoice',
  icon: <FileText size={16} />,
  onClick: onCreateInvoice,
  variant: 'success'
});

export default BulkActionBar;
