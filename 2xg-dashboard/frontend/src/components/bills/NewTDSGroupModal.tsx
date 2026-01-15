import React, { useState, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface TDSTax {
  id: string;
  name: string;
  rate: number;
  section: string;
  status: 'Active' | 'Inactive';
}

interface NewTDSGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupData: any) => void;
  availableTaxes: TDSTax[];
}

const NewTDSGroupModal: React.FC<NewTDSGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableTaxes
}) => {
  const [formData, setFormData] = useState({
    groupName: '',
    startDate: '',
    endDate: ''
  });
  const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  // Filter taxes to only show Section 195 rates
  const section195Taxes = useMemo(() => {
    return availableTaxes.filter(tax =>
      tax.section.toLowerCase().includes('195') &&
      tax.status === 'Active'
    );
  }, [availableTaxes]);

  if (!isOpen) return null;

  const handleCheckboxChange = (taxId: string) => {
    setSelectedTaxes(prev => {
      if (prev.includes(taxId)) {
        return prev.filter(id => id !== taxId);
      } else {
        return [...prev, taxId];
      }
    });
    // Clear errors when user makes changes
    if (showErrors) {
      setShowErrors(false);
      setErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    // Check mandatory fields
    if (!formData.groupName.trim()) {
      validationErrors.push('Enter a valid TDS group tax name.');
    }

    if (!formData.startDate) {
      validationErrors.push('Start Date is required.');
    }

    // Check minimum 2 TDS rates selected
    if (selectedTaxes.length < 2) {
      validationErrors.push('Select at least two TDS rates to create a TDS group tax.');
    }

    // Check Section 195 requirement
    const allSelectedAreSection195 = selectedTaxes.every(taxId => {
      const tax = section195Taxes.find(t => t.id === taxId);
      return tax && tax.section.toLowerCase().includes('195');
    });

    if (selectedTaxes.length > 0 && !allSelectedAreSection195) {
      validationErrors.push('TDS Tax Group is only supported for TDS Section 195, please select a TDS Tax with Section 195');
    }

    setErrors(validationErrors);
    setShowErrors(validationErrors.length > 0);

    return validationErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Get selected tax details
    const selectedTaxDetails = section195Taxes.filter(tax =>
      selectedTaxes.includes(tax.id)
    );

    // Calculate combined rate (sum of all selected rates)
    const combinedRate = selectedTaxDetails.reduce((sum, tax) => sum + tax.rate, 0);

    const groupData = {
      id: `group_${Date.now()}`,
      name: `${formData.groupName} [${combinedRate.toFixed(2)}%]`,
      rate: combinedRate,
      section: 'Section 195 (Group)',
      status: 'Active' as const,
      isGroup: true,
      startDate: formData.startDate,
      endDate: formData.endDate,
      includedTaxes: selectedTaxDetails.map(tax => tax.id)
    };

    onSave(groupData);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      groupName: '',
      startDate: '',
      endDate: ''
    });
    setSelectedTaxes([]);
    setErrors([]);
    setShowErrors(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              New TDS Group Tax
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Messages */}
            {showErrors && errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-800 mb-2">
                        Please correct the following errors:
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="text-sm text-gray-900">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowErrors(false)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            )}

            {/* TDS Group Tax Name */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                TDS Group Tax Name*
              </label>
              <input
                type="text"
                value={formData.groupName}
                onChange={(e) => {
                  setFormData({ ...formData, groupName: e.target.value });
                  if (showErrors) {
                    setShowErrors(false);
                    setErrors([]);
                  }
                }}
                placeholder="Enter group tax name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Applicable Period */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-900">Applicable Period</h3>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-2">
                    Start Date*
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      if (showErrors) {
                        setShowErrors(false);
                        setErrors([]);
                      }
                    }}
                    placeholder="dd/MM/yyyy"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="dd/MM/yyyy"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Information Banner */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-700">
                You can create a TDS group tax only using TDSs that fall under section 195.
              </p>
            </div>

            {/* Associate TDS Rates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-red-600">
                  Associate TDS Rates*
                </label>
                <span className="text-xs text-gray-500">
                  Drag TDS rates to reorder
                </span>
              </div>

              {section195Taxes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No TDS rates available under Section 195.</p>
                  <p className="text-xs mt-1">Please create TDS taxes under Section 195 first.</p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-md max-h-80 overflow-y-auto">
                  {section195Taxes.map((tax) => (
                    <div
                      key={tax.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          id={`tax-${tax.id}`}
                          checked={selectedTaxes.includes(tax.id)}
                          onChange={() => handleCheckboxChange(tax.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <label
                          htmlFor={`tax-${tax.id}`}
                          className="text-sm text-gray-900 cursor-pointer flex-1"
                        >
                          {tax.name}
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          {tax.rate} %
                        </span>
                        <button className="p-1 hover:bg-gray-100 rounded cursor-move">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTaxes.length > 0 && (
                <p className="mt-2 text-xs text-gray-600">
                  {selectedTaxes.length} rate{selectedTaxes.length !== 1 ? 's' : ''} selected
                  {selectedTaxes.length >= 2 && (
                    <span className="text-green-600 ml-2">✓ Minimum requirement met</span>
                  )}
                </p>
              )}
            </div>

            {/* TDS Surcharge */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-red-600 mb-2">
                TDS Surcharge*
              </label>
              <p className="text-sm text-gray-700">No TDS Surcharge Available.</p>
            </div>

            {/* TDS Cess */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                TDS Cess*
              </label>
              <p className="text-sm text-gray-700">No TDS Cess Available.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-start gap-3 sticky bottom-0 bg-white">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTDSGroupModal;
