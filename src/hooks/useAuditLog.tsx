import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog, AuditAction } from '@/types/warehouse';
import { useAuth } from '@/hooks/useAuth';

export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLogs = useCallback(async (limit = 100) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      setLoading(false);
      return;
    }

    setLogs(data as AuditLog[]);
    setLoading(false);
  }, []);

  const logAction = useCallback(async (
    action: AuditAction,
    tableName: string,
    recordId?: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || null,
          action,
          table_name: tableName,
          record_id: recordId || null,
          old_data: oldData || null,
          new_data: newData || null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });

      if (error) {
        console.error('Error logging action:', error);
      }
    } catch (err) {
      console.error('Error in logAction:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    logAction,
    refresh: fetchLogs,
  };
}
