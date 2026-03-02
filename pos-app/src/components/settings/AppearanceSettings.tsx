import React, { useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';

const THEME_COLORS: { name: ThemeColor; label: string; bg: string; ring: string }[] = [
  { name: 'blue', label: 'Blue', bg: 'bg-blue-600', ring: 'ring-blue-300 dark:ring-blue-700' },
  { name: 'green', label: 'Green', bg: 'bg-green-600', ring: 'ring-green-300 dark:ring-green-700' },
  { name: 'purple', label: 'Purple', bg: 'bg-purple-600', ring: 'ring-purple-300 dark:ring-purple-700' },
  { name: 'orange', label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-300 dark:ring-orange-700' },
  { name: 'red', label: 'Red', bg: 'bg-red-600', ring: 'ring-red-300 dark:ring-red-700' },
  { name: 'teal', label: 'Teal', bg: 'bg-teal-600', ring: 'ring-teal-300 dark:ring-teal-700' },
];

const AppearanceSettings: React.FC = () => {
  const { mode, setMode, isDark } = useTheme();
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(() => {
    return (localStorage.getItem('theme-color') as ThemeColor) || 'blue';
  });

  const handleColorChange = (color: ThemeColor) => {
    setSelectedColor(color);
    localStorage.setItem('theme-color', color);
  };

  const modeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Bright and clean for well-lit environments',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes, great for low light',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Automatically match your operating system',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize the look and feel of 2XG POS.
        </p>
      </div>

      {/* Theme Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Display Mode
        </h3>
        <div className="space-y-2">
          {modeOptions.map((option) => {
            const isSelected = mode === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }
                `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/50'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }
                  `}
                >
                  <Icon
                    size={20}
                    className={
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Accent Color
        </h3>
        <div className="flex items-center gap-3">
          {THEME_COLORS.map((color) => {
            const isSelected = selectedColor === color.name;
            return (
              <button
                key={color.name}
                onClick={() => handleColorChange(color.name)}
                className={`
                  w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center
                  transition-all duration-200
                  ${isSelected ? `ring-4 ${color.ring} scale-110` : 'hover:scale-105'}
                `}
                title={color.label}
              >
                {isSelected && <Check size={18} className="text-white" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Selected: {THEME_COLORS.find((c) => c.name === selectedColor)?.label}
        </p>
      </div>

      {/* Live Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Preview
        </h3>
        <div
          className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Mock title bar */}
          <div
            className={`h-7 flex items-center px-3 gap-1.5 ${
              isDark ? 'bg-gray-950' : 'bg-gray-900'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] text-gray-400 ml-2 tracking-wider uppercase">
              2XG POS
            </span>
          </div>

          {/* Mock body */}
          <div className="flex h-32">
            <div
              className={`w-20 p-2 space-y-1 border-r ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {['Items', 'Cart', 'Pay'].map((label, i) => (
                <div
                  key={label}
                  className={`h-5 rounded px-1.5 flex items-center text-[9px] font-medium ${
                    i === 0
                      ? `${THEME_COLORS.find((c) => c.name === selectedColor)?.bg} text-white`
                      : isDark
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="flex-1 p-2.5 space-y-1.5">
              <div
                className={`h-2.5 rounded w-3/4 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-2.5 rounded w-1/2 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`h-12 w-12 rounded-lg ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
