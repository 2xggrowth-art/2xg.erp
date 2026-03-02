import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { syncService, SyncStatus } from '../../services/sync.service';

const SyncStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastPull: null,
    lastPush: null,
    pendingCount: 0,
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkStatus = async () => {
      try {
        const status = await syncService.getStatus();
        setSyncStatus(status);
      } catch {
        // ignore
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    try {
      await syncService.push();
      await syncService.pull();
      const status = await syncService.getStatus();
      setSyncStatus(status);
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && syncStatus.pendingCount === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        <Cloud size={14} className="text-green-600 dark:text-green-400" />
        <span className="text-green-700 dark:text-green-400">Synced</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium">
        <WifiOff size={14} className="text-red-600 dark:text-red-400" />
        <span className="text-red-700 dark:text-red-400">Offline</span>
        {syncStatus.pendingCount > 0 && (
          <span className="text-red-600 dark:text-red-400">({syncStatus.pendingCount} pending)</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs font-medium">
      <CloudOff size={14} className="text-yellow-600 dark:text-yellow-400" />
      <span className="text-yellow-700 dark:text-yellow-400">{syncStatus.pendingCount} pending</span>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="ml-1 p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded"
      >
        <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

export default SyncStatusIndicator;
