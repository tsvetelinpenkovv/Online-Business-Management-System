import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrderMessage {
  order_id: number;
  channel: 'viber' | 'sms';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
}

export const useOrderMessages = (orderIds: number[]) => {
  const [messages, setMessages] = useState<Map<number, OrderMessage>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (orderIds.length === 0) return;
    
    setLoading(true);
    try {
      // Get the latest message for each order
      const { data, error } = await supabase
        .from('connectix_messages')
        .select('order_id, channel, status, sent_at')
        .in('order_id', orderIds)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Keep only the most recent message per order
      const messageMap = new Map<number, OrderMessage>();
      for (const msg of data || []) {
        if (msg.order_id && !messageMap.has(msg.order_id)) {
          messageMap.set(msg.order_id, msg as OrderMessage);
        }
      }
      
      setMessages(messageMap);
    } catch (error) {
      console.error('Error fetching order messages:', error);
    } finally {
      setLoading(false);
    }
  }, [orderIds.join(',')]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const getOrderMessage = (orderId: number) => messages.get(orderId);

  return { messages, loading, getOrderMessage, refetch: fetchMessages };
};
