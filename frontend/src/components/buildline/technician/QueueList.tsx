import { useState } from 'react';
import {
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle,
  Star,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QueueBike {
  id: string;
  barcode: string;
  model_sku: string;
  frame_number?: string;
  current_status: string;
  checklist: Record<string, boolean> | null;
  priority: boolean;
  qc_status?: string;
  qc_failure_reason?: string;
  rework_count?: number;
  assigned_at?: string;
  bin_location?: {
    bin_code?: string;
    bin_name?: string;
  } | null;
}

interface QueueListProps {
  queue: QueueBike[];
  onSelectBike: (bike: QueueBike) => void;
  onRefresh: () => void;
}

type FilterValue = 'all' | 'assigned' | 'in_progress' | 'rework';

const getStatusBadge = (bike: QueueBike) => {
  if (bike.qc_status === 'failed') {
    return {
      label: 'Rework',
      className: 'bg-red-100 text-red-700',
      icon: AlertTriangle,
    };
  }
  if (bike.current_status === 'in_progress') {
    return {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-700',
      icon: Wrench,
    };
  }
  if (bike.current_status === 'assigned') {
    return {
      label: 'Ready to Start',
      className: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
    };
  }
  return {
    label: bike.current_status.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-700',
    icon: CheckCircle,
  };
};

const getChecklistProgress = (checklist: Record<string, boolean> | null): number => {
  if (!checklist) return 0;
  const values = Object.values(checklist);
  if (values.length === 0) return 0;
  const done = values.filter(Boolean).length;
  return Math.round((done / values.length) * 100);
};

export const QueueList = ({ queue, onSelectBike, onRefresh }: QueueListProps) => {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredQueue = queue.filter((bike) => {
    if (filter === 'all') return true;
    if (filter === 'rework') return bike.qc_status === 'failed';
    return bike.current_status === filter;
  });

  // Sort: priority first, then rework, then in_progress, then assigned
  const sortedQueue = [...filteredQueue].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    if ((a.qc_status === 'failed') !== (b.qc_status === 'failed'))
      return a.qc_status === 'failed' ? -1 : 1;
    if (a.current_status === 'in_progress' && b.current_status !== 'in_progress') return -1;
    if (b.current_status === 'in_progress' && a.current_status !== 'in_progress') return 1;
    return 0;
  });

  const reworkCount = queue.filter((b) => b.qc_status === 'failed').length;
  const inProgressCount = queue.filter((b) => b.current_status === 'in_progress').length;
  const assignedCount = queue.filter((b) => b.current_status === 'assigned').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{assignedCount}</p>
          <p className="text-xs text-gray-500">Waiting</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{reworkCount}</p>
          <p className="text-xs text-gray-500">Rework</p>
        </div>
      </div>

      {/* Filters & Refresh */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'assigned', label: 'Waiting' },
              { value: 'rework', label: 'Rework' },
            ] as { value: FilterValue; label: string }[]
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Refresh queue"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Queue Items */}
      {sortedQueue.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'all' ? 'No bikes in your queue' : `No ${filter.replace('_', ' ')} bikes`}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'all'
              ? 'Ask your supervisor to assign bikes to you.'
              : 'Try changing the filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedQueue.map((bike) => {
            const status = getStatusBadge(bike);
            const StatusIcon = status.icon;
            const progress = getChecklistProgress(bike.checklist);

            return (
              <button
                key={bike.id}
                onClick={() => onSelectBike(bike)}
                className="w-full bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {bike.priority && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {bike.model_sku}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{bike.barcode}</span>
                      {bike.frame_number && <span>Frame: {bike.frame_number}</span>}
                      {bike.bin_location?.bin_code && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {bike.bin_location.bin_code}
                        </span>
                      )}
                    </div>

                    {/* Progress bar for in-progress bikes */}
                    {bike.current_status === 'in_progress' && progress > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                    )}

                    {/* Rework info */}
                    {bike.qc_status === 'failed' && bike.qc_failure_reason && (
                      <p className="mt-1.5 text-xs text-red-600 truncate">
                        QC: {bike.qc_failure_reason}
                      </p>
                    )}

                    {/* Time since assigned */}
                    {bike.assigned_at && (
                      <p className="mt-1 text-xs text-gray-400">
                        Assigned {formatDistanceToNow(new Date(bike.assigned_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 ml-2" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
