import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderStatusConfig {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const CACHE_KEY = 'order_statuses_cache';
const CACHE_TIMESTAMP_KEY = 'order_statuses_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached statuses from localStorage
const getCachedStatuses = (): OrderStatusConfig[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading status cache:', error);
  }
  return null;
};

// Save statuses to localStorage cache
const setCachedStatuses = (statuses: OrderStatusConfig[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(statuses));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving status cache:', error);
  }
};

// Clear cache
const clearStatusCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing status cache:', error);
  }
};

export const useOrderStatuses = () => {
  // Initialize with cached data immediately (stale-while-revalidate pattern)
  const [statuses, setStatuses] = useState<OrderStatusConfig[]>(() => {
    return getCachedStatuses() || [];
  });
  const [loading, setLoading] = useState(() => {
    // Only show loading if we don't have cached data
    return getCachedStatuses() === null;
  });
  const { toast } = useToast();

  const fetchStatuses = useCallback(async () => {
    try {
      // If we have cached data, don't set loading to true (stale-while-revalidate)
      const hasCached = getCachedStatuses() !== null;
      if (!hasCached) {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('order_statuses')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const newStatuses = data || [];
      setStatuses(newStatuses);
      setCachedStatuses(newStatuses);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const addStatus = async (name: string, color: string, icon: string) => {
    try {
      const maxSortOrder = Math.max(...statuses.map(s => s.sort_order), 0);
      const { data, error } = await supabase
        .from('order_statuses')
        .insert({
          name,
          color,
          icon,
          sort_order: maxSortOrder + 1,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newStatuses = [...statuses, data];
      setStatuses(newStatuses);
      setCachedStatuses(newStatuses);
      
      toast({
        title: 'Успех',
        description: 'Статусът беше добавен',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно добавяне на статус',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateStatus = async (id: string, updates: Partial<OrderStatusConfig>) => {
    try {
      const { error } = await supabase
        .from('order_statuses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      const newStatuses = statuses.map(s => s.id === id ? { ...s, ...updates } : s);
      setStatuses(newStatuses);
      setCachedStatuses(newStatuses);
      
      toast({
        title: 'Успех',
        description: 'Статусът беше обновен',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно обновяване на статус',
        variant: 'destructive',
      });
    }
  };

  const deleteStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from('order_statuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const newStatuses = statuses.filter(s => s.id !== id);
      setStatuses(newStatuses);
      setCachedStatuses(newStatuses);
      
      toast({
        title: 'Успех',
        description: 'Статусът беше изтрит',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно изтриване на статус',
        variant: 'destructive',
      });
    }
  };

  const reorderStatuses = async (orderedIds: string[]) => {
    try {
      // Update sort_order for each status
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('order_statuses')
          .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      await Promise.all(updates);
      
      // Update local state
      const reorderedStatuses = orderedIds
        .map(id => statuses.find(s => s.id === id))
        .filter((s): s is OrderStatusConfig => s !== undefined)
        .map((s, index) => ({ ...s, sort_order: index + 1 }));
      
      setStatuses(reorderedStatuses);
      setCachedStatuses(reorderedStatuses);
      
      toast({
        title: 'Успех',
        description: 'Редът на статусите беше запазен',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно пренареждане на статуси',
        variant: 'destructive',
      });
    }
  };

  return {
    statuses,
    loading,
    addStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    refetch: fetchStatuses,
    clearCache: clearStatusCache,
  };
};
