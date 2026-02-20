import { useState, useEffect } from 'react';
import { Package, MapPin, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import {
  getZoneLabel,
  getZoneColor,
  BIN_ZONE_LABELS,
} from '../../../constants/assemblyConstants';
import toast from 'react-hot-toast';
import {
  AssemblyBin,
  AssemblyLocation,
  BinZone,
  BinZoneStats,
} from '../../../types/assembly';

interface BinZoneViewProps {
  locationId?: string;
  onBinSelect?: (bin: AssemblyBin) => void;
}

export const BinZoneView = ({ locationId, onBinSelect }: BinZoneViewProps) => {
  const [locations, setLocations] = useState<AssemblyLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locationId || '');
  const [zoneStats, setZoneStats] = useState<BinZoneStats[]>([]);
  const [zoneBins, setZoneBins] = useState<Record<string, AssemblyBin[]>>({});
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBins, setLoadingBins] = useState(false);

  // Load locations on mount
  useEffect(() => {
    loadLocations();
  }, []);

  // Load zone stats when location changes
  useEffect(() => {
    if (selectedLocationId) {
      loadZoneStats(selectedLocationId);
    }
  }, [selectedLocationId]);

  const loadLocations = async () => {
    try {
      const response = await assemblyService.getLocations();
      if (response.data.success) {
        const locs = response.data.data as AssemblyLocation[];
        setLocations(locs);
        // Auto-select first location if none specified
        if (!locationId && locs.length > 0) {
          setSelectedLocationId(locs[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const loadZoneStats = async (locId: string) => {
    try {
      setLoading(true);
      const response = await assemblyService.getBinZoneStatistics(locId);
      if (response.data.success) {
        setZoneStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load zone stats:', error);
      toast.error('Failed to load zone statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadBinsForZone = async (zone: string) => {
    if (zoneBins[zone]) {
      // Already loaded, just toggle
      setExpandedZone(expandedZone === zone ? null : zone);
      return;
    }

    try {
      setLoadingBins(true);
      const response = await assemblyService.getBinsByZone(selectedLocationId, zone);
      if (response.data.success) {
        setZoneBins((prev) => ({ ...prev, [zone]: response.data.data }));
      }
      setExpandedZone(zone);
    } catch (error) {
      console.error('Failed to load bins for zone:', error);
      toast.error('Failed to load bins');
    } finally {
      setLoadingBins(false);
    }
  };

  const handleRefresh = () => {
    setZoneBins({});
    setExpandedZone(null);
    if (selectedLocationId) {
      loadZoneStats(selectedLocationId);
    }
  };

  const getUtilizationColor = (pct: number): string => {
    if (pct >= 90) return 'text-red-600';
    if (pct >= 70) return 'text-orange-600';
    if (pct >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const zones = Object.keys(BIN_ZONE_LABELS) as BinZone[];

  return (
    <div className="space-y-6">
      {/* Header with location selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Package className="text-indigo-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bin Zone Overview</h2>
              <p className="text-sm text-gray-600">
                View bin zones and their occupancy across locations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedLocationId}
              onChange={(e) => {
                setSelectedLocationId(e.target.value);
                setZoneBins({});
                setExpandedZone(null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.code ? `(${loc.code})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              disabled={loading || !selectedLocationId}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {!selectedLocationId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">Select a location to view bin zones.</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <RefreshCw className="mx-auto text-gray-400 animate-spin mb-3" size={32} />
          <p className="text-gray-500">Loading zone statistics...</p>
        </div>
      ) : (
        <>
          {/* Zone Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {zones.map((zone) => {
              const stats = zoneStats.find((s) => s.zone === zone);
              const color = getZoneColor(zone);
              const utilization = stats?.utilization_pct ?? 0;
              const totalCapacity = stats?.total_capacity ?? 0;
              const totalOccupancy = stats?.total_occupancy ?? 0;
              const totalBins = stats?.total_bins ?? 0;

              return (
                <div
                  key={zone}
                  className="bg-white rounded-lg shadow p-5 border-t-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderTopColor: color }}
                  onClick={() => loadBinsForZone(zone)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm">{getZoneLabel(zone)}</h3>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {totalBins} bin{totalBins !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Occupancy</span>
                      <span className={`font-bold ${getUtilizationColor(utilization)}`}>
                        {utilization.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(utilization, 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {totalOccupancy} / {totalCapacity} slots used
                  </div>

                  <div className="mt-2 flex items-center justify-center text-xs text-gray-400">
                    {expandedZone === zone ? (
                      <>
                        <ChevronUp size={14} className="mr-1" />
                        Click to collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} className="mr-1" />
                        Click to view bins
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Bin List */}
          {expandedZone && (
            <div className="bg-white rounded-lg shadow">
              <div
                className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
                style={{ borderLeftWidth: 4, borderLeftColor: getZoneColor(expandedZone) }}
              >
                <h3 className="font-bold text-gray-900">
                  {getZoneLabel(expandedZone)} - Bins
                </h3>
                <button
                  onClick={() => setExpandedZone(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Collapse
                </button>
              </div>

              {loadingBins ? (
                <div className="p-8 text-center text-gray-500">Loading bins...</div>
              ) : !zoneBins[expandedZone] || zoneBins[expandedZone].length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No bins in this zone. Create bins to get started.
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {zoneBins[expandedZone].map((bin) => {
                      const occupancyPct =
                        bin.capacity > 0
                          ? Math.round((bin.current_occupancy / bin.capacity) * 100)
                          : 0;

                      return (
                        <div
                          key={bin.id}
                          className={`p-4 border rounded-lg transition-all ${
                            onBinSelect
                              ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md'
                              : ''
                          } ${
                            bin.is_active
                              ? 'border-gray-200 bg-white'
                              : 'border-gray-100 bg-gray-50 opacity-60'
                          }`}
                          onClick={() => onBinSelect?.(bin)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-900 text-sm">
                              {bin.bin_code}
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                bin.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {bin.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {bin.bin_name && (
                            <p className="text-xs text-gray-600 mb-2">{bin.bin_name}</p>
                          )}

                          {/* Occupancy Bar */}
                          <div className="mb-1">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-400">Occupancy</span>
                              <span
                                className={`font-bold ${getUtilizationColor(occupancyPct)}`}
                              >
                                {bin.current_occupancy}/{bin.capacity}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(occupancyPct, 100)}%`,
                                  backgroundColor: getZoneColor(expandedZone),
                                }}
                              />
                            </div>
                          </div>

                          {bin.location_name && (
                            <p className="text-[10px] text-gray-400 mt-1">{bin.location_name}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
