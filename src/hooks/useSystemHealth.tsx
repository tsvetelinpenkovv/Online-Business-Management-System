import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface SystemAlert {
  id: string;
  alert_type: string;
  source: string;
  title: string;
  message: string | null;
  details: Record<string, unknown>;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface HealthStatus {
  database: 'ok' | 'error' | 'checking';
  storage: 'ok' | 'error' | 'checking';
  edgeFunctions: 'ok' | 'error' | 'checking';
  lastChecked: string | null;
}

export interface BusinessMetrics {
  newOrdersToday: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  failedWebhooks: number;
  pendingOrders: number;
}

export interface PerformanceMetrics {
  totalOrders: number;
  totalProducts: number;
  avgOrdersPerDay: number;
  edgeFunctionCount: number;
}

export const useSystemAlerts = () => {
  return useQuery({
    queryKey: ['system_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_alerts' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as SystemAlert[];
    },
    refetchInterval: 30000,
  });
};

export const useHealthCheck = () => {
  const [health, setHealth] = useState<HealthStatus>({
    database: 'checking',
    storage: 'checking',
    edgeFunctions: 'checking',
    lastChecked: null,
  });
  const [checking, setChecking] = useState(false);

  const runHealthCheck = useCallback(async () => {
    setChecking(true);
    const newHealth: HealthStatus = {
      database: 'checking',
      storage: 'checking',
      edgeFunctions: 'checking',
      lastChecked: new Date().toISOString(),
    };

    // Check DB
    try {
      const { error } = await supabase.from('order_statuses').select('id').limit(1);
      newHealth.database = error ? 'error' : 'ok';
    } catch {
      newHealth.database = 'error';
    }

    // Check storage
    try {
      const { error } = await supabase.storage.from('logos').list('', { limit: 1 });
      newHealth.storage = error ? 'error' : 'ok';
    } catch {
      newHealth.storage = 'error';
    }

    // Check edge functions
    try {
      const { data, error } = await supabase.functions.invoke('theme-preference', { method: 'GET' });
      newHealth.edgeFunctions = error ? 'error' : 'ok';
    } catch {
      newHealth.edgeFunctions = 'error';
    }

    setHealth(newHealth);
    setChecking(false);
  }, []);

  return { health, checking, runHealthCheck };
};

export const useBusinessMetrics = () => {
  return useQuery({
    queryKey: ['business_metrics'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, stockRes, webhooksRes, pendingRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase.rpc('get_inventory_stats'),
        supabase.from('outgoing_webhooks').select('id, failure_count')
          .gt('failure_count', 0),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .in('status', ['Нова', 'В обработка']),
      ]);

      const stats = stockRes.data as any;

      return {
        newOrdersToday: ordersRes.count || 0,
        lowStockProducts: stats?.lowStockProducts || 0,
        outOfStockProducts: stats?.outOfStockProducts || 0,
        failedWebhooks: webhooksRes.data?.length || 0,
        pendingOrders: pendingRes.count || 0,
      } as BusinessMetrics;
    },
    refetchInterval: 60000,
  });
};

export const usePerformanceMetrics = () => {
  return useQuery({
    queryKey: ['performance_metrics'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [ordersRes, productsRes, recentOrdersRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('inventory_products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString()),
      ]);

      return {
        totalOrders: ordersRes.count || 0,
        totalProducts: productsRes.count || 0,
        avgOrdersPerDay: Math.round((recentOrdersRes.count || 0) / 7),
        edgeFunctionCount: 22,
      } as PerformanceMetrics;
    },
    refetchInterval: 120000,
  });
};

export const useResolveAlert = () => {
  return useCallback(async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('system_alerts' as any)
      .update({
        is_resolved: true,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);
    if (error) throw error;
  }, []);
};
