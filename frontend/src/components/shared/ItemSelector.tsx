import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Item } from '../../services/items.service';
import { useAuth } from '../../contexts/AuthContext';

interface ItemSelectorProps {
    items: Item[];
    value?: string; // Item ID
    inputValue?: string; // Current text in the input
    onSelect: (item: Item) => void;
    onInputChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({
    items,
    value,
    inputValue,
    onSelect,
    onInputChange,
    placeholder = 'Type or click to select an item.',
    className = ''
}) => {
    const { user } = useAuth();

    // Check if user is admin or super_admin to show purchase price (case-insensitive)
    const userRole = user?.role?.toLowerCase() || '';
    const canViewPurchasePrice = userRole === 'admin' || userRole === 'super_admin' || userRole === 'super admin';

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(inputValue || '');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync internal state with external inputValue prop
    useEffect(() => {
        setSearchTerm(inputValue || '');
    }, [inputValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                // Check if click was inside the portal dropdown
                const dropdown = document.getElementById('item-selector-dropdown');
                if (dropdown && dropdown.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update position when opening
    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen, searchTerm]); // Recalculate if searchTerm changes (bounds might theoretically change?)

    const filteredItems = items.filter(item => {
        const term = searchTerm.toLowerCase();
        const nameMatch = item.item_name?.toLowerCase().includes(term);
        const skuMatch = item.sku?.toLowerCase().includes(term);
        return nameMatch || skuMatch;
    });

    const handleSelect = (item: Item) => {
        onSelect(item);
        setSearchTerm(item.item_name);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onInputChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
            />
            {isOpen && filteredItems.length > 0 && createPortal(
                <div
                    id="item-selector-dropdown"
                    style={{
                        position: 'absolute',
                        top: dropdownPosition.top + 4,
                        left: dropdownPosition.left,
                        minWidth: Math.max(dropdownPosition.width, 400),
                        zIndex: 9999
                    }}
                    className="max-h-96 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl"
                >
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                            <div className="font-medium text-gray-800">{item.item_name}</div>
                            <div className="text-xs text-gray-500 flex justify-between mt-1">
                                <span>SKU: {item.sku || 'N/A'}</span>
                                {canViewPurchasePrice && <span>₹{item.cost_price || item.unit_price || 0}</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                Stock: {item.current_stock} {item.unit_of_measurement}
                            </div>
                        </div>
                    ))}
                </div>,
                document.body
            )}
            {/* Hidden select to maintain semantic HTML and potential form submission compatibility */}
            <select
                value={value || ''}
                onChange={() => { }}
                className="hidden"
                name="item_id_hidden"
            >
                <option value="">Select Item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
            </select>
        </div>
    );
};

export default ItemSelector;
