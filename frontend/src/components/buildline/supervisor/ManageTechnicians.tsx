import { useState, useEffect } from 'react';
import { UserCog } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import toast from 'react-hot-toast';
import { Technician } from '../../../types/assembly';

interface ManageTechniciansProps {
  onSuccess?: () => void;
}

export const ManageTechnicians = ({ onSuccess }: ManageTechniciansProps) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    try {
      const response = await assemblyService.getTechnicians();
      if (response.data.success) {
        setTechnicians(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load technicians:', error);
      toast.error('Failed to load technicians');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <UserCog className="text-blue-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">Assembly Technicians</h2>
        </div>
        <p className="text-sm text-gray-600">
          Users with Buildline roles. Manage roles in Settings &gt; User Management.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Current Technicians</h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {technicians.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No technicians found. Assign buildline roles in Settings.</p>
          ) : (
            technicians.map(tech => (
              <div key={tech.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{tech.name}</h4>
                    <p className="text-sm text-gray-600">{tech.email}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {tech.buildline_role}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
