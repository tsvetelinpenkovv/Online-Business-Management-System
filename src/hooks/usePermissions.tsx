import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Permission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UserPermissions {
  role: string;
  permissions: Permission[];
}

export function usePermissions() {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('allowed_users')
        .select('role')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        setLoading(false);
        return;
      }

      const role = userData.role;
      setIsAdmin(role === 'admin');

      // Get permissions for this role
      const { data: permsData, error: permsError } = await supabase
        .from('role_permissions')
        .select('module, can_view, can_create, can_edit, can_delete')
        .eq('role', role);

      if (permsError) {
        console.error('Error fetching permissions:', permsError);
        setLoading(false);
        return;
      }

      setUserPermissions({
        role,
        permissions: permsData || [],
      });
    } catch (error) {
      console.error('Error in fetchPermissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (isAdmin) return true; // Admins have all permissions
    if (!userPermissions) return false;

    const perm = userPermissions.permissions.find(p => p.module === module);
    if (!perm) return false;

    switch (action) {
      case 'view': return perm.can_view;
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      default: return false;
    }
  }, [isAdmin, userPermissions]);

  const canView = useCallback((module: string) => hasPermission(module, 'view'), [hasPermission]);
  const canCreate = useCallback((module: string) => hasPermission(module, 'create'), [hasPermission]);
  const canEdit = useCallback((module: string) => hasPermission(module, 'edit'), [hasPermission]);
  const canDelete = useCallback((module: string) => hasPermission(module, 'delete'), [hasPermission]);

  return {
    userPermissions,
    loading,
    isAdmin,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refresh: fetchPermissions,
  };
}
