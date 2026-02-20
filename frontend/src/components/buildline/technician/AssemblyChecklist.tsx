import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, Clock, AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChecklistBike {
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
}

interface AssemblyChecklistProps {
  bike: ChecklistBike;
  onComplete: (barcode: string, checklist: Record<string, boolean>) => Promise<void>;
  onUpdate: (barcode: string, checklist: Record<string, boolean>) => Promise<void>;
  onReportIssue: () => void;
  onBack: () => void;
}

interface ChecklistCategory {
  name: string;
  items: string[];
}

const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    name: 'Frame & Fork',
    items: [
      'frame_inspection',
      'fork_installed',
      'headset_adjusted',
      'stem_tightened',
      'handlebar_aligned',
    ],
  },
  {
    name: 'Wheels & Tyres',
    items: [
      'front_wheel_installed',
      'rear_wheel_installed',
      'front_tyre_inflated',
      'rear_tyre_inflated',
      'quick_release_secure',
      'wheel_true_check',
    ],
  },
  {
    name: 'Brakes',
    items: [
      'front_brake_installed',
      'rear_brake_installed',
      'front_brake_adjusted',
      'rear_brake_adjusted',
      'brake_cables_routed',
      'brake_levers_positioned',
    ],
  },
  {
    name: 'Drivetrain & Gears',
    items: [
      'chain_installed',
      'chain_tension_correct',
      'front_derailleur_adjusted',
      'rear_derailleur_adjusted',
      'gear_cables_routed',
      'shifters_functioning',
      'pedals_installed',
      'crank_bolts_torqued',
    ],
  },
  {
    name: 'Seat & Accessories',
    items: [
      'seat_post_inserted',
      'saddle_tightened',
      'reflectors_installed',
      'bell_installed',
      'kickstand_installed',
    ],
  },
  {
    name: 'Final Checks',
    items: [
      'all_bolts_torqued',
      'test_ride_completed',
      'bike_cleaned',
      'barcode_label_attached',
    ],
  },
];

const formatChecklistItemLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getAllChecklistKeys = (): string[] => {
  return CHECKLIST_CATEGORIES.flatMap((cat) => cat.items);
};

export const AssemblyChecklist = ({
  bike,
  onComplete,
  onUpdate,
  onReportIssue,
  onBack,
}: AssemblyChecklistProps) => {
  const allKeys = getAllChecklistKeys();

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const key of allKeys) {
      initial[key] = bike.checklist?.[key] ?? false;
    }
    return initial;
  });

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    CHECKLIST_CATEGORIES[0].name
  );
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = allKeys.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = completedCount === totalCount;

  const getCategoryProgress = useCallback(
    (category: ChecklistCategory) => {
      const done = category.items.filter((key) => checklist[key]).length;
      return { done, total: category.items.length };
    },
    [checklist]
  );

  const toggleItem = (key: string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Auto-save after changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (completedCount > 0) {
        handleSave();
      }
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(bike.barcode, checklist);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save checklist:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!allCompleted) {
      toast.error('Please complete all checklist items before finishing.');
      return;
    }

    const confirmFinish = window.confirm(
      'Are you sure you want to mark this assembly as complete? This will send the bike for QC / ready for sale.'
    );
    if (!confirmFinish) return;

    try {
      setCompleting(true);
      await onComplete(bike.barcode, checklist);
    } catch (error) {
      console.error('Failed to complete assembly:', error);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Queue
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {bike.model_sku}
              {bike.priority && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                  PRIORITY
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              Barcode: {bike.barcode}
              {bike.frame_number && ` | Frame: ${bike.frame_number}`}
            </p>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* QC Rework Warning */}
        {bike.qc_status === 'failed' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  QC Failed - Rework Required (Attempt #{bike.rework_count || 1})
                </p>
                {bike.qc_failure_reason && (
                  <p className="text-sm text-yellow-700 mt-1">{bike.qc_failure_reason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Assembly Progress</span>
            <span className="font-medium text-gray-900">
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                allCompleted ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-2">
        {CHECKLIST_CATEGORIES.map((category) => {
          const { done, total } = getCategoryProgress(category);
          const isExpanded = expandedCategory === category.name;
          const categoryComplete = done === total;

          return (
            <div key={category.name} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {categoryComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      categoryComplete ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {done}/{total}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-3">
                  {category.items.map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        className="flex-shrink-0"
                      >
                        {checklist[key] ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                      <span
                        className={`text-sm ${
                          checklist[key] ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}
                      >
                        {formatChecklistItemLabel(key)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <button
          onClick={handleComplete}
          disabled={!allCompleted || completing}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
            allCompleted
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {completing ? 'Completing Assembly...' : allCompleted ? 'Complete Assembly' : `Complete All ${totalCount - completedCount} Remaining Items`}
        </button>

        <button
          onClick={onReportIssue}
          className="w-full py-3 px-4 rounded-lg font-medium text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Report Issue
        </button>
      </div>
    </div>
  );
};
