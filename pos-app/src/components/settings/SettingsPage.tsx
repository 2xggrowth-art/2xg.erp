import React, { useState } from 'react';
import { ArrowLeft, Printer, RefreshCw, Palette, Info } from 'lucide-react';
import PrinterSettings from './PrinterSettings';
import SyncSettings from './SyncSettings';
import AppearanceSettings from './AppearanceSettings';

interface SettingsPageProps {
  onBack: () => void;
}

type SettingsTab = 'printer' | 'sync' | 'appearance' | 'about';

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'printer', label: 'Printer', icon: <Printer size={18} /> },
  { key: 'sync', label: 'Sync', icon: <RefreshCw size={18} /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { key: 'about', label: 'About', icon: <Info size={18} /> },
];

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('printer');

  const renderPanel = () => {
    switch (activeTab) {
      case 'printer':
        return <PrinterSettings />;
      case 'sync':
        return <SyncSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'about':
        return <AboutPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to POS</span>
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-3">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <span
                    className={
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">{renderPanel()}</div>
        </div>
      </div>
    </div>
  );
};

const AboutPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">About</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Application information and version details.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black tracking-tight">2XG</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">2XG POS</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Application</span>
            <span className="text-gray-900 dark:text-white font-medium">2XG POS</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Version</span>
            <span className="text-gray-900 dark:text-white font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Platform</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {navigator.platform}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Electron</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {navigator.userAgent.match(/Electron\/(\S+)/)?.[1] || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500 dark:text-gray-400">Developer</span>
            <span className="text-gray-900 dark:text-white font-medium">2XG Growth</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Built with Electron, React, and SQLite. Designed for offline-first retail.
      </p>
    </div>
  );
};

export default SettingsPage;
