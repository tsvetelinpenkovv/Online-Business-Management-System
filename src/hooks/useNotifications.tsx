import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppNotification {
  id: string;
  type: 'low_stock' | 'new_order' | 'failed_delivery' | 'overdue_payment';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

const NOTIFICATION_KEY = 'app_notifications';
const DISMISSED_TYPES_KEY = 'dismissed_notification_types';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATION_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [dismissedTypes, setDismissedTypes] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_TYPES_KEY);
      if (saved) return new Set(JSON.parse(saved));
      // Default: overdue_payment is dismissed by default
      const defaults = new Set(['overdue_payment']);
      localStorage.setItem(DISMISSED_TYPES_KEY, JSON.stringify([...defaults]));
      return defaults;
    } catch { return new Set(['overdue_payment']); }
  });

  const saveNotifications = useCallback((items: AppNotification[]) => {
    const trimmed = items.slice(0, 50);
    setNotifications(trimmed);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(trimmed));
  }, []);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    // Skip if this type is dismissed
    if (dismissedTypes.has(notif.type)) return;

    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => {
      const exists = prev.some(n => 
        n.type === newNotif.type && n.message === newNotif.message &&
        Date.now() - new Date(n.createdAt).getTime() < 3600000
      );
      if (exists) return prev;
      const updated = [newNotif, ...prev].slice(0, 50);
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [dismissedTypes]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATION_KEY);
  }, []);

  const dismissType = useCallback((type: AppNotification['type']) => {
    setDismissedTypes(prev => {
      const updated = new Set(prev);
      updated.add(type);
      localStorage.setItem(DISMISSED_TYPES_KEY, JSON.stringify([...updated]));
      return updated;
    });
    // Also remove existing notifications of this type
    setNotifications(prev => {
      const updated = prev.filter(n => n.type !== type);
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const restoreType = useCallback((type: AppNotification['type']) => {
    setDismissedTypes(prev => {
      const updated = new Set(prev);
      updated.delete(type);
      localStorage.setItem(DISMISSED_TYPES_KEY, JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  const checkNotifications = useCallback(async () => {
    try {
      // 1. Low stock check
      const { data: lowStock } = await supabase
        .from('inventory_products')
        .select('name, current_stock, min_stock_level')
        .eq('is_active', true)
        .not('min_stock_level', 'is', null);

      lowStock?.forEach(p => {
        if (p.min_stock_level && Number(p.current_stock) <= Number(p.min_stock_level)) {
          addNotification({
            type: 'low_stock',
            title: 'Ниска наличност',
            message: `${p.name}: ${p.current_stock} бр. (мин. ${p.min_stock_level})`,
            link: '/inventory',
          });
        }
      });

      // 2. Failed deliveries (last 24h)
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const { data: failedOrders } = await supabase
        .from('orders')
        .select('id, code, customer_name')
        .eq('status', 'Неуспешна доставка')
        .gte('created_at', yesterday);

      failedOrders?.forEach(o => {
        addNotification({
          type: 'failed_delivery',
          title: 'Неуспешна доставка',
          message: `Поръчка ${o.code} — ${o.customer_name}`,
          link: '/',
        });
      });

      // 3. Overdue payments - check if enabled in admin settings
      const { data: overdueConfig } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'overdue_payments_enabled')
        .maybeSingle();

      const overdueEnabled = overdueConfig?.setting_value === 'true'; // default false (disabled)

      if (overdueEnabled) {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: overdueOrders } = await supabase
          .from('orders')
          .select('id, code, customer_name, total_price')
          .eq('payment_status', 'unpaid')
          .lte('created_at', weekAgo)
          .limit(10);

        overdueOrders?.forEach(o => {
          addNotification({
            type: 'overdue_payment',
            title: 'Просрочено плащане',
            message: `${o.code} — ${o.customer_name}: ${Number(o.total_price).toFixed(2)} €`,
            link: '/finance',
          });
        });
      }
    } catch (err) {
      console.error('Notification check error:', err);
    }
  }, [addNotification]);

  // Check on mount and periodically
  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkNotifications]);

  // Listen for new orders in realtime
  useEffect(() => {
    const channel = supabase
      .channel('notifications-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const order = payload.new as any;
        addNotification({
          type: 'new_order',
          title: 'Нова поръчка',
          message: `${order.code} — ${order.customer_name}: ${Number(order.total_price).toFixed(2)} €`,
          link: '/',
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications, unreadCount,
    markAsRead, markAllRead, clearAll,
    dismissType, restoreType, dismissedTypes,
    checkNotifications,
  };
};
