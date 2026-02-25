import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OutgoingWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string> | null;
  secret_key: string | null;
  is_enabled: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  delivered_at: string;
}

const WEBHOOK_EVENTS = [
  { value: 'order.created', label: 'Нова поръчка' },
  { value: 'order.updated', label: 'Обновена поръчка' },
  { value: 'order.status_changed', label: 'Промяна на статус' },
  { value: 'order.deleted', label: 'Изтрита поръчка' },
  { value: 'shipment.created', label: 'Нова пратка' },
  { value: 'stock.low', label: 'Ниска наличност' },
  { value: 'stock.out', label: 'Изчерпана наличност' },
];

export { WEBHOOK_EVENTS };

export const useOutgoingWebhooks = () => {
  const [webhooks, setWebhooks] = useState<OutgoingWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('outgoing_webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWebhooks((data || []) as OutgoingWebhook[]);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWebhook = useCallback(async (webhook: Omit<OutgoingWebhook, 'id' | 'created_at' | 'failure_count' | 'last_triggered_at'>) => {
    const { data, error } = await supabase
      .from('outgoing_webhooks')
      .insert(webhook)
      .select()
      .single();
    if (error) throw error;
    setWebhooks(prev => [data as OutgoingWebhook, ...prev]);
    return data;
  }, []);

  const updateWebhook = useCallback(async (id: string, updates: Partial<OutgoingWebhook>) => {
    const { error } = await supabase.from('outgoing_webhooks').update(updates).eq('id', id);
    if (error) throw error;
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWebhook = useCallback(async (id: string) => {
    const { error } = await supabase.from('outgoing_webhooks').delete().eq('id', id);
    if (error) throw error;
    setWebhooks(prev => prev.filter(w => w.id !== id));
  }, []);

  const toggleWebhook = useCallback(async (id: string) => {
    const webhook = webhooks.find(w => w.id === id);
    if (webhook) await updateWebhook(id, { is_enabled: !webhook.is_enabled });
  }, [webhooks, updateWebhook]);

  const fetchDeliveries = useCallback(async (webhookId: string): Promise<WebhookDelivery[]> => {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('delivered_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []) as WebhookDelivery[];
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  return { webhooks, loading, createWebhook, updateWebhook, deleteWebhook, toggleWebhook, fetchDeliveries, refetch: fetchWebhooks };
};
