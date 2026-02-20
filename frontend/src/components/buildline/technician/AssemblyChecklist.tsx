import { useState } from 'react';
import { CheckCircle, AlertTriangle, ArrowLeft, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChecklistBike {
  id: string;
  barcode: string;
  model_sku: string;
  frame_number?: string;
  current_status: string;
  checklist: Record<string, any> | null;
  priority: boolean;
  qc_status?: string;
  qc_failure_reason?: string;
  rework_count?: number;
  item_name?: string | null;
  item_color?: string | null;
  item_size?: string | null;
  item_variant?: string | null;
}

interface AssemblyChecklistProps {
  bike: ChecklistBike;
  onComplete: (barcode: string, checklist: Record<string, string>) => Promise<void>;
  onUpdate: (barcode: string, checklist: Record<string, string>) => Promise<void>;
  onReportIssue: () => void;
  onBack: () => void;
}

export const AssemblyChecklist = ({
  bike,
  onComplete,
  onReportIssue,
  onBack,
}: AssemblyChecklistProps) => {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    const confirmFinish = window.confirm(
      'Are you sure you want to mark this assembly as complete? This will send the bike for QC / ready for sale.'
    );
    if (!confirmFinish) return;

    try {
      setCompleting(true);
      await onComplete(bike.barcode, { status: 'completed' });
    } catch (error) {
      console.error('Failed to complete assembly:', error);
      toast.error('Failed to complete assembly');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {bike.model_sku}
            {bike.priority && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                PRIORITY
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Barcode: {bike.barcode}
            {bike.frame_number && ` | Frame: ${bike.frame_number}`}
          </p>
          {(bike.item_name || bike.item_color || bike.item_size) && (
            <p className="text-sm text-gray-400 mt-1">
              {[bike.item_name, bike.item_color, bike.item_size, bike.item_variant].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* QC Rework Warning */}
        {bike.qc_status === 'failed' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Completed Button */}
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl p-6 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12" />
            <div>
              <p className="text-lg font-bold">
                {completing ? 'Completing...' : 'Mark as Completed'}
              </p>
              <p className="text-sm text-green-100 mt-1">
                Assembly is done, send for QC / ready for sale
              </p>
            </div>
          </div>
        </button>

        {/* Report Damage Button */}
        <button
          onClick={onReportIssue}
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl p-6 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="w-12 h-12" />
            <div>
              <p className="text-lg font-bold">Report Damage</p>
              <p className="text-sm text-red-100 mt-1">
                Report damage or missing parts, pause assembly
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
