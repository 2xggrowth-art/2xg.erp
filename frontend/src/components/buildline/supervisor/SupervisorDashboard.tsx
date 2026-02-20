import { useState, useEffect } from 'react';
import { assemblyService } from '../../../services/assembly.service';
import { KanbanBoard } from './KanbanBoard';
import { AssignmentPanel } from './AssignmentPanel';
import { InwardBikeForm } from './InwardBikeForm';
import { BulkInwardModal } from './BulkInwardModal';
import { ManageTechnicians } from './ManageTechnicians';
import { ManageLocations } from './ManageLocations';
import toast from 'react-hot-toast';
import { KanbanItem, TechnicianWorkload } from '../../../types/assembly';

export const SupervisorDashboard = () => {
  const [kanban, setKanban] = useState<KanbanItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'assign' | 'inward' | 'manage'>('kanban');
  const [showBulkInwardModal, setShowBulkInwardModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kanbanRes, dashRes] = await Promise.all([
        assemblyService.getKanban({}),
        assemblyService.getDashboard()
      ]);
      setKanban(kanbanRes.data.data);
      setTechnicians(dashRes.data.data.technicians || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (barcodes: string[], technicianId: string) => {
    try {
      await assemblyService.bulkAssign(barcodes, technicianId);
      toast.success(`Assigned ${barcodes.length} bike(s)`);
      loadData();
    } catch (error) {
      toast.error('Failed to assign bikes');
      console.error(error);
    }
  };

  const handleSetPriority = async (barcode: string, priority: boolean) => {
    try {
      await assemblyService.setPriority(barcode, priority);
      toast.success(priority ? 'Marked as priority' : 'Priority removed');
      loadData();
    } catch (error) {
      toast.error('Failed to update priority');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  const inwardedBikes = kanban.filter((b) => b.current_status === 'inwarded');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {inwardedBikes.length} cycles pending assignment
              </p>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            {(['kanban', 'assign', 'inward', 'manage'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${
                  view === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {v === 'kanban' ? 'Kanban' : v === 'assign' ? 'Assign' : v === 'inward' ? 'Inward' : 'Manage'}
              </button>
            ))}
            <button
              onClick={loadData}
              className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap flex-shrink-0"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {view === 'kanban' && (
          <KanbanBoard bikes={kanban} onSetPriority={handleSetPriority} onRefresh={loadData} />
        )}

        {view === 'assign' && (
          <AssignmentPanel bikes={inwardedBikes} technicians={technicians} onAssign={handleAssign} />
        )}

        {view === 'inward' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Inward Cycles</h2>
                  <p className="text-sm text-gray-600 mt-1">Add cycles to the system - single or bulk import</p>
                </div>
                <button
                  onClick={() => setShowBulkInwardModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Bulk Inward
                </button>
              </div>
            </div>
            <InwardBikeForm onSuccess={loadData} />
          </div>
        )}

        {view === 'manage' && (
          <div className="space-y-8">
            <ManageLocations onSuccess={loadData} />
            <ManageTechnicians onSuccess={loadData} />
          </div>
        )}
      </div>

      {showBulkInwardModal && (
        <BulkInwardModal
          onClose={() => setShowBulkInwardModal(false)}
          onSuccess={() => {
            loadData();
            setShowBulkInwardModal(false);
          }}
        />
      )}
    </div>
  );
};
