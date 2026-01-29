import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  isSystem?: boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) return null;

    // Get roles from localStorage
    const rolesData = localStorage.getItem('roles');
    if (!rolesData) return null;

    try {
      const roles: Role[] = JSON.parse(rolesData);
      const userRole = roles.find(r => r.name === user.role);

      if (!userRole) return null;

      // Create a permission map for easy access
      const permissionMap: Record<string, Permission> = {};
      userRole.permissions.forEach(perm => {
        permissionMap[perm.module.toLowerCase()] = perm;
      });

      return permissionMap;
    } catch (error) {
      console.error('Error loading permissions:', error);
      return null;
    }
  }, [user]);

  const hasPermission = (module: string, action: 'create' | 'read' | 'update' | 'delete') => {
    // Admin has all permissions
    if (user?.role === 'Admin') return true;

    if (!permissions) return false;
    const modulePermission = permissions[module.toLowerCase()];
    if (!modulePermission) return false;
    return modulePermission[action];
  };

  const canAccessModule = (module: string) => {
    // Admin can access all modules
    if (user?.role === 'Admin') return true;

    return hasPermission(module, 'read');
  };

  const canCreate = (module: string) => {
    // Admin can create in all modules
    if (user?.role === 'Admin') return true;

    return hasPermission(module, 'create');
  };

  const canUpdate = (module: string) => {
    // Admin can update in all modules
    if (user?.role === 'Admin') return true;

    return hasPermission(module, 'update');
  };

  const canDelete = (module: string) => {
    // Admin can delete in all modules
    if (user?.role === 'Admin') return true;

    return hasPermission(module, 'delete');
  };

  return {
    permissions,
    hasPermission,
    canAccessModule,
    canCreate,
    canUpdate,
    canDelete
  };
};
