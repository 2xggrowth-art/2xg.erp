import { useState } from 'react';
import { UserPlus, Check, X, Search } from 'lucide-react';
import { KanbanItem, TechnicianWorkload } from '../../../types/assembly';

interface AssignmentPanelProps {
  bikes: KanbanItem[];
  technicians: TechnicianWorkload[];
  onAssign: (barcodes: string[], technicianId: string) => void;
}

export const AssignmentPanel = ({ bikes, technicians, onAssign }: AssignmentPanelProps) => {
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBikes = bikes.filter(
    (b) =>
      b.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.model_sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleBike = (barcode: string) => {
    setSelectedBarcodes((prev) =>
      prev.includes(barcode) ? prev.filter((b) => b !== barcode) : [...prev, barcode]
    );
  };

  const selectAll = () => {
    if (selectedBarcodes.length === filteredBikes.length) {
      setSelectedBarcodes([]);
    } else {
      setSelectedBarcodes(filteredBikes.map((b) => b.barcode));
    }
  };

  const handleAssign = () => {
    if (selectedBarcodes.length === 0 || !selectedTechnician) return;
    onAssign(selectedBarcodes, selectedTechnician);
    setSelectedBarcodes([]);
    setSelectedTechnician('');
  };

  return (
    <div className="space-y-4">
      {/* Technician Selection */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-blue-600" />
          Assign Cycles to Technician
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Technician</label>
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Choose a technician --</option>
            {technicians.map((tech) => (
              <option key={tech.technician_id} value={tech.technician_id}>
                {tech.technician_name} (Assigned: {tech.assigned_count}, In Progress: {tech.in_progress_count})
              </option>
            ))}
          </select>
        </div>

        {/* Technician workload cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {technicians.map((tech) => (
            <button
              key={tech.technician_id}
              onClick={() => setSelectedTechnician(tech.technician_id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedTechnician === tech.technician_id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900 truncate">{tech.technician_name}</div>
              <div className="mt-1 text-xs text-gray-500">
                <span className="inline-block mr-2">Queued: {tech.assigned_count}</span>
                <span className="inline-block">WIP: {tech.in_progress_count}</span>
              </div>
              <div className="text-xs text-green-600 mt-0.5">
                Done today: {tech.completed_today}
              </div>
            </button>
          ))}
          {technicians.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-4 text-sm">
              No technicians available. Add technicians in the Manage tab.
            </div>
          )}
        </div>
      </div>

      {/* Bike Selection */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Select Cycles to Assign
            {selectedBarcodes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({selectedBarcodes.length} selected)
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search barcode or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
            >
              {selectedBarcodes.length === filteredBikes.length && filteredBikes.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {filteredBikes.map((bike) => {
            const isSelected = selectedBarcodes.includes(bike.barcode);
            return (
              <div
                key={bike.id}
                onClick={() => toggleBike(bike.barcode)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-300'
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-blue-600' : 'border-2 border-gray-300'
                  }`}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{bike.item_name || bike.model_sku}</span>
                    {bike.priority && (
                      <span className="text-xs text-red-600 font-medium">PRIORITY</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 truncate block">{bike.barcode}</span>
                </div>
                {bike.parts_missing && (
                  <span className="text-xs text-orange-600 font-medium flex-shrink-0">Parts Missing</span>
                )}
              </div>
            );
          })}
          {filteredBikes.length === 0 && (
            <div className="text-center text-gray-400 py-12 text-sm">
              {bikes.length === 0
                ? 'No inwarded cycles available for assignment'
                : 'No cycles match your search'}
            </div>
          )}
        </div>
      </div>

      {/* Assign Button */}
      <div className="sticky bottom-0 bg-white rounded-lg shadow p-4 border-t">
        <button
          onClick={handleAssign}
          disabled={selectedBarcodes.length === 0 || !selectedTechnician}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
            selectedBarcodes.length > 0 && selectedTechnician
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedBarcodes.length === 0
            ? 'Select cycles to assign'
            : !selectedTechnician
            ? 'Select a technician'
            : `Assign ${selectedBarcodes.length} cycle${selectedBarcodes.length !== 1 ? 's' : ''} to technician`}
        </button>
      </div>
    </div>
  );
};
