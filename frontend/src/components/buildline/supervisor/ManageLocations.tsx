import { useState, useEffect } from 'react';
import { MapPin, Pencil, Trash2, X, Check, Plus } from 'lucide-react';
import { assemblyService } from '../../../services/assembly.service';
import toast from 'react-hot-toast';
import { AssemblyLocation } from '../../../types/assembly';

interface ManageLocationsProps {
  onSuccess?: () => void;
}

interface LocationFormData {
  name: string;
  code: string;
  type: string;
  address: string;
}

const emptyForm: LocationFormData = {
  name: '',
  code: '',
  type: 'warehouse',
  address: '',
};

const locationTypes = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
];

export const ManageLocations = ({ onSuccess }: ManageLocationsProps) => {
  const [locations, setLocations] = useState<AssemblyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await assemblyService.getLocations();
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        await assemblyService.updateLocation(editingId, {
          name: form.name.trim(),
          code: form.code.trim(),
          type: form.type,
          address: form.address.trim() || undefined,
        });
        toast.success('Location updated');
      } else {
        await assemblyService.createLocation({
          name: form.name.trim(),
          code: form.code.trim(),
          type: form.type,
          address: form.address.trim() || undefined,
        });
        toast.success('Location created');
      }

      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      loadLocations();
      onSuccess?.();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to save location';
      toast.error(message);
      console.error('Failed to save location:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (location: AssemblyLocation) => {
    setEditingId(location.id);
    setForm({
      name: location.name,
      code: location.code || '',
      type: location.type || 'warehouse',
      address: location.address || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location? This cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await assemblyService.deleteLocation(id);
      toast.success('Location deleted');
      loadLocations();
      onSuccess?.();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to delete location';
      toast.error(message);
      console.error('Failed to delete location:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="text-green-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assembly Locations</h2>
              <p className="text-sm text-gray-600">
                Manage warehouse and assembly locations for the Buildline.
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Location
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {editingId ? 'Edit Location' : 'New Location'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Main Warehouse"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WH-01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {locationTypes.map((lt) => (
                    <option key={lt.value} value={lt.value}>
                      {lt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Optional address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Check size={18} />
                {submitting
                  ? 'Saving...'
                  : editingId
                  ? 'Update Location'
                  : 'Create Location'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Current Locations ({locations.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading locations...</div>
        ) : locations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No locations found. Add your first assembly location above.
          </p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {locations.map((location) => (
              <div
                key={location.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-bold text-gray-900">{location.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {location.code && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {location.code}
                          </span>
                        )}
                        {location.type && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 capitalize">
                            {location.type}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            location.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {location.status}
                        </span>
                      </div>
                      {location.address && (
                        <p className="text-sm text-gray-500 mt-1">{location.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit location"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      disabled={deletingId === location.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete location"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
