import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockAlert {
  id: string;
  product_id: string;
  alert_type: string;
  current_stock: number;
  threshold: number;
  is_read: boolean;
  resolved_at: string | null;
  created_at: string;
  product_name?: string;
  product_sku?: string;
}

export const useStockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select(`
          *,
          inventory_products!inner(name, sku)
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped = (data || []).map((a: any) => ({
        ...a,
        product_name: a.inventory_products?.name,
        product_sku: a.inventory_products?.sku,
      }));
      setAlerts(mapped);
      setUnreadCount(mapped.filter((a: StockAlert) => !a.is_read).length);
    } catch (err) {
      console.error('Error fetching stock alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (alertId: string) => {
    await supabase.from('stock_alerts').update({ is_read: true }).eq('id', alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    if (unreadIds.length === 0) return;
    await supabase.from('stock_alerts').update({ is_read: true }).in('id', unreadIds);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);
  }, [alerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('stock-alerts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stock_alerts',
      }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts]);

  return { alerts, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchAlerts };
};
