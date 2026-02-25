import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateOrder {
  duplicate_id: number;
  duplicate_code: string;
  duplicate_date: string;
  similarity_score: number;
}

export const useDuplicateDetection = () => {
  const [duplicates, setDuplicates] = useState<DuplicateOrder[]>([]);
  const [checking, setChecking] = useState(false);

  const checkDuplicates = useCallback(async (phone: string, productName: string, hours: number = 24) => {
    if (!phone || !productName) {
      setDuplicates([]);
      return [];
    }

    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_duplicate_order', {
        _phone: phone,
        _product_name: productName,
        _hours: hours,
      });

      if (error) throw error;
      const results = (data || []) as DuplicateOrder[];
      setDuplicates(results);
      return results;
    } catch (err) {
      console.error('Error checking duplicates:', err);
      setDuplicates([]);
      return [];
    } finally {
      setChecking(false);
    }
  }, []);

  const clearDuplicates = useCallback(() => setDuplicates([]), []);

  return { duplicates, checking, checkDuplicates, clearDuplicates };
};
