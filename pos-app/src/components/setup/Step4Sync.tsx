import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Package,
  Users,
  MapPin,
  Settings,
  Monitor,
} from 'lucide-react';
import { syncService } from '../../services/sync.service';

interface Step4SyncProps {
  cloudConfigured: boolean;
}

interface SyncStage {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'syncing' | 'success' | 'error';
  message?: string;
}

const Step4Sync: React.FC<Step4SyncProps> = ({ cloudConfigured }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [stages, setStages] = useState<SyncStage[]>([
    { key: 'items', label: 'Items & Inventory', icon: <Package size={16} />, status: 'pending' },
    { key: 'customers', label: 'Customers', icon: <Users size={16} />, status: 'pending' },
    { key: 'bins', label: 'Bin Locations', icon: <MapPin size={16} />, status: 'pending' },
    { key: 'settings', label: 'Settings', icon: <Settings size={16} />, status: 'pending' },
    { key: 'device', label: 'Device Registration', icon: <Monitor size={16} />, status: 'pending' },
  ]);
  const [seedingData, setSeedingData] = useState(false);

  const updateStage = (key: string, update: Partial<SyncStage>) => {
    setStages((prev) =>
      prev.map((stage) => (stage.key === key ? { ...stage, ...update } : stage))
    );
  };

  const handleDownloadData = async () => {
    setSyncing(true);
    setSyncComplete(false);

    // Mark data stages as syncing
    const dataStageKeys = ['items', 'customers', 'bins', 'settings'];
    for (const key of dataStageKeys) {
      updateStage(key, { status: 'syncing' });
    }

    try {
      // Single pull that downloads items, customers, bins, settings, and POS codes
      const result = await syncService.pull();

      if (result.success) {
        for (const key of dataStageKeys) {
          updateStage(key, { status: 'success', message: 'Synced' });
        }
      } else {
        const errorMsg = result.message || 'Sync failed';
        const hasItemsError = errorMsg.toLowerCase().includes('items');
        const hasCustomersError = errorMsg.toLowerCase().includes('customers');
        const hasBinsError = errorMsg.toLowerCase().includes('bin');
        const hasSettingsError = errorMsg.toLowerCase().includes('settings') || errorMsg.toLowerCase().includes('org');

        updateStage('items', hasItemsError
          ? { status: 'error', message: errorMsg }
          : { status: 'success', message: 'Synced' });
        updateStage('customers', hasCustomersError
          ? { status: 'error', message: errorMsg }
          : { status: 'success', message: 'Synced' });
        updateStage('bins', hasBinsError
          ? { status: 'error', message: errorMsg }
          : { status: 'success', message: 'Synced' });
        updateStage('settings', hasSettingsError
          ? { status: 'error', message: errorMsg }
          : { status: 'success', message: 'Synced' });
      }

      // Device registration — runs after data pull to get org_code
      updateStage('device', { status: 'syncing' });
      try {
        const deviceResult = await syncService.registerDevice();
        if (deviceResult.success) {
          updateStage('device', { status: 'success', message: `Device #${deviceResult.data?.device_number || '?'}` });
        } else {
          updateStage('device', { status: 'error', message: deviceResult.message || 'Registration failed' });
        }
      } catch (devErr: any) {
        updateStage('device', { status: 'error', message: devErr?.message || 'Registration failed' });
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to sync';
      for (const key of [...dataStageKeys, 'device']) {
        updateStage(key, { status: 'error', message: errorMsg });
      }
    }

    setSyncing(false);
    setSyncComplete(true);
  };

  const handleSeedSampleData = async () => {
    setSeedingData(true);
    try {
      await window.electronAPI.setAppSetting('seed_sample_data', 'true');
      // The main process will handle seeding on next check
      setSyncComplete(true);
    } catch (err) {
      console.error('Failed to seed sample data:', err);
    } finally {
      setSeedingData(false);
    }
  };

  const completedCount = stages.filter((s) => s.status === 'success').length;
  const failedCount = stages.filter((s) => s.status === 'error').length;
  const progress = (completedCount / stages.length) * 100;

  if (cloudConfigured) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Initial Data Sync
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Download your data from the cloud ERP to start working offline.
          </p>
        </div>

        {/* Cloud Connected Banner */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <Cloud size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Cloud ERP Connected
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Ready to download your data.
            </p>
          </div>
        </div>

        {/* Download Button */}
        {!syncing && !syncComplete && (
          <button
            onClick={handleDownloadData}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Download size={20} />
            Download Data from Cloud
          </button>
        )}

        {/* Progress Bar */}
        {(syncing || syncComplete) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {syncing
                  ? 'Syncing...'
                  : failedCount > 0
                  ? `Completed with ${failedCount} error${failedCount > 1 ? 's' : ''}`
                  : 'All data synced successfully!'}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  failedCount > 0 ? 'bg-yellow-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Sync Stages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`
                    ${
                      stage.status === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : stage.status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : stage.status === 'syncing'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  `}
                >
                  {stage.icon}
                </span>
                <span
                  className={`text-sm font-medium ${
                    stage.status === 'pending'
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {stage.message && (
                  <span
                    className={`text-xs ${
                      stage.status === 'error'
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {stage.message}
                  </span>
                )}
                {stage.status === 'syncing' && (
                  <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
                )}
                {stage.status === 'success' && (
                  <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                )}
                {stage.status === 'error' && (
                  <XCircle size={16} className="text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Success message */}
        {syncComplete && failedCount === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 text-center">
            <CheckCircle size={32} className="text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              All data downloaded successfully!
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Click "Finish Setup" below to start using 2XG POS.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Offline-only mode
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          You're All Set!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          You can configure cloud sync later in Settings.
        </p>
      </div>

      {/* Offline Mode Banner */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <CloudOff size={24} className="text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Offline Mode
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            All data will be stored locally on this device. You can connect to the
            cloud ERP later to sync items, customers, and invoices.
          </p>
        </div>
      </div>

      {/* Sample Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Sample Data
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Load sample items and customers to explore the POS.
            </p>
          </div>
        </div>

        {syncComplete ? (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 rounded-lg">
            <CheckCircle size={16} />
            Sample data will be loaded when you finish setup.
          </div>
        ) : (
          <button
            onClick={handleSeedSampleData}
            disabled={seedingData}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {seedingData ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Database size={14} />
            )}
            Load Sample Data
          </button>
        )}
      </div>

      {/* Ready message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 text-center">
        <CheckCircle size={32} className="text-blue-600 dark:text-blue-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          Ready to go!
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Click "Finish Setup" below to start using 2XG POS.
        </p>
      </div>
    </div>
  );
};

export default Step4Sync;
