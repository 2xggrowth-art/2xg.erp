import React, { useState } from 'react';
import { LogIn, WifiOff, CheckCircle, XCircle, Loader2, Settings } from 'lucide-react';

const DEFAULT_CLOUD_URL = 'https://api.erp.2xg.in/api';

interface Step1WelcomeProps {
  onCloudConfigured: (configured: boolean) => void;
}

const Step1Welcome: React.FC<Step1WelcomeProps> = ({ onCloudConfigured }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(DEFAULT_CLOUD_URL);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) return;

    setVerifying(true);
    setVerifyStatus('idle');
    setVerifyMessage('');

    const baseUrl = (cloudUrl || DEFAULT_CLOUD_URL).trim().replace(/\/+$/, '');

    try {
      // Authenticate with cloud ERP — saves JWT token + cloud_url
      const loginResult = await window.electronAPI.syncLogin(baseUrl, email.trim(), password);

      if (loginResult.success) {
        setVerifyStatus('success');
        setVerifyMessage(`Logged in as ${loginResult.data?.user?.email || email.trim()}`);
        onCloudConfigured(true);
      } else {
        setVerifyStatus('error');
        setVerifyMessage(loginResult.error || 'Login failed');
        onCloudConfigured(false);
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setVerifyMessage(
        err?.name === 'TimeoutError'
          ? 'Connection timed out. Check your internet and try again.'
          : `Connection failed: ${err?.message || 'Unknown error'}`
      );
      onCloudConfigured(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSkipCloud = async () => {
    await window.electronAPI.setAppSetting('cloud_mode', 'offline');
    onCloudConfigured(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-2xl font-black tracking-tight">2XG</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome to 2XG POS
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
          Fast, offline-first point of sale. Sign in to sync your store data.
        </p>
      </div>

      {/* Login */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <LogIn size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Sign in to 2XG ERP
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your items, customers, and settings will be downloaded automatically.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Advanced: Custom URL (hidden by default) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Settings size={12} />
              {showAdvanced ? 'Hide' : 'Custom server URL'}
            </button>

            {showAdvanced && (
              <div className="mt-2">
                <input
                  type="url"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  placeholder={DEFAULT_CLOUD_URL}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs"
                />
              </div>
            )}
          </div>

          {/* Status message */}
          {verifyStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
                verifyStatus === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {verifyStatus === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {verifyMessage}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleLogin}
              disabled={!email.trim() || !password || verifying}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  !email.trim() || !password || verifying
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {verifying && <Loader2 size={14} className="animate-spin" />}
              Sign In
            </button>

            <button
              onClick={handleSkipCloud}
              className="flex items-center gap-2 px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <WifiOff size={14} />
              Skip — Use Offline Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1Welcome;
