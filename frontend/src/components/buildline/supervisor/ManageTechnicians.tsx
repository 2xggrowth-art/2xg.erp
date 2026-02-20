import { useState, useEffect } from 'react';
import { UserCog, Plus, X, Phone } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import { authService } from '../../../services/auth.service';
import toast from 'react-hot-toast';
import { Technician } from '../../../types/assembly';

interface ManageTechniciansProps {
  onSuccess?: () => void;
}

export const ManageTechnicians = ({ onSuccess }: ManageTechniciansProps) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTech, setNewTech] = useState({
    name: '',
    phone: '',
    pin: '',
    buildline_role: 'technician'
  });

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

  const handleAddTechnician = async () => {
    if (!newTech.name || !newTech.phone || !newTech.pin) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^\d{4}$/.test(newTech.pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (!/^\d{10}$/.test(newTech.phone.replace(/[\s\-]/g, '').replace(/^\+91/, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setAdding(true);
      // 1. Create the user with phone + PIN
      const createdUser = await authService.register({
        name: newTech.name,
        phone: newTech.phone,
        pin: newTech.pin,
        role: 'Staff'
      });

      // 2. Set their buildline role
      await authService.updateUser(createdUser.id, {
        buildline_role: newTech.buildline_role
      } as any);

      toast.success(`${newTech.name} added as ${newTech.buildline_role}`);
      setShowAddModal(false);
      setNewTech({ name: '', phone: '', pin: '', buildline_role: 'technician' });
      loadTechnicians();
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to add technician:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to add technician');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCog className="text-blue-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Assembly Technicians</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Add Technician
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Current Technicians</h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {technicians.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No technicians found. Click "Add Technician" to create one.</p>
          ) : (
            technicians.map(tech => (
              <div key={tech.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{tech.name}</h4>
                    <p className="text-sm text-gray-600">{tech.phone || tech.email}</p>
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

      {/* Add Technician Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add Technician</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTech.name}
                  onChange={(e) => setNewTech({ ...newTech, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newTech.phone}
                  onChange={(e) => setNewTech({ ...newTech, phone: e.target.value.replace(/[^\d]/g, '').slice(0, 10) })}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4-Digit PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newTech.pin}
                  onChange={(e) => setNewTech({ ...newTech, pin: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buildline Role</label>
                <select
                  value={newTech.buildline_role}
                  onChange={(e) => setNewTech({ ...newTech, buildline_role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="technician">Technician</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTechnician}
                disabled={adding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Technician'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
