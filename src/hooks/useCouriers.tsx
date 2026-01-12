import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Courier {
  id: string;
  name: string;
  logo_url: string | null;
  url_pattern: string | null;
}

export const useCouriers = () => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCouriers(data || []);
    } catch (error) {
      console.error('Error fetching couriers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const getCourierByUrl = useCallback(
    (url: string | null | undefined): Courier | null => {
      if (!url) return null;

      const lowerUrl = url.toLowerCase();
      return (
        couriers.find(
          (courier) =>
            courier.url_pattern && lowerUrl.includes(courier.url_pattern.toLowerCase()),
        ) || null
      );
    },
    [couriers],
  );

  return { couriers, loading, getCourierByUrl, refetch: fetchCouriers };
};
