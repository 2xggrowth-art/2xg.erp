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

const Step2Appearance: React.FC = () => {
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
      description: 'Bright and clean',
      previewBg: 'bg-white',
      previewText: 'text-gray-900',
      previewSidebar: 'bg-gray-100',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes',
      previewBg: 'bg-gray-900',
      previewText: 'text-white',
      previewSidebar: 'bg-gray-800',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Match your OS',
      previewBg: 'bg-gradient-to-r from-white to-gray-900',
      previewText: 'text-gray-500',
      previewSidebar: 'bg-gradient-to-r from-gray-100 to-gray-800',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Theme & Appearance
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose how your POS looks. You can change this anytime in Settings.
        </p>
      </div>

      {/* Theme Mode */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Display Mode
        </label>
        <div className="grid grid-cols-3 gap-4">
          {modeOptions.map((option) => {
            const isSelected = mode === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }
                `}
              >
                {/* Mini preview */}
                <div
                  className={`w-full h-16 rounded-lg mb-3 overflow-hidden border border-gray-200 dark:border-gray-600 ${option.previewBg}`}
                >
                  <div className="flex h-full">
                    <div className={`w-1/4 h-full ${option.previewSidebar}`} />
                    <div className="flex-1 p-1.5">
                      <div
                        className={`h-1.5 rounded w-3/4 mb-1 ${
                          option.value === 'dark'
                            ? 'bg-gray-700'
                            : option.value === 'light'
                            ? 'bg-gray-200'
                            : 'bg-gray-400'
                        }`}
                      />
                      <div
                        className={`h-1.5 rounded w-1/2 ${
                          option.value === 'dark'
                            ? 'bg-gray-700'
                            : option.value === 'light'
                            ? 'bg-gray-200'
                            : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Icon
                    size={16}
                    className={
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  />
                  <span
                    className={`text-sm font-semibold ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
                  {option.description}
                </p>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Color */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Accent Color
        </label>
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
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Selected: {THEME_COLORS.find((c) => c.name === selectedColor)?.label}
        </p>
      </div>

      {/* Live Preview */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Preview
        </label>
        <div
          className={`
            rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700
            ${isDark ? 'bg-gray-900' : 'bg-white'}
          `}
        >
          {/* Preview Title Bar */}
          <div
            className={`h-8 flex items-center px-3 gap-1.5 ${
              isDark ? 'bg-gray-950' : 'bg-gray-900'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-400 ml-2 tracking-wider uppercase">
              2XG POS
            </span>
          </div>

          {/* Preview Body */}
          <div className="flex h-40">
            {/* Sidebar */}
            <div
              className={`w-24 p-2 space-y-1.5 border-r ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {['Items', 'Cart', 'Pay'].map((label, i) => (
                <div
                  key={label}
                  className={`
                    h-6 rounded px-2 flex items-center text-[10px] font-medium
                    ${
                      i === 0
                        ? `${THEME_COLORS.find((c) => c.name === selectedColor)?.bg} text-white`
                        : isDark
                        ? 'text-gray-400 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 space-y-2">
              <div
                className={`h-3 rounded w-2/3 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-3 rounded w-1/2 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
              <div className="flex gap-2 mt-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className={`h-16 w-16 rounded-lg ${
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

export default Step2Appearance;
