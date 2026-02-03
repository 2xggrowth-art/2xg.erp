import { Utensils, Fuel, Car, Coffee, Package, MoreHorizontal } from 'lucide-react';
import { ExpenseCategory } from '../../services/expenses.service';

interface CategoryIconGridProps {
  categories: ExpenseCategory[];
  onSelect: (category: ExpenseCategory) => void;
  selectedId?: string;
  maxCategories?: number;
}

// Category icon and color mapping
const categoryConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  'food': { icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'food & beverages': { icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'meals': { icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'fuel': { icon: Fuel, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'fuel/petrol': { icon: Fuel, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'petrol': { icon: Fuel, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'travel': { icon: Car, color: 'text-green-600', bgColor: 'bg-green-100' },
  'travel/transport': { icon: Car, color: 'text-green-600', bgColor: 'bg-green-100' },
  'transport': { icon: Car, color: 'text-green-600', bgColor: 'bg-green-100' },
  'conveyance': { icon: Car, color: 'text-green-600', bgColor: 'bg-green-100' },
  'tea': { icon: Coffee, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  'tea/coffee': { icon: Coffee, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  'refreshments': { icon: Coffee, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  'office supplies': { icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'supplies': { icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'stationery': { icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'miscellaneous': { icon: MoreHorizontal, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  'other': { icon: MoreHorizontal, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const getIconConfig = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();

  // Try exact match first
  if (categoryConfig[lowerName]) {
    return categoryConfig[lowerName];
  }

  // Try partial match
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return config;
    }
  }

  // Default
  return { icon: MoreHorizontal, color: 'text-gray-600', bgColor: 'bg-gray-100' };
};

const CategoryIconGrid = ({
  categories,
  onSelect,
  selectedId,
  maxCategories = 6
}: CategoryIconGridProps) => {
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleSelect = (category: ExpenseCategory) => {
    triggerHaptic();
    onSelect(category);
  };

  // Take only the first maxCategories
  const displayCategories = categories.slice(0, maxCategories);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {displayCategories.map((category) => {
        const config = getIconConfig(category.category_name);
        const IconComponent = config.icon;
        const isSelected = selectedId === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleSelect(category)}
            className={`
              flex flex-col items-center justify-center gap-3 p-6
              rounded-2xl border-2 transition-all duration-150
              active:scale-95 touch-manipulation
              ${isSelected
                ? `border-blue-500 ${config.bgColor} ring-2 ring-blue-500 ring-offset-2`
                : `border-gray-200 bg-white hover:border-gray-300`
              }
            `}
          >
            <div className={`w-14 h-14 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <IconComponent size={28} className={config.color} />
            </div>
            <span className={`text-sm font-medium text-center line-clamp-2 ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
              {category.category_name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryIconGrid;
