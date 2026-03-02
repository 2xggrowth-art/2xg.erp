import React, { useState } from 'react';
import { Globe, WifiOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Step1WelcomeProps {
  onCloudConfigured: (configured: boolean) => void;
}

const Step1Welcome: React.FC<Step1WelcomeProps> = ({ onCloudConfigured }) => {
  const [companyName, setCompanyName] = useState('');
  const [cloudUrl, setCloudUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

  const handleVerifyConnection = async () => {
    if (!cloudUrl.trim()) return;

    setVerifying(true);
    setVerifyStatus('idle');
    setVerifyMessage('');

    try {
      // Test the cloud ERP connection
      const response = await fetch(`${cloudUrl.replace(/\/+$/, '')}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        setVerifyStatus('success');
        setVerifyMessage('Connected successfully!');

        // Save cloud settings
        await window.electronAPI.setAppSetting('cloud_url', cloudUrl.trim());
        if (email.trim()) {
          await window.electronAPI.setAppSetting('cloud_email', email.trim());
        }
        if (password) {
          await window.electronAPI.setAppSetting('cloud_password', password);
        }
        onCloudConfigured(true);
      } else {
        setVerifyStatus('error');
        setVerifyMessage(`Server responded with status ${response.status}`);
        onCloudConfigured(false);
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setVerifyMessage(
        err?.name === 'TimeoutError'
          ? 'Connection timed out. Check the URL and try again.'
          : `Connection failed: ${err?.message || 'Unknown error'}`
      );
      onCloudConfigured(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSkipCloud = async () => {
    if (companyName.trim()) {
      await window.electronAPI.setAppSetting('company_name', companyName.trim());
    }
    await window.electronAPI.setAppSetting('cloud_mode', 'offline');
    onCloudConfigured(false);
  };

  const handleSaveCompanyName = async () => {
    if (companyName.trim()) {
      await window.electronAPI.setAppSetting('company_name', companyName.trim());
    }
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
          Fast, offline-first point of sale. Set up your store in a few quick steps.
        </p>
      </div>

      {/* Company Name */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          This will appear on receipts and invoices.
        </p>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onBlur={handleSaveCompanyName}
          placeholder="e.g. My Retail Store"
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
      </div>

      {/* Cloud Connection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Globe size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Cloud ERP Connection
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Optional. Connect to sync items, customers, and invoices.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cloud ERP URL
            </label>
            <input
              type="url"
              value={cloudUrl}
              onChange={(e) => setCloudUrl(e.target.value)}
              placeholder="https://api.erp.2xg.in/api"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
                placeholder="Enter password"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Verify status message */}
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

          <div className="flex items-center gap-3">
            <button
              onClick={handleVerifyConnection}
              disabled={!cloudUrl.trim() || verifying}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  !cloudUrl.trim() || verifying
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {verifying && <Loader2 size={14} className="animate-spin" />}
              Connect & Verify
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
