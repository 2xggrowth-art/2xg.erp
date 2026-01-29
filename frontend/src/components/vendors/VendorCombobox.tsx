import { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus, Check } from 'lucide-react';
import { Vendor } from '../../services/vendors.service';

interface VendorComboboxProps {
  vendors: Vendor[];
  selectedVendorId?: string;
  selectedVendorName: string;
  onVendorSelect: (vendor: Vendor | null, manualName?: string) => void;
  onSaveAsNewVendor?: (vendorName: string) => void;
  disabled?: boolean;
}

const VendorCombobox = ({
  vendors,
  selectedVendorId,
  selectedVendorName,
  onVendorSelect,
  onSaveAsNewVendor,
  disabled = false
}: VendorComboboxProps) => {
  const [searchQuery, setSearchQuery] = useState(selectedVendorName);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(!selectedVendorId && !!selectedVendorName);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update search query when selectedVendorName changes externally
  useEffect(() => {
    setSearchQuery(selectedVendorName);
    setIsManualEntry(!selectedVendorId && !!selectedVendorName);
  }, [selectedVendorName, selectedVendorId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        // If user clicked outside and has a manual entry, confirm it
        if (searchQuery && !selectedVendorId) {
          const matchedVendor = vendors.find(
            v => v.supplier_name.toLowerCase() === searchQuery.toLowerCase()
          );
          if (matchedVendor) {
            onVendorSelect(matchedVendor);
            setIsManualEntry(false);
          } else if (searchQuery !== selectedVendorName) {
            onVendorSelect(null, searchQuery);
            setIsManualEntry(true);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery, selectedVendorId, selectedVendorName, vendors, onVendorSelect]);

  const filteredVendors = vendors.filter(vendor =>
    vendor.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);

    // Check if input matches any existing vendor
    const matchedVendor = vendors.find(
      v => v.supplier_name.toLowerCase() === value.toLowerCase()
    );

    if (matchedVendor) {
      // Don't auto-select, just show the dropdown
      setIsManualEntry(false);
    } else if (value) {
      setIsManualEntry(true);
    } else {
      setIsManualEntry(false);
    }
  };

  const handleVendorClick = (vendor: Vendor) => {
    setSearchQuery(vendor.supplier_name);
    setIsManualEntry(false);
    setShowDropdown(false);
    setShowSavePrompt(false);
    onVendorSelect(vendor);
  };

  const handleManualEntryConfirm = () => {
    if (searchQuery.trim()) {
      onVendorSelect(null, searchQuery.trim());
      setIsManualEntry(true);
      setShowDropdown(false);
      setShowSavePrompt(true);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsManualEntry(false);
    setShowDropdown(false);
    setShowSavePrompt(false);
    onVendorSelect(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredVendors.length > 0) {
        handleVendorClick(filteredVendors[0]);
      } else if (searchQuery.trim()) {
        handleManualEntryConfirm();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSaveAsVendor = () => {
    if (onSaveAsNewVendor && searchQuery.trim()) {
      onSaveAsNewVendor(searchQuery.trim());
      setShowSavePrompt(false);
    }
  };

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter vendor name..."
            disabled={disabled}
            className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 ${
              isManualEntry && searchQuery
                ? 'border-amber-400 bg-amber-50'
                : 'border-slate-300'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Manual entry indicator */}
        {isManualEntry && searchQuery && !showDropdown && (
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
            <UserPlus size={12} />
            <span>Manual entry (one-time vendor)</span>
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {filteredVendors.length > 0 ? (
              <>
                {filteredVendors.map(vendor => (
                  <div
                    key={vendor.id}
                    onClick={() => handleVendorClick(vendor)}
                    className={`px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                      selectedVendorId === vendor.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{vendor.supplier_name}</div>
                        {vendor.email && (
                          <div className="text-xs text-gray-500">{vendor.email}</div>
                        )}
                      </div>
                      {selectedVendorId === vendor.id && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
                {/* Show manual entry option at bottom if search doesn't match exactly */}
                {searchQuery && !vendors.some(v => v.supplier_name.toLowerCase() === searchQuery.toLowerCase()) && (
                  <div
                    onClick={handleManualEntryConfirm}
                    className="px-4 py-3 hover:bg-amber-50 cursor-pointer border-t border-gray-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-2 text-amber-700">
                      <UserPlus size={16} />
                      <span>Use "<strong>{searchQuery}</strong>" as one-time vendor</span>
                    </div>
                  </div>
                )}
              </>
            ) : searchQuery ? (
              <div
                onClick={handleManualEntryConfirm}
                className="px-4 py-3 hover:bg-amber-50 cursor-pointer"
              >
                <div className="flex items-center gap-2 text-amber-700">
                  <UserPlus size={16} />
                  <span>Use "<strong>{searchQuery}</strong>" as one-time vendor</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  No matching vendors found. Click to use this name.
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
                Start typing to search vendors or enter a new name...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save as new vendor prompt */}
      {showSavePrompt && isManualEntry && onSaveAsNewVendor && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <UserPlus size={16} className="text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800 flex-1">
            Would you like to save "<strong>{searchQuery}</strong>" as a new vendor?
          </span>
          <button
            type="button"
            onClick={handleSaveAsVendor}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Save Vendor
          </button>
          <button
            type="button"
            onClick={() => setShowSavePrompt(false)}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            No thanks
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorCombobox;
