import { useState, useEffect, useRef } from 'react';
import { Settings, Users, Plus, Trash2, Edit2, Save, X, Shield, CheckSquare, Square, MapPin, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService, User } from '../services/auth.service';
import { locationsService, Location } from '../services/locations.service';
import { mobileUsersService, MobileUser } from '../services/mobileUsers.service';

interface Permission {
  module: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean; // Cannot delete system roles
}

const SettingsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Track if initial load is complete to prevent overwriting localStorage
  const isRolesInitialized = useRef(false);
  const isUsersInitialized = useRef(false);

  // Available modules for permission management
  const availableModules = [
    'Items', 'Purchase', 'Sales', 'Logistics', 'Expenses', 'Workchat', 'Reports', 'Customers', 'Vendors'
  ];

  const [roles, setRoles] = useState<Role[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    status: 'Active'
  });

  const [editUser, setEditUser] = useState<User | null>(null);

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: availableModules.map(module => ({
      module,
      create: false,
      read: false,
      update: false,
      delete: false
    }))
  });

  const [editRole, setEditRole] = useState<Role | null>(null);

  // Location state
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({ name: '', description: '' });
  const [locationLoading, setLocationLoading] = useState(false);

  // Mobile users state
  const [mobileUsers, setMobileUsers] = useState<MobileUser[]>([]);
  const [showAddMobileUserModal, setShowAddMobileUserModal] = useState(false);
  const [newMobileUser, setNewMobileUser] = useState({ phone_number: '', pin: '', employee_name: '', branch: 'Head Office' });
  const [mobileUserLoading, setMobileUserLoading] = useState(false);
  const [editingPinUserId, setEditingPinUserId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');

  // Load roles from localStorage on mount
  useEffect(() => {
    const storedRoles = localStorage.getItem('roles');
    if (storedRoles) {
      try {
        const parsedRoles = JSON.parse(storedRoles);
        setRoles(parsedRoles);
      } catch (error) {
        console.error('Error loading roles from localStorage:', error);
      }
    } else {
      // Initialize with default roles (must match database constraints)
      const defaultRoles = [
        {
          id: '1',
          name: 'Admin',
          description: 'Full access to all modules',
          isSystem: true,
          permissions: availableModules.map(module => ({
            module,
            create: true,
            read: true,
            update: true,
            delete: true
          }))
        },
        {
          id: '2',
          name: 'Manager',
          description: 'Can view and edit most modules',
          isSystem: true,
          permissions: availableModules.map(module => ({
            module,
            create: true,
            read: true,
            update: true,
            delete: module !== 'Sales' && module !== 'Purchase'
          }))
        },
        {
          id: '3',
          name: 'Staff',
          description: 'Standard employee access',
          isSystem: true,
          permissions: availableModules.map(module => ({
            module,
            create: module === 'Workchat' || module === 'Expenses',
            read: true,
            update: module === 'Workchat' || module === 'Expenses',
            delete: false
          }))
        },
        {
          id: '4',
          name: 'Viewer',
          description: 'Read-only access',
          isSystem: true,
          permissions: availableModules.map(module => ({
            module,
            create: false,
            read: true,
            update: false,
            delete: false
          }))
        }
      ];
      localStorage.setItem('roles', JSON.stringify(defaultRoles));
      setRoles(defaultRoles);
    }
    isRolesInitialized.current = true;
  }, []);

  // Sync roles to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (isRolesInitialized.current && roles.length > 0) {
      localStorage.setItem('roles', JSON.stringify(roles));
    }
  }, [roles]);

  // Load users from API on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await authService.getUsers();
        setUsers(fetchedUsers);
        isUsersInitialized.current = true;
      } catch (error) {
        console.error('Error loading users from API:', error);
        alert('Failed to load users. Please try again.');
      }
    };

    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const createdUser = await authService.register({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });

      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', password: '', role: 'Staff', status: 'Active' });
      setShowAddUserModal(false);
      alert('User created successfully!');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.error || error.message || 'Failed to create user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUser({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;

    try {
      const updatedUser = await authService.updateUser(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        phone: editUser.phone,
        department: editUser.department,
        status: editUser.status,
        buildline_role: editUser.buildline_role
      });

      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditingUserId(null);
      setEditUser(null);
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.error || error.message || 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await authService.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.error || error.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const updatedUser = await authService.updateUser(userId, { status: newStatus });
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      alert(`User status changed to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert(error.response?.data?.error || error.message || 'Failed to update user status');
    }
  };

  // Role Management Handlers
  const handleAddRole = () => {
    if (!newRole.name || !newRole.description) {
      alert('Please fill in all required fields');
      return;
    }

    const role: Role = {
      id: Date.now().toString(),
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      isSystem: false
    };

    setRoles([...roles, role]);
    setNewRole({
      name: '',
      description: '',
      permissions: availableModules.map(module => ({
        module,
        create: false,
        read: false,
        update: false,
        delete: false
      }))
    });
    setShowAddRoleModal(false);
  };

  const handleEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setEditRole({ ...role });
  };

  const handleSaveRoleEdit = () => {
    if (!editRole) return;

    setRoles(roles.map(r => r.id === editRole.id ? editRole : r));
    setEditingRoleId(null);
    setEditRole(null);
  };

  const handleCancelRoleEdit = () => {
    setEditingRoleId(null);
    setEditRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('Cannot delete system roles');
      return;
    }

    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  // Load locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationLoading(true);
        const response = await locationsService.getAllLocations();
        if (response.success && response.data) {
          setLocations(response.data);
        }
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLocationLoading(false);
      }
    };
    if (activeTab === 'locations') {
      loadLocations();
    }
    if (activeTab === 'mobile-users') {
      fetchMobileUsers();
    }
  }, [activeTab]);

  const fetchMobileUsers = async () => {
    try {
      const response = await mobileUsersService.getAllUsers();
      if (response.success) {
        setMobileUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching mobile users:', error);
    }
  };

  const handleAddMobileUser = async () => {
    if (!newMobileUser.phone_number || !newMobileUser.pin || !newMobileUser.employee_name) {
      alert('Please fill all required fields');
      return;
    }
    if (!/^\d{10}$/.test(newMobileUser.phone_number)) {
      alert('Phone number must be 10 digits');
      return;
    }
    if (!/^\d{4}$/.test(newMobileUser.pin)) {
      alert('PIN must be 4 digits');
      return;
    }
    try {
      setMobileUserLoading(true);
      const response = await mobileUsersService.createUser(newMobileUser);
      if (response.success) {
        setMobileUsers([...mobileUsers, response.data]);
        setShowAddMobileUserModal(false);
        setNewMobileUser({ phone_number: '', pin: '', employee_name: '', branch: 'Head Office' });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Failed to create mobile user');
    } finally {
      setMobileUserLoading(false);
    }
  };

  const handleUpdatePin = async (userId: string) => {
    if (!/^\d{4}$/.test(newPinValue)) {
      alert('PIN must be 4 digits');
      return;
    }
    try {
      const response = await mobileUsersService.updatePin(userId, newPinValue);
      if (response.success) {
        setMobileUsers(mobileUsers.map(u => u.id === userId ? { ...u, ...response.data } : u));
        setEditingPinUserId(null);
        setNewPinValue('');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update PIN');
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.name) {
      alert('Location name is required');
      return;
    }
    try {
      const response = await locationsService.createLocation(newLocation);
      if (response.success && response.data) {
        setLocations([response.data, ...locations]);
        setNewLocation({ name: '', description: '' });
        setShowAddLocationModal(false);
        alert('Location created successfully!');
      } else {
        alert(response.error || 'Failed to create location');
      }
    } catch (error: any) {
      console.error('Error creating location:', error);
      alert(error.response?.data?.error || 'Failed to create location');
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocationId(location.id);
    setEditLocation({ ...location });
  };

  const handleSaveLocationEdit = async () => {
    if (!editLocation || !editingLocationId) return;
    try {
      const response = await locationsService.updateLocation(editingLocationId, {
        name: editLocation.name,
        description: editLocation.description,
        status: editLocation.status
      });
      if (response.success && response.data) {
        setLocations(locations.map(l => l.id === editingLocationId ? response.data : l));
        setEditingLocationId(null);
        setEditLocation(null);
        alert('Location updated successfully!');
      } else {
        alert(response.error || 'Failed to update location');
      }
    } catch (error: any) {
      console.error('Error updating location:', error);
      alert(error.response?.data?.error || 'Failed to update location');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      const response = await locationsService.deleteLocation(locationId);
      if (response.success) {
        setLocations(locations.filter(l => l.id !== locationId));
        alert('Location deleted successfully!');
      } else {
        alert(response.error || 'Failed to delete location');
      }
    } catch (error: any) {
      console.error('Error deleting location:', error);
      alert(error.response?.data?.error || 'Failed to delete location');
    }
  };

  const togglePermission = (moduleIndex: number, permissionType: 'create' | 'read' | 'update' | 'delete') => {
    setNewRole({
      ...newRole,
      permissions: newRole.permissions.map((perm, idx) =>
        idx === moduleIndex
          ? { ...perm, [permissionType]: !perm[permissionType] }
          : perm
      )
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your application settings</p>
              </div>
            </div>
            {!isAdmin && (
              <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-xs font-medium text-yellow-800">View Only Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-6 border-t border-gray-200">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition ${activeTab === 'roles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Shield size={18} />
              Role Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition ${activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              User Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition ${activeTab === 'locations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              Locations
            </div>
          </button>
          <button
            onClick={() => setActiveTab('mobile-users')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition ${activeTab === 'mobile-users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone size={18} />
              Mobile Users
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'roles' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Role Management Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Roles</h2>
                <p className="text-sm text-gray-500">Manage roles and their permissions</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddRoleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={18} />
                  Add Role
                </button>
              )}
            </div>

            {/* Roles Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      {editingRoleId === role.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editRole?.name || ''}
                              onChange={(e) => setEditRole(editRole ? { ...editRole, name: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              disabled={role.isSystem}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editRole?.description || ''}
                              onChange={(e) => setEditRole(editRole ? { ...editRole, description: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                // Show permission editor inline or modal
                                alert('Click Edit to modify permissions in detail');
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {editRole?.permissions.filter(p => p.read).length} modules
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={handleSaveRoleEdit}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Save"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={handleCancelRoleEdit}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Shield size={20} className="text-blue-600" />
                              <div>
                                <span className="text-sm font-medium text-gray-900">{role.name}</span>
                                {role.isSystem && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                    System
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{role.description}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.filter(p => p.read).slice(0, 3).map(p => (
                                <span key={p.module} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                                  {p.module}
                                </span>
                              ))}
                              {role.permissions.filter(p => p.read).length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  +{role.permissions.filter(p => p.read).length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isAdmin ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditRole(role)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 size={18} />
                                </button>
                                {!role.isSystem && (
                                  <button
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">View Only</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Location Management Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Locations</h2>
                <p className="text-sm text-gray-500">Manage locations for inventory tracking. Create locations first, then add bins under them.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddLocationModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={18} />
                  Add Location
                </button>
              )}
            </div>

            {/* Locations Table */}
            <div className="overflow-x-auto">
              {locationLoading ? (
                <div className="p-8 text-center text-gray-500">Loading locations...</div>
              ) : locations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No locations found. Create your first location to start organizing inventory.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {locations.map((location) => (
                      <tr key={location.id} className="hover:bg-gray-50">
                        {editingLocationId === location.id ? (
                          <>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editLocation?.name || ''}
                                onChange={(e) => setEditLocation(editLocation ? { ...editLocation, name: e.target.value } : null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editLocation?.description || ''}
                                onChange={(e) => setEditLocation(editLocation ? { ...editLocation, description: e.target.value } : null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={editLocation?.status || 'active'}
                                onChange={(e) => setEditLocation(editLocation ? { ...editLocation, status: e.target.value as 'active' | 'inactive' } : null)}
                                className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={handleSaveLocationEdit} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Save">
                                  <Save size={18} />
                                </button>
                                <button onClick={() => { setEditingLocationId(null); setEditLocation(null); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Cancel">
                                  <X size={18} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">{location.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{location.description || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                location.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {location.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isAdmin ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleEditLocation(location)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                    <Edit2 size={18} />
                                  </button>
                                  <button onClick={() => handleDeleteLocation(location.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">View Only</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* User Management Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Users</h2>
                <p className="text-sm text-gray-500">Manage users and their access</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={18} />
                  Add User
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buildline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      {editingUserId === user.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editUser?.name || ''}
                              onChange={(e) => setEditUser(editUser ? { ...editUser, name: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="email"
                              value={editUser?.email || ''}
                              onChange={(e) => setEditUser(editUser ? { ...editUser, email: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editUser?.role || 'User'}
                              onChange={(e) => setEditUser(editUser ? { ...editUser, role: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              {roles.map(role => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editUser?.buildline_role || ''}
                              onChange={(e) => setEditUser(editUser ? { ...editUser, buildline_role: e.target.value || null } : null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="">None</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="technician">Technician</option>
                              <option value="qc_person">QC Person</option>
                              <option value="warehouse_staff">Warehouse Staff</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                              }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Save"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.role}</td>
                          <td className="px-6 py-4">
                            {user.buildline_role ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                                {user.buildline_role}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isAdmin ? (
                              <button
                                onClick={() => handleToggleStatus(user.id)}
                                className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition ${user.status === 'Active'
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                {user.status}
                              </button>
                            ) : (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}>
                                {user.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isAdmin ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">View Only</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mobile-users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Mobile Users Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Mobile Expense Users</h2>
                <p className="text-sm text-gray-500">Manage users who can submit expenses via mobile app (phone + PIN login)</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMobileUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={18} />
                  Add Mobile User
                </button>
              )}
            </div>

            {/* Mobile Users Table */}
            <div className="overflow-x-auto">
              {mobileUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Smartphone size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No mobile users found. Add a user to enable mobile expense submissions.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mobileUsers.map((mu) => (
                      <tr key={mu.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {mu.employee_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{mu.employee_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mu.phone_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mu.branch}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            mu.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {mu.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {editingPinUserId === mu.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newPinValue}
                                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="4-digit PIN"
                                maxLength={4}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleUpdatePin(mu.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Save PIN"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => { setEditingPinUserId(null); setNewPinValue(''); }}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingPinUserId(mu.id); setNewPinValue(''); }}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Change PIN
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-gray-400">
                            {new Date(mu.created_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add New User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
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
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter user name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password for login"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">User will use this password to login</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add Location</h3>
              <button onClick={() => setShowAddLocationModal(false)} className="p-1 hover:bg-gray-100 rounded">
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
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="e.g., Main Warehouse, Storage Unit B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  placeholder="Optional description of this location"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowAddLocationModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Cancel
              </button>
              <button onClick={handleAddLocation} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Add Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Mobile User Modal */}
      {showAddMobileUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add Mobile User</h3>
              <button
                onClick={() => setShowAddMobileUserModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMobileUser.employee_name}
                  onChange={(e) => setNewMobileUser({ ...newMobileUser, employee_name: e.target.value })}
                  placeholder="Enter employee name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newMobileUser.phone_number}
                  onChange={(e) => setNewMobileUser({ ...newMobileUser, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">User will login with this phone number</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMobileUser.pin}
                  onChange={(e) => setNewMobileUser({ ...newMobileUser, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="4-digit PIN"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">User will use this PIN to login on mobile app</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input
                  type="text"
                  value={newMobileUser.branch}
                  onChange={(e) => setNewMobileUser({ ...newMobileUser, branch: e.target.value })}
                  placeholder="e.g., Head Office"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddMobileUserModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMobileUser}
                disabled={mobileUserLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {mobileUserLoading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">Add New Role</h3>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="e.g., Sales Manager, Accountant"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Brief description of this role's responsibilities"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Module Permissions</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Select which operations this role can perform in each module
                </p>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Module
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Create
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Read
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Update
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {newRole.permissions.map((permission, index) => (
                        <tr key={permission.module} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {permission.module}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => togglePermission(index, 'create')}
                              className="inline-flex items-center justify-center w-5 h-5 focus:outline-none"
                            >
                              {permission.create ? (
                                <CheckSquare size={20} className="text-blue-600" />
                              ) : (
                                <Square size={20} className="text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => togglePermission(index, 'read')}
                              className="inline-flex items-center justify-center w-5 h-5 focus:outline-none"
                            >
                              {permission.read ? (
                                <CheckSquare size={20} className="text-blue-600" />
                              ) : (
                                <Square size={20} className="text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => togglePermission(index, 'update')}
                              className="inline-flex items-center justify-center w-5 h-5 focus:outline-none"
                            >
                              {permission.update ? (
                                <CheckSquare size={20} className="text-blue-600" />
                              ) : (
                                <Square size={20} className="text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => togglePermission(index, 'delete')}
                              className="inline-flex items-center justify-center w-5 h-5 focus:outline-none"
                            >
                              {permission.delete ? (
                                <CheckSquare size={20} className="text-blue-600" />
                              ) : (
                                <Square size={20} className="text-gray-400" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
