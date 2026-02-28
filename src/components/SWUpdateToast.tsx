import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Listens for Service Worker updates and shows a "New version available" toast.
 * Only active in production (non-preview) environments.
 */
export const SWUpdateToast = () => {
  const { toast } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      if (shown.current) return;
      shown.current = true;

      toast({
        title: '🔄 Нова версия',
        description: 'Налична е нова версия на системата.',
        duration: 15000,
      });

      // Auto-reload after a short delay so the toast is visible
      setTimeout(() => window.location.reload(), 2000);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [toast]);

  return null;
};
