import { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus, Trash2, Download, CheckCircle } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import toast from 'react-hot-toast';
import { AssemblyLocation } from '../../../types/assembly';

interface BulkInwardModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkBikeRow {
  barcode: string;
  model_sku: string;
  frame_number: string;
}

interface InwardResult {
  barcode: string;
  success: boolean;
  error?: string;
}

export const BulkInwardModal = ({ onClose, onSuccess }: BulkInwardModalProps) => {
  const [rows, setRows] = useState<BulkBikeRow[]>([
    { barcode: '', model_sku: '', frame_number: '' },
    { barcode: '', model_sku: '', frame_number: '' },
    { barcode: '', model_sku: '', frame_number: '' },
  ]);
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState<AssemblyLocation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<InwardResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await assemblyService.getLocations();
      setLocations(res.data.data || []);
    } catch (error) {
      console.error('Failed to load locations', error);
    }
  };

  const updateRow = (index: number, field: keyof BulkBikeRow, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, { barcode: '', model_sku: '', frame_number: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());

      // Skip header if it looks like one
      const startIndex = lines[0]?.toLowerCase().includes('barcode') ? 1 : 0;

      const parsedRows: BulkBikeRow[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols[0] && cols[1]) {
          parsedRows.push({
            barcode: cols[0],
            model_sku: cols[1],
            frame_number: cols[2] || '',
          });
        }
      }

      if (parsedRows.length === 0) {
        toast.error('No valid rows found in CSV. Expected: barcode, model_sku, frame_number');
        return;
      }

      setRows(parsedRows);
      toast.success(`Loaded ${parsedRows.length} rows from CSV`);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csv = 'barcode,model_sku,frame_number\nBIKE-001,MTB-26-BLK,FR001\nBIKE-002,MTB-26-RED,FR002\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_inward_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.barcode.trim() && r.model_sku.trim());

    if (validRows.length === 0) {
      toast.error('No valid rows to submit. Barcode and Model/SKU are required.');
      return;
    }

    if (!locationId) {
      toast.error('Please select a location');
      return;
    }

    try {
      setSubmitting(true);
      const bikes = validRows.map((r) => ({
        barcode: r.barcode.trim(),
        model_sku: r.model_sku.trim(),
        frame_number: r.frame_number.trim() || undefined,
        location_id: locationId,
      }));

      const res = await assemblyService.bulkInward(bikes);
      const data = res.data.data;

      const resultsList: InwardResult[] = [
        ...(data.successful || []).map((s: any) => ({ barcode: s.barcode, success: true })),
        ...(data.failed || []).map((f: any) => ({ barcode: f.barcode, success: false, error: f.error })),
      ];

      setResults(resultsList);

      const successCount = resultsList.filter((r) => r.success).length;
      const failCount = resultsList.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success(`All ${successCount} cycles inwarded successfully`);
      } else {
        toast.error(`${successCount} succeeded, ${failCount} failed`);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Bulk inward failed';
      toast.error(message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = rows.filter((r) => r.barcode.trim() && r.model_sku.trim()).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Inward Cycles</h2>
            <p className="text-sm text-gray-500 mt-1">Add multiple cycles at once via CSV or manual entry</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Results view */}
          {results ? (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Results</h3>
              <div className="space-y-1.5">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      r.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {r.success ? (
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <X size={16} className="text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">{r.barcode}</span>
                    {r.error && <span className="text-xs ml-auto">{r.error}</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setResults(null);
                    setRows([{ barcode: '', model_sku: '', frame_number: '' }]);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Inward More
                </button>
                <button
                  onClick={onSuccess}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Location selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select location for all cycles --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.code ? `(${loc.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* CSV Upload / Template */}
              <div className="flex flex-wrap gap-2">
                <label className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center gap-1.5">
                  <Upload size={14} />
                  Upload CSV
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Download Template
                </button>
              </div>

              {/* Manual rows */}
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 text-xs font-medium text-gray-500 px-1">
                  <span>Barcode *</span>
                  <span>Model/SKU *</span>
                  <span>Frame Number</span>
                  <span></span>
                </div>

                {rows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2">
                    <input
                      type="text"
                      value={row.barcode}
                      onChange={(e) => updateRow(index, 'barcode', e.target.value)}
                      placeholder="Barcode"
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={row.model_sku}
                      onChange={(e) => updateRow(index, 'model_sku', e.target.value)}
                      placeholder="Model/SKU"
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={row.frame_number}
                      onChange={(e) => updateRow(index, 'frame_number', e.target.value)}
                      placeholder="Frame #"
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeRow(index)}
                      disabled={rows.length <= 1}
                      className={`p-1.5 rounded-lg transition-colors ${
                        rows.length <= 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!results && (
          <div className="border-t p-4 sm:p-6 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {validCount} valid row{validCount !== 1 ? 's' : ''} of {rows.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || validCount === 0 || !locationId}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                  submitting || validCount === 0 || !locationId
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
              >
                {submitting ? 'Inwarding...' : `Inward ${validCount} Cycle${validCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
