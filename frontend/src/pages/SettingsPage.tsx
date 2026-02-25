import { useState, useEffect, useRef } from 'react';
import { Settings, Users, Plus, Trash2, Edit2, Save, X, Shield, CheckSquare, Square, MapPin, Smartphone, Monitor, FileText, BarChart3, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService, User } from '../services/auth.service';
import { locationsService, Location } from '../services/locations.service';
import { mobileUsersService, MobileUser } from '../services/mobileUsers.service';
import { posCodesService, PosCode } from '../services/posCodes.service';
import { gstSettingsService } from '../services/gstSettings.service';
import { gstReportsService } from '../services/gstReports.service';

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

  // POS Codes state
  const [posCodes, setPosCodes] = useState<PosCode[]>([]);
  const [showAddPosCodeForm, setShowAddPosCodeForm] = useState(false);
  const [newPosCode, setNewPosCode] = useState({ code: '', employee_name: '' });
  const [editingPosCodeId, setEditingPosCodeId] = useState<string | null>(null);
  const [editPosCode, setEditPosCode] = useState({ code: '', employee_name: '' });

  // GST Settings state
  const [gstSettings, setGstSettings] = useState({
    company_gstin: '',
    registered_state: 'Karnataka',
    state_code: '29',
    gst_registration_type: 'regular',
    financial_year_start: 4,
    e_invoice_enabled: false,
    e_invoice_username: '',
    e_invoice_password: '',
    eway_bill_enabled: false,
    composition_rate: 0,
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: ''
  });
  const [gstLoading, setGstLoading] = useState(false);
  const [gstSaving, setGstSaving] = useState(false);

  // GST Reports state
  const [reportType, setReportType] = useState<'gstr1' | 'gstr3b' | 'itc'>('gstr1');
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

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

  // Load POS codes from API
  useEffect(() => {
    if (activeTab === 'pos') {
      fetchPosCodes();
    }
    if (activeTab === 'gst-settings') {
      fetchGstSettings();
    }
  }, [activeTab]);

  const fetchPosCodes = async () => {
    try {
      const res = await posCodesService.getAllPosCodes();
      setPosCodes(res.data.data);
    } catch (error) {
      console.error('Error loading POS codes:', error);
    }
  };

  const handleAddPosCode = async () => {
    if (!newPosCode.code || !newPosCode.employee_name) {
      alert('Please fill in both code and employee name');
      return;
    }
    try {
      await posCodesService.createPosCode(newPosCode);
      setNewPosCode({ code: '', employee_name: '' });
      setShowAddPosCodeForm(false);
      fetchPosCodes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create POS code');
    }
  };

  const handleUpdatePosCode = async (id: string) => {
    try {
      await posCodesService.updatePosCode(id, editPosCode);
      setEditingPosCodeId(null);
      fetchPosCodes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update POS code');
    }
  };

  const handleDeletePosCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this POS code?')) return;
    try {
      await posCodesService.deletePosCode(id);
      fetchPosCodes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete POS code');
    }
  };

  const handleTogglePosCodeActive = async (posCode: PosCode) => {
    try {
      await posCodesService.updatePosCode(posCode.id, { is_active: !posCode.is_active });
      fetchPosCodes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update POS code');
    }
  };

  // GST Settings handlers
  const fetchGstSettings = async () => {
    try {
      setGstLoading(true);
      const res = await gstSettingsService.getSettings();
      if (res.data?.success && res.data?.data) {
        setGstSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (error) {
      console.error('Error loading GST settings:', error);
    } finally {
      setGstLoading(false);
    }
  };

  const handleSaveGstSettings = async () => {
    if (!gstSettings.company_gstin) {
      alert('Company GSTIN is required');
      return;
    }
    try {
      setGstSaving(true);
      await gstSettingsService.updateSettings(gstSettings);
      alert('GST settings saved successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save GST settings');
    } finally {
      setGstSaving(false);
    }
  };

  // GST Reports handlers
  const fetchGstReport = async () => {
    try {
      setReportLoading(true);
      let res;
      if (reportType === 'gstr1') {
        res = await gstReportsService.getGSTR1(reportStartDate, reportEndDate);
      } else if (reportType === 'gstr3b') {
        res = await gstReportsService.getGSTR3B(reportStartDate, reportEndDate);
      } else {
        res = await gstReportsService.getITCReport(reportStartDate, reportEndDate);
      }
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching GST report:', error);
      alert('Failed to fetch report');
    } finally {
      setReportLoading(false);
    }
  };

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
          <button
            onClick={() => setActiveTab('pos')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition ${activeTab === 'pos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Monitor size={18} />
              POS
            </div>
          </button>
          <button
            onClick={() => setActiveTab('gst-settings')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition ${activeTab === 'gst-settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={18} />
              GST Settings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('gst-reports')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition ${activeTab === 'gst-reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={18} />
              GST Reports
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

        {/* POS Codes Tab */}
        {activeTab === 'pos' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">POS Codes</h2>
                <p className="text-sm text-gray-500">Manage employee codes for POS access. POS locks after 10 min of inactivity.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddPosCodeForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={18} />
                  Add POS Code
                </button>
              )}
            </div>

            {/* Add POS Code Form */}
            {showAddPosCodeForm && (
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                    <input
                      type="text"
                      value={newPosCode.code}
                      onChange={(e) => setNewPosCode({ ...newPosCode, code: e.target.value })}
                      placeholder="e.g. 1234"
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                    <input
                      type="text"
                      value={newPosCode.employee_name}
                      onChange={(e) => setNewPosCode({ ...newPosCode, employee_name: e.target.value })}
                      placeholder="e.g. Rahul Kumar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleAddPosCode}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => { setShowAddPosCodeForm(false); setNewPosCode({ code: '', employee_name: '' }); }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* POS Codes Table */}
            <div className="overflow-x-auto">
              {posCodes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Monitor size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No POS codes created yet.</p>
                  <p className="text-sm">Click "Add POS Code" to create one.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {posCodes.map((pc) => (
                      <tr key={pc.id} className="hover:bg-gray-50">
                        {editingPosCodeId === pc.id ? (
                          <>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editPosCode.code}
                                onChange={(e) => setEditPosCode({ ...editPosCode, code: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                maxLength={10}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editPosCode.employee_name}
                                onChange={(e) => setEditPosCode({ ...editPosCode, employee_name: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${pc.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {pc.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => handleUpdatePosCode(pc.id)} className="text-green-600 hover:text-green-800">
                                <Save size={16} />
                              </button>
                              <button onClick={() => setEditingPosCodeId(null)} className="text-gray-500 hover:text-gray-700">
                                <X size={16} />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 font-mono font-bold text-gray-800">{pc.code}</td>
                            <td className="px-6 py-4 text-gray-700">{pc.employee_name}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleTogglePosCodeActive(pc)}
                                className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${pc.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                              >
                                {pc.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => { setEditingPosCodeId(pc.id); setEditPosCode({ code: pc.code, employee_name: pc.employee_name }); }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeletePosCode(pc.id)} className="text-red-600 hover:text-red-800">
                                <Trash2 size={16} />
                              </button>
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

        {/* GST Settings Tab */}
        {activeTab === 'gst-settings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">GST Settings</h2>
              <p className="text-sm text-gray-500">Configure your company's GST details for invoices and compliance</p>
            </div>
            {gstLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company GSTIN <span className="text-red-500">*</span></label>
                    <input type="text" value={gstSettings.company_gstin} onChange={(e) => setGstSettings({ ...gstSettings, company_gstin: e.target.value.toUpperCase() })} maxLength={15} placeholder="e.g. 29AMVPI3949R1ZQ" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input type="text" value={gstSettings.company_name} onChange={(e) => setGstSettings({ ...gstSettings, company_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registered State</label>
                    <input type="text" value={gstSettings.registered_state} onChange={(e) => setGstSettings({ ...gstSettings, registered_state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                    <input type="text" value={gstSettings.state_code} onChange={(e) => setGstSettings({ ...gstSettings, state_code: e.target.value })} maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Registration Type</label>
                    <select value={gstSettings.gst_registration_type} onChange={(e) => setGstSettings({ ...gstSettings, gst_registration_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="regular">Regular</option>
                      <option value="composition">Composition</option>
                      <option value="exempt">Exempt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year Start</label>
                    <select value={gstSettings.financial_year_start} onChange={(e) => setGstSettings({ ...gstSettings, financial_year_start: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value={1}>January</option>
                      <option value={4}>April</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone</label>
                    <input type="text" value={gstSettings.company_phone} onChange={(e) => setGstSettings({ ...gstSettings, company_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                    <input type="email" value={gstSettings.company_email} onChange={(e) => setGstSettings({ ...gstSettings, company_email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                  <textarea value={gstSettings.company_address} onChange={(e) => setGstSettings({ ...gstSettings, company_address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-medium text-gray-800">E-Invoice & E-Way Bill</h3>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={gstSettings.e_invoice_enabled} onChange={(e) => setGstSettings({ ...gstSettings, e_invoice_enabled: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">E-Invoice Enabled</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={gstSettings.eway_bill_enabled} onChange={(e) => setGstSettings({ ...gstSettings, eway_bill_enabled: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">E-Way Bill Enabled</span>
                    </label>
                  </div>
                  {gstSettings.e_invoice_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-Invoice Username</label>
                        <input type="text" value={gstSettings.e_invoice_username} onChange={(e) => setGstSettings({ ...gstSettings, e_invoice_username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-Invoice Password</label>
                        <input type="password" value={gstSettings.e_invoice_password} onChange={(e) => setGstSettings({ ...gstSettings, e_invoice_password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSaveGstSettings} disabled={gstSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {gstSaving ? 'Saving...' : 'Save GST Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GST Reports Tab */}
        {activeTab === 'gst-reports' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">GST Reports</h2>
              <p className="text-sm text-gray-500">Generate GSTR-1, GSTR-3B, and ITC reports for filing</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select value={reportType} onChange={(e) => { setReportType(e.target.value); setReportData(null); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="gstr1">GSTR-1 (Outward Supplies)</option>
                    <option value="gstr3b">GSTR-3B (Summary Return)</option>
                    <option value="itc">ITC Report (Input Tax Credit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={fetchGstReport} disabled={reportLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
                  <BarChart3 size={16} />
                  {reportLoading ? 'Loading...' : 'Generate Report'}
                </button>
              </div>

              {reportData && (
                <div className="border-t pt-4">
                  {reportType === 'gstr1' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">GSTR-1 Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Total Invoices</p><p className="text-lg font-bold text-blue-700">{reportData.totals?.total_invoices || 0}</p></div>
                        <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Taxable Value</p><p className="text-lg font-bold text-green-700">{(reportData.totals?.total_taxable || 0).toFixed(2)}</p></div>
                        <div className="bg-orange-50 p-3 rounded-lg"><p className="text-xs text-gray-500">CGST</p><p className="text-lg font-bold text-orange-700">{(reportData.totals?.total_cgst || 0).toFixed(2)}</p></div>
                        <div className="bg-orange-50 p-3 rounded-lg"><p className="text-xs text-gray-500">SGST</p><p className="text-lg font-bold text-orange-700">{(reportData.totals?.total_sgst || 0).toFixed(2)}</p></div>
                        <div className="bg-purple-50 p-3 rounded-lg"><p className="text-xs text-gray-500">IGST</p><p className="text-lg font-bold text-purple-700">{(reportData.totals?.total_igst || 0).toFixed(2)}</p></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded"><p className="font-medium">B2B Invoices</p><p className="text-gray-600">{reportData.b2b?.length || 0}</p></div>
                        <div className="bg-gray-50 p-3 rounded"><p className="font-medium">B2C Large</p><p className="text-gray-600">{reportData.b2c_large?.length || 0}</p></div>
                        <div className="bg-gray-50 p-3 rounded"><p className="font-medium">B2C Small</p><p className="text-gray-600">{reportData.b2c_small?.length || 0}</p></div>
                      </div>
                    </div>
                  )}
                  {reportType === 'gstr3b' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">GSTR-3B Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                          <p className="text-sm font-medium text-red-800">Tax Collected (Outward)</p>
                          <p className="text-2xl font-bold text-red-700 mt-1">{(reportData.summary?.total_tax_collected || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <p className="text-sm font-medium text-green-800">ITC Available (Inward)</p>
                          <p className="text-2xl font-bold text-green-700 mt-1">{(reportData.summary?.total_itc || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <p className="text-sm font-medium text-blue-800">Net Tax Payable</p>
                          <p className="text-2xl font-bold text-blue-700 mt-1">{(reportData.summary?.net_payable || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {reportType === 'itc' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">Input Tax Credit Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-gray-600">Eligible ITC (CGST)</p><p className="text-xl font-bold text-green-700">{(reportData.eligible_itc?.total_cgst || 0).toFixed(2)}</p></div>
                        <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-gray-600">Eligible ITC (SGST)</p><p className="text-xl font-bold text-green-700">{(reportData.eligible_itc?.total_sgst || 0).toFixed(2)}</p></div>
                        <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-gray-600">Eligible ITC (IGST)</p><p className="text-xl font-bold text-green-700">{(reportData.eligible_itc?.total_igst || 0).toFixed(2)}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded"><p className="font-medium">Total Bills</p><p className="text-gray-600">{reportData.summary?.total_bills || 0}</p></div>
                        <div className="bg-red-50 p-3 rounded"><p className="font-medium">Blocked ITC Bills</p><p className="text-gray-600">{reportData.summary?.blocked_count || 0}</p></div>
                      </div>
                    </div>
                  )}
                </div>
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
