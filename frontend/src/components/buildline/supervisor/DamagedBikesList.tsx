import { useState, useEffect } from 'react';
import { AlertTriangle, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import { StatusBadge } from '../shared/StatusBadge';
import toast from 'react-hot-toast';
import { AssemblyJourney } from '../../../types/assembly';

interface DamagedBike extends AssemblyJourney {
  technician_name?: string;
  location_name?: string;
}

interface DamagedBikesListProps {
  onRefresh?: () => void;
}

export const DamagedBikesList = ({ onRefresh }: DamagedBikesListProps) => {
  const [bikes, setBikes] = useState<DamagedBike[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadDamagedBikes();
  }, []);

  const loadDamagedBikes = async () => {
    try {
      setLoading(true);
      const response = await assemblyService.getKanban({ damage_reported: true });
      if (response.data.success) {
        setBikes(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load damaged bikes:', error);
      toast.error('Failed to load damaged bikes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDamagedBikes();
    onRefresh?.();
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredBikes = bikes.filter((bike) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      bike.barcode.toLowerCase().includes(term) ||
      bike.model_sku.toLowerCase().includes(term) ||
      (bike.frame_number && bike.frame_number.toLowerCase().includes(term)) ||
      (bike.technician_name && bike.technician_name.toLowerCase().includes(term)) ||
      (bike.damage_notes && bike.damage_notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Damaged Bikes</h2>
              <p className="text-sm text-gray-600">
                {bikes.length} bike{bikes.length !== 1 ? 's' : ''} with reported damage
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by barcode, model, frame number, technician, or damage notes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading damaged bikes...</div>
        ) : filteredBikes.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">
              {searchTerm ? 'No damaged bikes match your search.' : 'No damaged bikes found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBikes.map((bike) => (
              <div key={bike.id} className="hover:bg-gray-50 transition-colors">
                {/* Summary Row */}
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleExpanded(bike.id)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <AlertTriangle className="text-red-600" size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{(bike as any).item_name || bike.model_sku}</h4>
                        <StatusBadge status={bike.current_status} />
                        {bike.priority && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {bike.barcode}
                        {bike.frame_number && ` | Frame: ${bike.frame_number}`}
                      </p>
                      {bike.damage_notes && (
                        <p className="text-sm text-red-700 mt-1 line-clamp-1">{bike.damage_notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {bike.technician_name && (
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {bike.technician_name}
                      </span>
                    )}
                    {expandedId === bike.id ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedId === bike.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <DetailRow label="Barcode" value={bike.barcode} />
                        <DetailRow label="Model / SKU" value={bike.model_sku} />
                        {bike.frame_number && (
                          <DetailRow label="Frame Number" value={bike.frame_number} />
                        )}
                        <DetailRow label="Status" value={bike.current_status} />
                        {bike.technician_name && (
                          <DetailRow label="Technician" value={bike.technician_name} />
                        )}
                        {bike.location_name && (
                          <DetailRow label="Location" value={bike.location_name} />
                        )}
                        {bike.current_bin_code && (
                          <DetailRow label="Bin" value={bike.current_bin_code} />
                        )}
                      </div>

                      <div className="space-y-2">
                        {bike.parts_missing && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Parts Missing</span>
                            <div className="mt-1">
                              {bike.parts_list && bike.parts_list.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-orange-700">
                                  {bike.parts_list.map((part, idx) => (
                                    <li key={idx}>{part}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-sm text-orange-600">Yes (no details)</span>
                              )}
                            </div>
                          </div>
                        )}

                        {bike.damage_notes && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Damage Notes</span>
                            <p className="text-sm text-red-700 mt-0.5 whitespace-pre-wrap">
                              {bike.damage_notes}
                            </p>
                          </div>
                        )}

                        {bike.damage_photos && bike.damage_photos.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Damage Photos ({bike.damage_photos.length})
                            </span>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {bike.damage_photos.map((photo, idx) => (
                                <a
                                  key={idx}
                                  href={photo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-red-400 transition-colors"
                                >
                                  <img
                                    src={photo}
                                    alt={`Damage photo ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {bike.rework_count > 0 && (
                          <DetailRow
                            label="Rework Count"
                            value={String(bike.rework_count)}
                            highlight
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-400">
                      {bike.inwarded_at && (
                        <span>Inwarded: {new Date(bike.inwarded_at).toLocaleDateString()}</span>
                      )}
                      {bike.assigned_at && (
                        <span>| Assigned: {new Date(bike.assigned_at).toLocaleDateString()}</span>
                      )}
                      {bike.assembly_started_at && (
                        <span>| Started: {new Date(bike.assembly_started_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const DetailRow = ({ label, value, highlight }: DetailRowProps) => (
  <div>
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <p className={`text-sm ${highlight ? 'text-red-700 font-bold' : 'text-gray-900'}`}>{value}</p>
  </div>
);
