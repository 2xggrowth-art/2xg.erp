import React, { useState } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import NewTDSModal from './NewTDSModal';
import NewTDSGroupModal from './NewTDSGroupModal';

interface TDSTax {
  id: string;
  name: string;
  rate: number;
  section: string;
  status: 'Active' | 'Inactive';
}

interface ManageTDSModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxes: TDSTax[];
  onAddTax?: (tax: TDSTax) => void;
  onEditTax?: (tax: TDSTax) => void;
  onDeleteTax?: (taxId: string) => void;
}

const ManageTDSModal: React.FC<ManageTDSModalProps> = ({
  isOpen,
  onClose,
  taxes,
  onAddTax,
  onEditTax,
  onDeleteTax
}) => {
  const [showNewTDSModal, setShowNewTDSModal] = useState(false);
  const [showNewTDSGroupModal, setShowNewTDSGroupModal] = useState(false);

  const handleSaveNewTax = (taxData: TDSTax) => {
    if (onAddTax) {
      onAddTax(taxData);
    }
    setShowNewTDSModal(false);
  };

  const handleSaveNewGroup = (groupData: TDSTax) => {
    if (onAddTax) {
      onAddTax(groupData);
    }
    setShowNewTDSGroupModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Manage TDS</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowNewTDSModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                + New TDS Tax
              </button>
              <button
                onClick={() => setShowNewTDSGroupModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                + New TDS Group
              </button>
            </div>

            {/* TDS Taxes Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">TDS taxes</h3>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Tax Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Rate (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {taxes.map((tax) => (
                      <tr key={tax.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {tax.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {tax.rate}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {tax.section}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            tax.status === 'Active'
                              ? 'text-green-700 bg-green-50'
                              : 'text-gray-700 bg-gray-50'
                          }`}>
                            {tax.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEditTax?.(tax)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => onDeleteTax?.(tax.id)}
                              className="p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* New TDS Modal */}
      <NewTDSModal
        isOpen={showNewTDSModal}
        onClose={() => setShowNewTDSModal(false)}
        onSave={handleSaveNewTax}
      />

      {/* New TDS Group Modal */}
      <NewTDSGroupModal
        isOpen={showNewTDSGroupModal}
        onClose={() => setShowNewTDSGroupModal(false)}
        onSave={handleSaveNewGroup}
        availableTaxes={taxes}
      />
    </div>
  );
};

export default ManageTDSModal;
