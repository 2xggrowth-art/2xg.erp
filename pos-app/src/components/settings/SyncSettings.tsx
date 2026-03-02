import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { syncService, SyncStatus, SyncQueueItem } from '../../services/sync.service';

const SYNC_INTERVALS = [
  { value: '5', label: 'Every 5 minutes' },
  { value: '15', label: 'Every 15 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: 'manual', label: 'Manual only' },
];

const SyncSettings: React.FC = () => {
  const [cloudUrl, setCloudUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncInterval, setSyncInterval] = useState('15');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    lastPull: null,
    lastPush: null,
    pendingCount: 0,
  });
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pullResult, setPullResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [savedUrl, savedEmail, savedInterval, status, queue] = await Promise.all([
        window.electronAPI.getAppSetting('cloud_url'),
        window.electronAPI.getAppSetting('cloud_email'),
        window.electronAPI.getAppSetting('sync_interval'),
        syncService.getStatus(),
        syncService.getQueue(),
      ]);

      if (savedUrl) setCloudUrl(savedUrl);
      if (savedEmail) setEmail(savedEmail);
      if (savedInterval) setSyncInterval(savedInterval);
      setSyncStatus(status);
      setSyncQueue(queue);
    } catch (err) {
      console.error('Failed to load sync settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        window.electronAPI.setAppSetting('cloud_url', cloudUrl.trim()),
        window.electronAPI.setAppSetting('cloud_email', email.trim()),
        window.electronAPI.setAppSetting('sync_interval', syncInterval),
      ]);
      if (password) {
        await window.electronAPI.setAppSetting('cloud_password', password);
      }
      if (cloudUrl.trim()) {
        await window.electronAPI.setAppSetting('cloud_mode', 'online');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save sync settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePull = async () => {
    setPulling(true);
    setPullResult(null);
    try {
      const result = await syncService.pull();
      setPullResult(result);
      const status = await syncService.getStatus();
      setSyncStatus(status);
      const queue = await syncService.getQueue();
      setSyncQueue(queue);
    } catch (err: any) {
      setPullResult({ success: false, message: err?.message || 'Pull failed' });
    } finally {
      setPulling(false);
    }
  };

  const handlePush = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const result = await syncService.push();
      setPushResult(result);
      const status = await syncService.getStatus();
      setSyncStatus(status);
      const queue = await syncService.getQueue();
      setSyncQueue(queue);
    } catch (err: any) {
      setPushResult({ success: false, message: err?.message || 'Push failed' });
    } finally {
      setPushing(false);
    }
  };

  const formatTimestamp = (ts: string | null): string => {
    if (!ts) return 'Never';
    try {
      const date = new Date(ts);
      return date.toLocaleString();
    } catch {
      return ts;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Loading sync settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sync</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage cloud ERP connection and data synchronization.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Connection Status */}
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border ${
          syncStatus.isOnline
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}
      >
        {syncStatus.isOnline ? (
          <>
            <Cloud size={20} className="text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              Connected to Cloud ERP
            </span>
          </>
        ) : (
          <>
            <CloudOff size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {cloudUrl ? 'Disconnected' : 'No cloud URL configured'}
            </span>
          </>
        )}
      </div>

      {/* Cloud URL & Credentials */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Cloud ERP Connection
        </h3>

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
              placeholder="Enter new password to update"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Last Sync & Interval */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Sync Schedule
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Clock size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Pull</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTimestamp(syncStatus.lastPull)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Clock size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Push</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTimestamp(syncStatus.lastPush)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sync Interval
          </label>
          <select
            value={syncInterval}
            onChange={(e) => setSyncInterval(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          >
            {SYNC_INTERVALS.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Manual Sync */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Manual Sync
        </h3>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePull}
            disabled={pulling || !cloudUrl}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${
                pulling || !cloudUrl
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            `}
          >
            {pulling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Pull from Cloud
          </button>

          <button
            onClick={handlePush}
            disabled={pushing || !cloudUrl}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${
                pushing || !cloudUrl
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }
            `}
          >
            {pushing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Push to Cloud
          </button>
        </div>

        {/* Pull/Push Result Messages */}
        {pullResult && (
          <div
            className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
              pullResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {pullResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            Pull: {pullResult.message}
          </div>
        )}

        {pushResult && (
          <div
            className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
              pushResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {pushResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            Push: {pushResult.message}
          </div>
        )}
      </div>

      {/* Sync Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Sync Queue
          </h3>
          {syncStatus.pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium">
              <AlertCircle size={12} />
              {syncStatus.pendingCount} pending
            </span>
          )}
        </div>

        {syncQueue.length === 0 ? (
          <div className="text-center py-6">
            <RefreshCw size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No items in sync queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
            {syncQueue.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'pending'
                        ? 'bg-yellow-500'
                        : item.status === 'synced'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {item.table_name}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-2">
                      {item.operation}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  {item.retry_count > 0 && (
                    <span className="text-orange-500">
                      {item.retry_count} retries
                    </span>
                  )}
                  <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {syncQueue.length > 20 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">
                + {syncQueue.length - 20} more items
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncSettings;
