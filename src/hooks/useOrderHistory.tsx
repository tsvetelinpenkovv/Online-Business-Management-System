import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrderHistoryEntry {
  id: string;
  order_id: number;
  user_email: string | null;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const useOrderHistory = (orderId: number | null) => {
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data || []) as OrderHistoryEntry[]);
    } catch (err) {
      console.error('Error fetching order history:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!orderId) return;
    
    const channel = supabase
      .channel(`order-history-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_history',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setHistory(prev => [payload.new as OrderHistoryEntry, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  return { history, loading, refetch: fetchHistory };
};
