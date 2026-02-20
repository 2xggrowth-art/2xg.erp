import { useState, useEffect } from 'react';
import { assemblyService } from '../../../services/assembly.service';
import { BikeScanner } from './BikeScanner';
import { AssemblyChecklist } from './AssemblyChecklist';
import { QueueList } from './QueueList';
import { ReportIssueModal } from './ReportIssueModal';
import { ScanConfirm } from './ScanConfirm';
import toast from 'react-hot-toast';

export interface QueueBike {
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
  assigned_at?: string;
  bin_location?: any;
  item_name?: string | null;
  item_color?: string | null;
  item_size?: string | null;
  item_variant?: string | null;
}

export const TechnicianDashboard = () => {
  const [queue, setQueue] = useState<QueueBike[]>([]);
  const [selectedBike, setSelectedBike] = useState<QueueBike | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'queue' | 'scan' | 'confirm_scan' | 'checklist'>('queue');
  const [showReportIssue, setShowReportIssue] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await assemblyService.getTechnicianQueue();
      setQueue(response.data.data);
    } catch (error) {
      toast.error('Failed to load queue');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBike = async (bike: QueueBike) => {
    if (bike.current_status === 'assigned') {
      // Require barcode scan confirmation before starting
      setSelectedBike(bike);
      setView('confirm_scan');
    } else if (bike.current_status === 'in_progress') {
      setSelectedBike(bike);
      setView('checklist');
    } else {
      toast.error(`Bike is in ${bike.current_status} status. Cannot start assembly.`);
    }
  };

  const handleScanConfirmed = async (bike: QueueBike) => {
    try {
      const startResponse = await assemblyService.startAssembly(bike.barcode);
      if (!startResponse.data.success) {
        toast.error(startResponse.data.message || 'Failed to start assembly');
        return;
      }
      toast.success('Assembly started!');
      setSelectedBike({ ...bike, current_status: 'in_progress' });
      setView('checklist');
      loadQueue();
    } catch (error) {
      toast.error('Failed to start assembly');
      console.error(error);
    }
  };

  const handleScan = async (barcode: string) => {
    try {
      const response = await assemblyService.scanBike(barcode);
      const bike = response.data.data;
      const ownership = bike.ownership;

      if (bike.current_status === 'inwarded') {
        toast('This bike is inwarded but not yet assigned to any technician.', { icon: '\u2139\uFE0F' });
        return;
      }

      if (bike.current_status === 'assigned') {
        if (!ownership?.is_assigned_to_me) {
          toast.error(`This bike is assigned to ${ownership?.assigned_technician_name || 'another technician'}, not you.`);
          return;
        }
        const startResponse = await assemblyService.startAssembly(barcode);
        if (!startResponse.data.success) {
          toast.error(startResponse.data.message || 'Failed to start assembly');
          return;
        }
        toast.success('Assembly started!');
        setSelectedBike({ ...bike, current_status: 'in_progress' });
        setView('checklist');
        loadQueue();
      } else if (bike.current_status === 'in_progress') {
        if (!ownership?.is_assigned_to_me) {
          toast.error(`This bike is being assembled by ${ownership?.assigned_technician_name || 'another technician'}.`);
          return;
        }
        setSelectedBike(bike);
        setView('checklist');
      } else if (bike.current_status === 'ready_for_sale') {
        toast.success('This bike is already completed and ready for sale.');
      } else {
        toast.error(`Bike is in "${bike.current_status}" status. Cannot start assembly.`);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Bike not found';
      toast.error(message);
      console.error(error);
    }
  };

  const handleChecklistComplete = async (barcode: string, checklist: Record<string, string>) => {
    try {
      await assemblyService.completeAssembly(barcode, checklist);
      toast.success('Assembly completed! Bike is now ready for sale.');
      setSelectedBike(null);
      setView('queue');
      loadQueue();
    } catch (error) {
      toast.error('Failed to complete assembly');
      console.error(error);
    }
  };

  const handleChecklistUpdate = async (barcode: string, checklist: Record<string, string>) => {
    try {
      await assemblyService.updateChecklist(barcode, checklist);
      toast.success('Progress saved');
    } catch (error) {
      console.error('Failed to update checklist:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Technician Workspace</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{queue.length} bikes in your queue</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => { setView('queue'); setSelectedBike(null); }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${
                view === 'queue' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Queue
            </button>
            <button
              onClick={() => setView('scan')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap flex-shrink-0 ${
                view === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scan Bike
            </button>
          </div>
        </div>
      </div>

      <div>
        {view === 'queue' && (
          <QueueList queue={queue} onSelectBike={handleSelectBike} onRefresh={loadQueue} />
        )}
        {view === 'scan' && <BikeScanner onScan={handleScan} />}
        {view === 'confirm_scan' && selectedBike && (
          <ScanConfirm
            bike={selectedBike}
            onConfirmed={handleScanConfirmed}
            onBack={() => { setSelectedBike(null); setView('queue'); }}
          />
        )}
        {view === 'checklist' && selectedBike && (
          <AssemblyChecklist
            bike={selectedBike}
            onComplete={handleChecklistComplete}
            onUpdate={handleChecklistUpdate}
            onReportIssue={() => setShowReportIssue(true)}
            onBack={() => { setSelectedBike(null); setView('queue'); }}
          />
        )}
        {showReportIssue && selectedBike && (
          <ReportIssueModal
            bike={selectedBike}
            onClose={() => setShowReportIssue(false)}
            onSuccess={() => { loadQueue(); setSelectedBike(null); setView('queue'); }}
          />
        )}
      </div>
    </div>
  );
};
