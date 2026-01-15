import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TDSSection {
  id: string;
  name: string;
  description: string;
}

interface NewTDSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taxData: any) => void;
}

const NewTDSModal: React.FC<NewTDSModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [showManageSection, setShowManageSection] = useState(false);
  const [newSectionDescription, setNewSectionDescription] = useState('');

  const [sections, setSections] = useState<TDSSection[]>([
    { id: '194', name: 'Section 194', description: 'Dividend' },
    { id: '194A', name: 'Section 194 A', description: 'Other Interest than securities' },
    { id: '194C', name: 'Section 194 C', description: 'Payment of contractors' },
    { id: '194H', name: 'Section 194 H', description: 'Commission or Brokerage' },
    { id: '195B', name: '195B - Income such as Capital Gains from Units/MF to Non-residents', description: 'Income such as Capital Gains from Units/MF to Non-residents' },
    { id: '196C', name: '196C - Non-resident Income From Foreign currency bonds', description: 'Non-resident Income From Foreign currency bonds' },
    { id: '196D', name: '196D - Income of foreign institutional investors from securities', description: 'Income of foreign institutional investors from securities' },
    { id: '196D1A', name: '196D(1A) - Income of specified fund from securities', description: 'Income of specified fund from securities referred to in clause (a) of sub-section (1) of section 115AD' },
    { id: 'others', name: 'Others - Others', description: 'Others' },
  ]);

  const [formData, setFormData] = useState({
    taxName: '',
    rate: '',
    section: '',
    isHigherRate: false,
    startDate: '',
    endDate: ''
  });

  if (!isOpen) return null;

  const handleSectionChange = (value: string) => {
    if (value === 'manage_section') {
      setShowManageSection(true);
    } else {
      setFormData({ ...formData, section: value });
    }
  };

  const handleSaveNewSection = () => {
    if (!newSectionDescription.trim()) {
      alert('Please enter a section description');
      return;
    }

    // Create new section
    const newSection: TDSSection = {
      id: `custom_${Date.now()}`,
      name: newSectionDescription,
      description: newSectionDescription
    };

    // Add to sections list
    setSections([...sections, newSection]);

    // Auto-select the new section
    setFormData({ ...formData, section: newSection.id });

    // Close manage section view
    setShowManageSection(false);
    setNewSectionDescription('');
  };

  const handleCancelManageSection = () => {
    setShowManageSection(false);
    setNewSectionDescription('');
  };

  const handleSubmit = () => {
    if (!formData.taxName || !formData.rate || !formData.section) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedSection = sections.find(s => s.id === formData.section);

    const taxData = {
      id: `tax_${Date.now()}`,
      name: `${formData.taxName} [${formData.rate}%]`,
      rate: parseFloat(formData.rate),
      section: selectedSection?.name || formData.section,
      status: 'Active' as const,
      isHigherRate: formData.isHigherRate,
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    onSave(taxData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {showManageSection ? 'Manage Section' : 'New TDS'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {showManageSection ? (
              /* Manage Section View */
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-2">
                    Description*
                  </label>
                  <input
                    type="text"
                    value={newSectionDescription}
                    onChange={(e) => setNewSectionDescription(e.target.value)}
                    placeholder="Enter section description"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleCancelManageSection}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewSection}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* New TDS Form */
              <div className="space-y-6">
                {/* Tax Name and Rate */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-red-600 mb-2">
                      Tax Name*
                    </label>
                    <input
                      type="text"
                      value={formData.taxName}
                      onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                      placeholder="e.g., Commission or Brokerage"
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
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      placeholder="e.g., 2"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Section Dropdown with Manage Section */}
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-2">
                    Section*
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a Tax Type.</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                    <option value="manage_section" className="text-blue-600 font-medium">
                      + Manage Section
                    </option>
                  </select>
                </div>

                {/* Info Message */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-gray-700">
                    By default, TDS will be tracked under <strong>TDS Payable</strong> and{' '}
                    <strong>TDS Receivable</strong> accounts. Click{' '}
                    <button className="text-blue-600 hover:underline">Edit</button> to choose an account of your choice.
                  </div>
                </div>

                {/* Higher TDS Rate Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="higherRate"
                    checked={formData.isHigherRate}
                    onChange={(e) => setFormData({ ...formData, isHigherRate: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="higherRate" className="text-sm text-gray-700">
                    This is a Higher TDS Rate
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
                    onClick={onClose}
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

export default NewTDSModal;
