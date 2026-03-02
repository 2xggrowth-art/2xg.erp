import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import TitleBar from './components/common/TitleBar';
import SetupWizard from './components/setup/SetupWizard';
import SettingsPage from './components/settings/SettingsPage';
import PosCreate from './pages/PosCreate';

type AppView = 'loading' | 'setup' | 'pos' | 'settings';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('loading');

  useEffect(() => {
    const checkSetup = async () => {
      try {
        if (window.electronAPI) {
          const setupCompleted = await window.electronAPI.getAppSetting('setup_completed');
          setView(setupCompleted === 'true' ? 'pos' : 'setup');
        } else {
          // Running in browser (dev mode without electron)
          setView('pos');
        }
      } catch {
        setView('setup');
      }
    };
    checkSetup();
  }, []);

  const handleSetupComplete = () => {
    setView('pos');
  };

  const handleSettingsClick = () => {
    setView('settings');
  };

  const handleBackToPos = () => {
    setView('pos');
  };

  if (view === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading 2XG POS...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="h-screen w-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
          <TitleBar onSettingsClick={view === 'pos' ? handleSettingsClick : undefined} />
          <div className="flex-1 overflow-hidden">
            {view === 'setup' && <SetupWizard onComplete={handleSetupComplete} />}
            {view === 'pos' && <PosCreate />}
            {view === 'settings' && <SettingsPage onBack={handleBackToPos} />}
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
