import React, { useState, useEffect } from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { offlineService } from '../../services/offline.service';

interface OfflineIndicatorProps {
  onSync?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSync }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count periodically
    const interval = setInterval(() => {
      setPendingCount(offlineService.getPendingCount());
    }, 5000);

    // Initial check
    setPendingCount(offlineService.getPendingCount());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
        !isOnline
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff size={14} />
          <span>Offline Mode</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudOff size={14} />
          <span>Offline Invoices: {pendingCount}</span>
          <button
            onClick={onSync}
            className="ml-1 p-1 hover:bg-yellow-100 rounded"
          >
            <RefreshCw size={12} />
          </button>
        </>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;
