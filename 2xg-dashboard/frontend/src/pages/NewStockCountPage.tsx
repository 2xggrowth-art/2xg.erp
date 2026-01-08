import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewStockCountPage = () => {
  const navigate = useNavigate();
  const [stockCountNumber, setStockCountNumber] = useState('1');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Head Office');
  const [assignTo, setAssignTo] = useState('');
  const [scheduleCounts, setScheduleCounts] = useState(false);
  const [currentStep, setCurrentStep] = useState('configure');

  const handleNext = () => {
    if (currentStep === 'configure') {
      setCurrentStep('add-items');
    }
  };

  const handleCancel = () => {
    navigate('/items/stock-count');
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">New Stock Count</h1>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className={`flex items-center gap-2 ${currentStep === 'configure' ? 'text-blue-600' : 'text-green-600'}`}>
              {currentStep === 'add-items' ? (
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-blue-600"></div>
              )}
              <span className={`font-medium ${currentStep === 'configure' ? 'text-blue-600' : 'text-slate-600'}`}>
                Configure
              </span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300 mx-2"></div>
            <div className={`flex items-center gap-2 ${currentStep === 'add-items' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full border-2 ${currentStep === 'add-items' ? 'border-blue-600' : 'border-slate-300'}`}></div>
              <span className={`font-medium ${currentStep === 'add-items' ? 'text-blue-600' : 'text-slate-400'}`}>
                Add Items
              </span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        {currentStep === 'configure' && (
          <div className="p-6 space-y-6">
            {/* Stock Count Number */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700">
                Stock Count#<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={stockCountNumber}
                  onChange={(e) => setStockCountNumber(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start gap-4">
              <label className="w-48 text-slate-700 pt-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Max. 500 characters"
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700">
                Location<span className="text-red-500">*</span>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Head Office">Head Office</option>
                <option value="Warehouse 1">Warehouse 1</option>
                <option value="Warehouse 2">Warehouse 2</option>
              </select>
            </div>

            {/* Assign To */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700 flex items-center gap-1">
                Assign To<span className="text-red-500">*</span>
                <button className="text-slate-400 hover:text-slate-600">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none" strokeWidth="1.5"/>
                    <text x="8" y="11" fontSize="10" textAnchor="middle" fill="currentColor">?</text>
                  </svg>
                </button>
              </label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-400"
              >
                <option value="">Select user</option>
                <option value="user1">John Doe</option>
                <option value="user2">Jane Smith</option>
                <option value="user3">Bob Johnson</option>
              </select>
            </div>

            {/* Schedule Counts */}
            <div className="flex items-center gap-4">
              <label className="w-48 text-slate-700"></label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scheduleCounts}
                  onChange={(e) => setScheduleCounts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-slate-700">Schedule Counts</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'add-items' && (
          <div className="p-6">
            <p className="text-slate-600">Add Items step coming soon...</p>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Next
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewStockCountPage;
