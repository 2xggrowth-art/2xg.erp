import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface CategoryPickerProps {
  categories: Category[];
  allSubcategories: Subcategory[];
  categoryValue: string;
  subcategoryValue: string;
  onCategoryChange: (name: string) => void;
  onSubcategoryChange: (name: string) => void;
  onCreateCategory: (name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCreateSubcategory: (categoryId: string, name: string) => Promise<void>;
  onDeleteSubcategory: (id: string) => Promise<void>;
  placeholder?: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  allSubcategories,
  categoryValue,
  subcategoryValue,
  onCategoryChange,
  onSubcategoryChange,
  onCreateCategory,
  onDeleteCategory,
  onCreateSubcategory,
  onDeleteSubcategory,
  placeholder = 'Search or add category',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  // Display: show subcategory if selected, otherwise category
  const displayValue = subcategoryValue || categoryValue;

  // Group subcategories by category_id
  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<string, Subcategory[]>();
    allSubcategories.forEach(sub => {
      const list = map.get(sub.category_id) || [];
      list.push(sub);
      map.set(sub.category_id, list);
    });
    return map;
  }, [allSubcategories]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('category-picker-dropdown');
        if (dropdown && dropdown.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
        setSearchTerm('');
        setExpandedCategoryId(null);
        setNewSubName('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen, searchTerm, allSubcategories, expandedCategoryId]);

  // Focus the subcategory input when a category is expanded
  useEffect(() => {
    if (expandedCategoryId && subInputRef.current) {
      subInputRef.current.focus();
    }
  }, [expandedCategoryId]);

  // Single click = select category and close
  // Double click = expand category to show subcategories + creation input
  const handleCategoryClick = (cat: Category) => {
    if (clickTimerRef.current) {
      // Double click detected - cancel single click and expand
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleCategoryDoubleClick(cat);
    } else {
      // Start single-click timer
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single click: select category
        onCategoryChange(cat.name);
        onSubcategoryChange('');
        setIsOpen(false);
        setSearchTerm('');
        setExpandedCategoryId(null);
        setNewSubName('');
      }, 250);
    }
  };

  const handleCategoryDoubleClick = (cat: Category) => {
    if (expandedCategoryId === cat.id) {
      setExpandedCategoryId(null);
      setNewSubName('');
    } else {
      setExpandedCategoryId(cat.id);
      onCategoryChange(cat.name);
      setNewSubName('');
    }
  };

  const handleSubcategoryClick = (sub: Subcategory, parentCat: Category) => {
    onCategoryChange(parentCat.name);
    onSubcategoryChange(sub.name);
    setIsOpen(false);
    setSearchTerm('');
    setExpandedCategoryId(null);
    setNewSubName('');
  };

  const handleCreateCategory = async () => {
    if (!searchTerm.trim()) return;
    setIsCreating(true);
    try {
      await onCreateCategory(searchTerm);
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSubcategory = async (categoryId: string) => {
    if (!newSubName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateSubcategory(categoryId, newSubName);
      setNewSubName('');
    } catch (error) {
      console.error('Error creating subcategory:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, type: 'category' | 'subcategory') => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    setDeletingId(id);
    try {
      if (type === 'category') {
        await onDeleteCategory(id);
        if (expandedCategoryId === id) {
          setExpandedCategoryId(null);
          setNewSubName('');
        }
      } else {
        await onDeleteSubcategory(id);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    } finally {
      setDeletingId(null);
    }
  };

  const search = searchTerm.toLowerCase();

  const getSubs = (categoryId: string) => {
    return subcategoriesByCategory.get(categoryId) || [];
  };

  const filteredCategories = categories.filter(cat => {
    if (!search) return true;
    const catMatches = cat.name.toLowerCase().includes(search);
    const subs = subcategoriesByCategory.get(cat.id) || [];
    const subsMatch = subs.some(s => s.name.toLowerCase().includes(search));
    return catMatches || subsMatch;
  });

  const isExactMatchCategory = filteredCategories.some(
    c => c.name.toLowerCase() === search
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={isOpen ? searchTerm : displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearchTerm('');
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoComplete="off"
      />

      {isOpen && createPortal(
        <div
          id="category-picker-dropdown"
          style={{
            position: 'absolute',
            top: dropdownPosition.top + 4,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999,
          }}
          className="max-h-72 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl"
        >
          {filteredCategories.map(cat => {
            const catSubs = getSubs(cat.id);
            const isExpanded = expandedCategoryId === cat.id;

            return (
              <React.Fragment key={cat.id}>
                {/* Category row - single click selects, double click expands */}
                <div
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm font-medium text-gray-800 flex items-center justify-between group ${
                    isExpanded ? 'bg-blue-50 border-b border-blue-100' : 'bg-gray-50 border-b border-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    {cat.name}
                    {catSubs.length > 0 && (
                      <span className="text-xs text-gray-400 font-normal">
                        ({catSubs.length})
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, cat.id, 'category')}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    title="Delete category"
                  >
                    {deletingId === cat.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Subcategories + inline creation (shown when double-clicked/expanded) */}
                {isExpanded && (
                  <div className="bg-white border-b border-gray-200">
                    {catSubs.length === 0 && (
                      <div className="pl-9 pr-4 py-2 text-sm text-gray-400 italic">
                        No subcategories yet
                      </div>
                    )}

                    {catSubs.map(sub => (
                      <div
                        key={sub.id}
                        onClick={() => handleSubcategoryClick(sub, cat)}
                        className="pl-9 pr-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-600 flex items-center justify-between group"
                      >
                        <span>- {sub.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, sub.id, 'subcategory')}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                          title="Delete subcategory"
                        >
                          {deletingId === sub.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}

                    {/* Inline input to create new subcategory */}
                    <div className="pl-9 pr-4 py-2 flex items-center gap-2">
                      <input
                        ref={subInputRef}
                        type="text"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSubName.trim()) {
                            e.preventDefault();
                            handleCreateSubcategory(cat.id);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="New subcategory name..."
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateSubcategory(cat.id);
                        }}
                        disabled={!newSubName.trim() || isCreating}
                        className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                        title="Add subcategory"
                      >
                        {isCreating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Hint text */}
          {!expandedCategoryId && filteredCategories.length > 0 && !searchTerm.trim() && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
              Double-click a category to add subcategories
            </div>
          )}

          {/* Add new category option */}
          {!isExactMatchCategory && searchTerm.trim() && (
            <div
              onClick={handleCreateCategory}
              className="px-4 py-2.5 hover:bg-green-50 cursor-pointer text-sm text-blue-600 flex items-center gap-2 border-t border-gray-100"
            >
              <Plus className="w-4 h-4" />
              <span>Add category "{searchTerm}"</span>
              {isCreating && <span className="ml-2 text-gray-400 text-xs">(Saving...)</span>}
            </div>
          )}

          {filteredCategories.length === 0 && !searchTerm.trim() && (
            <div className="px-4 py-2.5 text-sm text-gray-500">
              Type to search or add a category...
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default CategoryPicker;
