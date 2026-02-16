import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Courier {
  id: string;
  name: string;
  logo_url: string | null;
  url_pattern: string | null;
}

const fetchCouriers = async (): Promise<Courier[]> => {
  const { data, error } = await supabase
    .from('couriers')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const useCouriers = () => {
  const { data: couriers = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['couriers'],
    queryFn: fetchCouriers,
  });

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

  return { couriers, loading, getCourierByUrl, refetch };
};
