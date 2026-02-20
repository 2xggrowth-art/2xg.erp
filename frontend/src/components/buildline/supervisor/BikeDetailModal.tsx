import { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, CheckCircle, XCircle, Clock, MapPin, User, Hash, Barcode } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import { PhotoGallery } from '../shared/PhotoGallery';
import { formatDistanceToNow } from 'date-fns';
import { KanbanItem, AssemblyStatusHistory } from '../../../types/assembly';

interface BikeDetailModalProps {
  bike: KanbanItem;
  onClose: () => void;
}

interface BikeDetailData {
  id: string;
  barcode: string;
  model_sku: string;
  frame_number?: string;
  current_status: string;
  priority: boolean;
  parts_missing: boolean;
  parts_missing_list?: string[];
  damage_reported: boolean;
  damage_notes?: string;
  damage_photos?: string[];
  checklist?: Record<string, boolean> | null;
  rework_count?: number;
  grn_reference?: string;
  qc_status?: string;
  qc_failure_reason?: string;
  technician_name?: string;
  location_name?: string;
  current_bin_code?: string;
  inwarded_at?: string;
  assigned_at?: string;
  assembly_started_at?: string;
  assembly_completed_at?: string;
  qc_completed_at?: string;
  created_at?: string;
  timeline?: Array<{ status: string; timestamp: string }>;
  location?: { id: string; name: string; code?: string } | null;
  bin_location?: { id: string; bin_code: string; bin_name: string } | null;
  technician?: { id: string; name: string; email: string } | null;
  qc_person?: { id: string; name: string; email: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  inwarded: { label: 'Inwarded', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  assigned: { label: 'Assigned', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ready_for_sale: { label: 'Ready for Sale', color: 'text-green-700', bgColor: 'bg-green-100' },
};

export const BikeDetailModal = ({ bike, onClose }: BikeDetailModalProps) => {
  const [details, setDetails] = useState<BikeDetailData | null>(null);
  const [history, setHistory] = useState<AssemblyStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'checklist'>('details');

  useEffect(() => {
    loadDetails();
  }, [bike.barcode]);

  const loadDetails = async () => {
    setLoading(true);
    // Fetch independently so one failure doesn't block the other
    try {
      const detailsRes = await assemblyService.getBikeDetails(bike.barcode);
      setDetails(detailsRes.data.data);
    } catch (error) {
      console.error('Failed to load bike details', error);
    }
    try {
      const historyRes = await assemblyService.getHistory(bike.id);
      setHistory(historyRes.data.data || []);
    } catch (error) {
      console.error('Failed to load bike history', error);
    }
    setLoading(false);
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const status = statusConfig[details?.current_status || bike.current_status] || statusConfig.inwarded;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {details?.model_sku || bike.model_sku}
              </h2>
              {(details?.priority ?? bike.priority) && (
                <Flag size={14} className="text-red-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{bike.barcode}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4">
          {(['details', 'timeline', 'checklist'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'details' ? 'Details' : tab === 'timeline' ? 'Timeline' : 'Checklist'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading details...</div>
            </div>
          ) : activeTab === 'details' ? (
            <DetailsTab details={details} bike={bike} formatTime={formatTime} formatDate={formatDate} />
          ) : activeTab === 'timeline' ? (
            <TimelineTab history={history} details={details} formatDate={formatDate} />
          ) : (
            <ChecklistTab checklist={details?.checklist} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Details Tab ─── */

interface DetailsTabProps {
  details: BikeDetailData | null;
  bike: KanbanItem;
  formatTime: (dateStr?: string) => string;
  formatDate: (dateStr?: string) => string;
}

const DetailsTab = ({ details, bike, formatTime, formatDate }: DetailsTabProps) => {
  if (!details) {
    return <div className="text-center text-gray-400 py-8">No details available</div>;
  }

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {details.damage_reported && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="font-medium text-red-800 text-sm">Damage Reported</span>
          </div>
          {details.damage_notes && (
            <p className="text-sm text-red-700 mt-1">{details.damage_notes}</p>
          )}
          {details.damage_photos && details.damage_photos.length > 0 && (
            <div className="mt-2">
              <PhotoGallery photos={details.damage_photos} />
            </div>
          )}
        </div>
      )}

      {details.parts_missing && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-orange-600" />
            <span className="font-medium text-orange-800 text-sm">Parts Missing</span>
          </div>
          {details.parts_missing_list && details.parts_missing_list.length > 0 && (
            <ul className="text-sm text-orange-700 mt-1 list-disc list-inside">
              {details.parts_missing_list.map((part, i) => (
                <li key={i}>{part}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {details.rework_count && details.rework_count > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-yellow-600" />
            <span className="font-medium text-yellow-800 text-sm">
              Rework #{details.rework_count}
            </span>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="space-y-3">
        <DetailRow icon={<Barcode size={14} />} label="Barcode" value={details.barcode} />
        {details.frame_number && (
          <DetailRow icon={<Hash size={14} />} label="Frame Number" value={details.frame_number} />
        )}
        {details.grn_reference && (
          <DetailRow icon={<Hash size={14} />} label="GRN Reference" value={details.grn_reference} />
        )}
        <DetailRow
          icon={<User size={14} />}
          label="Technician"
          value={details.technician_name || details.technician?.name || 'Not assigned'}
        />
        <DetailRow
          icon={<MapPin size={14} />}
          label="Location"
          value={details.location?.name || details.location_name || '-'}
        />
        {(details.bin_location || details.current_bin_code) && (
          <DetailRow
            icon={<MapPin size={14} />}
            label="Bin"
            value={details.bin_location?.bin_code || details.current_bin_code || '-'}
          />
        )}
      </div>

      {/* Timestamps */}
      <div className="border-t pt-3 space-y-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamps</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs">Inwarded</span>
            <p className="text-gray-900 text-xs font-medium">{formatTime(details.inwarded_at)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Assigned</span>
            <p className="text-gray-900 text-xs font-medium">{formatTime(details.assigned_at)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Assembly Started</span>
            <p className="text-gray-900 text-xs font-medium">{formatTime(details.assembly_started_at)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Assembly Completed</span>
            <p className="text-gray-900 text-xs font-medium">{formatTime(details.assembly_completed_at)}</p>
          </div>
        </div>
      </div>

      {/* QC */}
      {details.qc_status && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">QC Result</h4>
          <div className="flex items-center gap-2">
            {details.qc_status === 'pass' ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : (
              <XCircle size={16} className="text-red-600" />
            )}
            <span className={`text-sm font-medium ${details.qc_status === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
              {details.qc_status === 'pass' ? 'Passed' : 'Failed'}
            </span>
          </div>
          {details.qc_failure_reason && (
            <p className="text-sm text-red-600 mt-1">{details.qc_failure_reason}</p>
          )}
          {details.qc_person && (
            <p className="text-xs text-gray-500 mt-1">QC by: {details.qc_person.name}</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Detail Row helper ─── */

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const DetailRow = ({ icon, label, value }: DetailRowProps) => (
  <div className="flex items-center gap-3">
    <div className="text-gray-400 flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

/* ─── Timeline Tab ─── */

interface TimelineTabProps {
  history: AssemblyStatusHistory[];
  details: BikeDetailData | null;
  formatDate: (dateStr?: string) => string;
}

const TimelineTab = ({ history, details, formatDate }: TimelineTabProps) => {
  // Combine history from API and details.timeline
  const timelineItems = history.length > 0
    ? history.map((h) => ({
        id: h.id,
        from: h.from_status,
        to: h.to_status,
        by: h.changed_by_name || h.changed_by,
        reason: h.reason,
        at: h.created_at,
      }))
    : (details?.timeline || []).map((t, i) => ({
        id: `tl-${i}`,
        from: null as string | null,
        to: t.status,
        by: null as string | null,
        reason: null as string | null,
        at: t.timestamp,
      }));

  if (timelineItems.length === 0) {
    return <div className="text-center text-gray-400 py-8 text-sm">No timeline data</div>;
  }

  return (
    <div className="space-y-0">
      {timelineItems.map((item, index) => {
        const toStatus = statusConfig[item.to] || { label: item.to, color: 'text-gray-700', bgColor: 'bg-gray-100' };
        const isLast = index === timelineItems.length - 1;

        return (
          <div key={item.id} className="flex gap-3">
            {/* Line */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                index === 0 ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
              {!isLast && <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${toStatus.bgColor} ${toStatus.color}`}>
                  {toStatus.label}
                </span>
                {item.from && (
                  <span className="text-xs text-gray-400">
                    from {statusConfig[item.from]?.label || item.from}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Clock size={10} />
                <span>{formatDate(item.at)}</span>
              </div>
              {item.by && (
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <User size={10} />
                  <span>{item.by}</span>
                </div>
              )}
              {item.reason && (
                <p className="text-xs text-gray-600 mt-1 italic">{item.reason}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Checklist Tab ─── */

interface ChecklistTabProps {
  checklist?: Record<string, boolean> | null;
}

const ChecklistTab = ({ checklist }: ChecklistTabProps) => {
  if (!checklist || Object.keys(checklist).length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        No checklist data. Assembly checklist is filled in by the technician during assembly.
      </div>
    );
  }

  const items = Object.entries(checklist);
  const completedCount = items.filter(([, v]) => v).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          Progress: {completedCount}/{items.length}
        </span>
        <span className="text-xs text-gray-500">
          {items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map(([key, value]) => (
          <div
            key={key}
            className={`flex items-center gap-2.5 p-2.5 rounded-lg ${
              value ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            {value ? (
              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            ) : (
              <XCircle size={16} className="text-gray-400 flex-shrink-0" />
            )}
            <span className={`text-sm ${value ? 'text-green-800' : 'text-gray-600'}`}>
              {key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
