import { useState } from 'react';
import { X, AlertTriangle, Wrench, Package, Camera } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import { PhotoUpload } from '../shared/PhotoUpload';
import toast from 'react-hot-toast';

interface ReportIssueBike {
  id: string;
  barcode: string;
  model_sku: string;
  frame_number?: string;
}

interface ReportIssueModalProps {
  bike: ReportIssueBike;
  onClose: () => void;
  onSuccess: () => void;
}

type IssueType = 'damage' | 'parts_missing';

const COMMON_PARTS = [
  'Front Wheel',
  'Rear Wheel',
  'Front Tyre',
  'Rear Tyre',
  'Front Brake',
  'Rear Brake',
  'Brake Cables',
  'Chain',
  'Front Derailleur',
  'Rear Derailleur',
  'Gear Cables',
  'Pedals (Left)',
  'Pedals (Right)',
  'Seat Post',
  'Saddle',
  'Handlebar Grips',
  'Bell',
  'Kickstand',
  'Reflectors',
  'Quick Release Skewer',
  'Stem Bolts',
  'Other',
];

export const ReportIssueModal = ({ bike, onClose, onSuccess }: ReportIssueModalProps) => {
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [damageNotes, setDamageNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partNotes, setPartNotes] = useState('');
  const [customPart, setCustomPart] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const togglePart = (part: string) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const addCustomPart = () => {
    const trimmed = customPart.trim();
    if (trimmed && !selectedParts.includes(trimmed)) {
      setSelectedParts((prev) => [...prev, trimmed]);
      setCustomPart('');
    }
  };

  const handleSubmit = async () => {
    if (!issueType) {
      toast.error('Please select an issue type.');
      return;
    }

    if (issueType === 'parts_missing' && selectedParts.length === 0) {
      toast.error('Please select at least one missing part.');
      return;
    }

    try {
      setSubmitting(true);

      if (issueType === 'damage') {
        await assemblyService.reportDamage(
          bike.barcode,
          damageNotes.trim(),
          photos.length > 0 ? photos : undefined
        );
        toast.success('Damage report submitted. Assembly paused.');
      } else {
        await assemblyService.flagPartsMissing(
          bike.barcode,
          selectedParts,
          partNotes.trim() || undefined
        );
        toast.success('Missing parts flagged. Assembly paused.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to submit report';
      toast.error(message);
      console.error('Report issue error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Report Issue</h2>
            <p className="text-sm text-gray-500">
              {bike.model_sku} - {bike.barcode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Issue Type Selection */}
          {!issueType && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">What type of issue?</p>
              <button
                onClick={() => setIssueType('damage')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Report Damage</p>
                  <p className="text-sm text-gray-500">
                    Frame damage, scratches, bent parts, manufacturing defects
                  </p>
                </div>
              </button>
              <button
                onClick={() => setIssueType('parts_missing')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Missing Parts</p>
                  <p className="text-sm text-gray-500">
                    Parts not included in the box or missing from inventory
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Damage Form */}
          {issueType === 'damage' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Reporting Damage</span>
                <button
                  onClick={() => setIssueType(null)}
                  className="ml-auto text-xs text-red-500 underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe the damage (optional)
                </label>
                <textarea
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  rows={4}
                  placeholder="Describe the damage in detail... (e.g., 'Dent on the down tube near the bottom bracket, approx 2cm long')"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    Photos (optional)
                  </span>
                </label>
                <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={5} />
              </div>
            </div>
          )}

          {/* Missing Parts Form */}
          {issueType === 'parts_missing' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                <Package className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Flagging Missing Parts</span>
                <button
                  onClick={() => setIssueType(null)}
                  className="ml-auto text-xs text-yellow-600 underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select missing parts <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_PARTS.map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => togglePart(part)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedParts.includes(part)
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom part input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add custom part
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPart}
                    onChange={(e) => setCustomPart(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomPart();
                      }
                    }}
                    placeholder="Type part name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomPart}
                    disabled={!customPart.trim()}
                    className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected parts summary */}
              {selectedParts.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-medium text-yellow-800 mb-1">
                    {selectedParts.length} part(s) selected:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedParts.map((part) => (
                      <span
                        key={part}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs"
                      >
                        {part}
                        <button
                          type="button"
                          onClick={() => togglePart(part)}
                          className="hover:text-yellow-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional notes (optional)
                </label>
                <textarea
                  value={partNotes}
                  onChange={(e) => setPartNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional information about the missing parts..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {issueType && (
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                issueType === 'damage'
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                  : 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400'
              }`}
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  {issueType === 'damage' ? 'Submit Damage Report' : 'Flag Missing Parts'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
