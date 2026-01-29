import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface NatureOfCollection {
  id: string;
  name: string;
  description: string;
}

interface NewTCSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taxData: any) => void;
}

const NewTCSModal: React.FC<NewTCSModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [showManageNature, setShowManageNature] = useState(false);
  const [newNatureDescription, setNewNatureDescription] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const [natures, setNatures] = useState<NatureOfCollection[]>([
    { id: '206C1A', name: 'Section 206C(1A) - Alcoholic Liquor for Human Consumption', description: 'Alcoholic Liquor for Human Consumption' },
    { id: '206C1B', name: 'Section 206C(1B) - Tendu Leaves', description: 'Tendu Leaves' },
    { id: '206C1C', name: 'Section 206C(1C) - Timber obtained under a forest lease', description: 'Timber obtained under a forest lease' },
    { id: '206C1D', name: 'Section 206C(1D) - Timber obtained by any mode other than under a forest lease', description: 'Timber obtained by any mode other than under a forest lease' },
    { id: '206C1E', name: 'Section 206C(1E) - Any other forest produce not being timber or tendu leaves', description: 'Any other forest produce not being timber or tendu leaves' },
    { id: '206C1F', name: 'Section 206C(1F) - Scrap', description: 'Scrap' },
    { id: '206C1G', name: 'Section 206C(1G) - Parking Lot', description: 'Parking Lot' },
    { id: '206C1H', name: 'Section 206C(1H) - Toll Plaza', description: 'Toll Plaza' },
    { id: '206C1I', name: 'Section 206C(1I) - Mining and Quarrying', description: 'Mining and Quarrying' },
    { id: '206C1J', name: 'Section 206C(1J) - Sale of Motor Vehicle', description: 'Sale of Motor Vehicle' },
  ]);

  const [formData, setFormData] = useState({
    taxName: '',
    rate: '',
    nature: '',
    isHigherRate: false,
    startDate: '',
    endDate: ''
  });

  if (!isOpen) return null;

  const handleNatureChange = (value: string) => {
    if (value === 'manage_nature') {
      setShowManageNature(true);
    } else {
      setFormData({ ...formData, nature: value });
      if (showErrors) {
        setShowErrors(false);
        setErrors([]);
      }
    }
  };

  const handleSaveNewNature = () => {
    if (!newNatureDescription.trim()) {
      alert('Please enter a nature description');
      return;
    }

    const newNature: NatureOfCollection = {
      id: `custom_${Date.now()}`,
      name: newNatureDescription,
      description: newNatureDescription
    };

    setNatures([...natures, newNature]);
    setFormData({ ...formData, nature: newNature.id });
    setShowManageNature(false);
    setNewNatureDescription('');
  };

  const handleCancelManageNature = () => {
    setShowManageNature(false);
    setNewNatureDescription('');
  };

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    if (!formData.taxName.trim()) {
      validationErrors.push('Enter a valid tax name.');
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      validationErrors.push('Enter a valid tax rate.');
    }

    if (!formData.nature) {
      validationErrors.push('Ensure the collection nature is correctly mapped.');
    }

    setErrors(validationErrors);
    setShowErrors(validationErrors.length > 0);

    return validationErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const selectedNature = natures.find(n => n.id === formData.nature);

    const taxData = {
      id: `tcs_${Date.now()}`,
      name: `${formData.taxName} [${formData.rate}%]`,
      rate: parseFloat(formData.rate),
      natureOfCollection: selectedNature?.name || formData.nature,
      status: 'Active' as const,
      isHigherRate: formData.isHigherRate,
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    onSave(taxData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      taxName: '',
      rate: '',
      nature: '',
      isHigherRate: false,
      startDate: '',
      endDate: ''
    });
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {showManageNature ? 'Manage Nature of Collection' : 'New TCS'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {showManageNature ? (
              /* Manage Nature View */
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-2">
                    Description*
                  </label>
                  <input
                    type="text"
                    value={newNatureDescription}
                    onChange={(e) => setNewNatureDescription(e.target.value)}
                    placeholder="Enter nature of collection description"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleCancelManageNature}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewNature}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* New TCS Form */
              <div className="space-y-6">
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

                {/* Tax Name and Rate */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-red-600 mb-2">
                      Tax Name*
                    </label>
                    <input
                      type="text"
                      value={formData.taxName}
                      onChange={(e) => {
                        setFormData({ ...formData, taxName: e.target.value });
                        if (showErrors) {
                          setShowErrors(false);
                          setErrors([]);
                        }
                      }}
                      placeholder="e.g., Alcoholic Liquor"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-600 mb-2">
                      Rate (%)*
                    </label>
                    <input
                      type="number"
                      value={formData.rate}
                      onChange={(e) => {
                        setFormData({ ...formData, rate: e.target.value });
                        if (showErrors) {
                          setShowErrors(false);
                          setErrors([]);
                        }
                      }}
                      placeholder="e.g., 1"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Nature of Collection Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-2">
                    Nature of Collection*
                  </label>
                  <select
                    value={formData.nature}
                    onChange={(e) => handleNatureChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a Tax Type.</option>
                    {natures.map(nature => (
                      <option key={nature.id} value={nature.id}>
                        {nature.name}
                      </option>
                    ))}
                    <option value="manage_nature" className="text-blue-600 font-medium">
                      + Manage Nature of Collection
                    </option>
                  </select>
                </div>

                {/* Info Message */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-gray-700">
                    By default, TCS will be tracked under <strong>TCS Payable</strong> and{' '}
                    <strong>TCS Receivable</strong> accounts. Click{' '}
                    <button className="text-blue-600 hover:underline">Edit</button> to choose an account of your choice.
                  </div>
                </div>

                {/* Higher TCS Rate Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="higherRate"
                    checked={formData.isHigherRate}
                    onChange={(e) => setFormData({ ...formData, isHigherRate: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="higherRate" className="text-sm text-gray-700">
                    This is a Higher TCS Rate
                  </label>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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

                {/* Action Buttons */}
                <div className="flex justify-start gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTCSModal;
