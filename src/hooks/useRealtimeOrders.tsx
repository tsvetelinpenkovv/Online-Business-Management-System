import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { playNotificationSound, getNotificationSettings } from '@/components/settings/NotificationSoundSettings';

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
          if (newOrder.user_id === user.id) return;

          toast({
            title: '🔔 Нова поръчка!',
            description: `Поръчка #${newOrder.code} от ${newOrder.customer_name} - ${newOrder.total_price?.toFixed(2)} €`,
          });

          // Play configurable notification sound
          playNotificationSound();

          // Browser notification if enabled
          const settings = getNotificationSettings();
          if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🔔 Нова поръчка!', {
              body: `#${newOrder.code} от ${newOrder.customer_name} - ${newOrder.total_price?.toFixed(2)} €`,
            });
          }

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
