import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Settings } from 'lucide-react';

interface TitleBarProps {
  onSettingsClick?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ onSettingsClick }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = navigator.platform.toUpperCase().includes('MAC');

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = async () => {
    await window.electronAPI?.maximizeWindow();
    const maximized = await window.electronAPI?.isMaximized();
    setIsMaximized(maximized);
  };
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <div className="h-9 bg-gray-900 dark:bg-gray-950 flex items-center select-none drag-region flex-shrink-0">
      {/* macOS traffic lights occupy left side - leave space */}
      {isMac && <div className="w-20" />}

      {/* App title */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          2XG POS
        </span>
      </div>

      {/* Settings button */}
      <button
        onClick={onSettingsClick}
        className="no-drag px-3 h-full flex items-center hover:bg-gray-700 transition-colors"
        title="Settings"
      >
        <Settings size={14} className="text-gray-400" />
      </button>

      {/* Window controls (Windows/Linux only) */}
      {!isMac && (
        <div className="flex h-full no-drag">
          <button
            onClick={handleMinimize}
            className="px-3 h-full flex items-center hover:bg-gray-700 transition-colors"
          >
            <Minus size={14} className="text-gray-400" />
          </button>
          <button
            onClick={handleMaximize}
            className="px-3 h-full flex items-center hover:bg-gray-700 transition-colors"
          >
            {isMaximized ? (
              <Square size={12} className="text-gray-400" />
            ) : (
              <Maximize2 size={14} className="text-gray-400" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-3 h-full flex items-center hover:bg-red-600 transition-colors group"
          >
            <X size={14} className="text-gray-400 group-hover:text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
