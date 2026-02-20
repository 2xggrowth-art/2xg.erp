import { useState, useEffect } from 'react';
import { PackageOpen, Barcode, Bike } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import toast from 'react-hot-toast';
import { AssemblyLocation, AssemblyBin } from '../../../types/assembly';

interface InwardBikeFormProps {
  onSuccess: () => void;
}

export const InwardBikeForm = ({ onSuccess }: InwardBikeFormProps) => {
  const [barcode, setBarcode] = useState('');
  const [modelSku, setModelSku] = useState('');
  const [frameNumber, setFrameNumber] = useState('');
  const [grnReference, setGrnReference] = useState('');
  const [locationId, setLocationId] = useState('');
  const [binLocationId, setBinLocationId] = useState('');
  const [locations, setLocations] = useState<AssemblyLocation[]>([]);
  const [bins, setBins] = useState<AssemblyBin[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [recentInwards, setRecentInwards] = useState<Array<{ barcode: string; model_sku: string; time: string }>>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (locationId) {
      loadBins(locationId);
    } else {
      setBins([]);
      setBinLocationId('');
    }
  }, [locationId]);

  const loadLocations = async () => {
    try {
      const res = await assemblyService.getLocations();
      setLocations(res.data.data || []);
    } catch (error) {
      console.error('Failed to load locations', error);
    }
  };

  const loadBins = async (locId: string) => {
    try {
      const res = await assemblyService.getAvailableBins(locId);
      setBins(res.data.data || []);
    } catch (error) {
      console.error('Failed to load bins', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode.trim() || !modelSku.trim()) {
      toast.error('Barcode and Model/SKU are required');
      return;
    }

    if (!locationId) {
      toast.error('Please select a location');
      return;
    }

    try {
      setSubmitting(true);
      await assemblyService.inwardBike({
        barcode: barcode.trim(),
        model_sku: modelSku.trim(),
        frame_number: frameNumber.trim() || undefined,
        grn_reference: grnReference.trim() || undefined,
        location_id: locationId,
        bin_location_id: binLocationId || undefined,
      });

      toast.success(`Cycle ${barcode.trim()} inwarded successfully`);

      setRecentInwards((prev) => [
        { barcode: barcode.trim(), model_sku: modelSku.trim(), time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);

      // Reset form but keep location selected
      setBarcode('');
      setModelSku('');
      setFrameNumber('');
      setGrnReference('');
      setBinLocationId('');
      onSuccess();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to inward cycle';
      toast.error(message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Inward Form */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PackageOpen size={20} className="text-blue-600" />
          Single Cycle Inward
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Barcode size={14} className="inline mr-1" />
                Barcode *
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                required
              />
            </div>

            {/* Model / SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Bike size={14} className="inline mr-1" />
                Model / SKU *
              </label>
              <input
                type="text"
                value={modelSku}
                onChange={(e) => setModelSku(e.target.value)}
                placeholder="e.g. MTB-26-BLK"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Frame Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frame Number
              </label>
              <input
                type="text"
                value={frameNumber}
                onChange={(e) => setFrameNumber(e.target.value)}
                placeholder="Optional frame number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* GRN Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GRN Reference
              </label>
              <input
                type="text"
                value={grnReference}
                onChange={(e) => setGrnReference(e.target.value)}
                placeholder="Optional GRN reference"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select location --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Bin Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bin Location
              </label>
              <select
                value={binLocationId}
                onChange={(e) => setBinLocationId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!locationId}
              >
                <option value="">-- Optional bin --</option>
                {bins.map((bin) => (
                  <option key={bin.id} value={bin.id}>
                    {bin.bin_code} - {bin.bin_name} ({bin.current_occupancy}/{bin.capacity})
                  </option>
                ))}
              </select>
              {!locationId && (
                <p className="text-xs text-gray-400 mt-1">Select a location first</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {submitting ? 'Inwarding...' : 'Inward Cycle'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Inwards */}
      {recentInwards.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Recently Inwarded (this session)</h3>
          <div className="space-y-1.5">
            {recentInwards.map((item, index) => (
              <div
                key={`${item.barcode}-${index}`}
                className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-gray-900 truncate block">{item.model_sku}</span>
                  <span className="text-xs text-gray-500 truncate block">{item.barcode}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
