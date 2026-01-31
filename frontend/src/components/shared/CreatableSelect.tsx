import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Upload } from 'lucide-react';

interface Option {
    id: string;
    name: string;
}

interface CreatableSelectProps {
    options: Option[];
    value?: string; // The name of the selected item
    onChange: (value: string) => void;
    onCreateOption: (value: string) => Promise<void>;
    onUploadClick?: () => void;
    placeholder?: string;
    className?: string;
    label?: string;
    isLoading?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({
    options,
    value,
    onChange,
    onCreateOption,
    onUploadClick,
    placeholder = 'Select or type to add...',
    className = '',
    label,
    isLoading = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                const dropdown = document.getElementById(`creatable-select-dropdown-${label}`);
                if (dropdown && dropdown.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
                // Reset search term to value if closed without selection
                if (!wrapperRef.current?.contains(event.target as Node)) {
                    setSearchTerm(value || '');
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, label]);

    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen, searchTerm]);

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isExactMatch = filteredOptions.some(
        option => option.name.toLowerCase() === searchTerm.toLowerCase()
    );

    const handleSelect = (optionName: string) => {
        onChange(optionName);
        setSearchTerm(optionName);
        setIsOpen(false);
    };

    const handleCreate = async () => {
        if (!searchTerm.trim()) return;
        setIsCreating(true);
        try {
            await onCreateOption(searchTerm);
            onChange(searchTerm);
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating option:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    autoComplete="off"
                    disabled={isLoading}
                />

                {onUploadClick && (
                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Upload items"
                    >
                        <Upload className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isOpen && (
                createPortal(
                    <div
                        id={`creatable-select-dropdown-${label}`}
                        style={{
                            position: 'absolute',
                            top: dropdownPosition.top + 4,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                            zIndex: 9999
                        }}
                        className="max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl"
                    >
                        {filteredOptions.map(option => (
                            <div
                                key={option.id}
                                onClick={() => handleSelect(option.name)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                            >
                                {option.name}
                            </div>
                        ))}

                        {!isExactMatch && searchTerm.trim() && (
                            <div
                                onClick={handleCreate}
                                className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm text-blue-600 flex items-center gap-2 border-t border-gray-100"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add "{searchTerm}"</span>
                                {isCreating && <span className="ml-2 text-gray-400 text-xs">(Saving...)</span>}
                            </div>
                        )}

                        {filteredOptions.length === 0 && !searchTerm.trim() && (
                            <div className="px-4 py-2 text-sm text-gray-500">
                                Type to search or add...
                            </div>
                        )}
                    </div>,
                    document.body
                )
            )}
        </div>
    );
};

export default CreatableSelect;
