import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UseRealtimeOrdersOptions {
  onNewOrder?: () => void;
  onOrderUpdated?: () => void;
  onOrderDeleted?: () => void;
  enabled?: boolean;
}

export const useRealtimeOrders = ({
  onNewOrder,
  onOrderUpdated,
  onOrderDeleted,
  enabled = true,
}: UseRealtimeOrdersOptions = {}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as any;
          // Don't notify for orders created by current user
          if (newOrder.user_id === user.id) return;

          toast({
            title: '🔔 Нова поръчка!',
            description: `Поръчка #${newOrder.code} от ${newOrder.customer_name} - ${newOrder.total_price?.toFixed(2)} €`,
          });

          // Play notification sound
          try {
            if (!audioRef.current) {
              audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGiRajMDfwH04Fx1LdsLk0X0zDBlCZrXl24ImBRQ/YK/p3KsqBBA5Wqrl3bInBQ42VKDi3rYpBQ0yT5rf4L0pBQsvSJXe4cEpBQktRZDd4sQoBQgqQo3c48cpBQcpP4rc5MkoBQYnPIfb5cspBQUlOoTa5s0oBQQjN4HZ5s8oBQMhNH7Y58');
            }
            audioRef.current.play().catch(() => {});
          } catch {}

          onNewOrder?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          onOrderUpdated?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          onOrderDeleted?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, user, toast, onNewOrder, onOrderUpdated, onOrderDeleted]);
};
