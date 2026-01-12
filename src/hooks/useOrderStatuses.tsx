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

export const useOrderStatuses = () => {
  const [statuses, setStatuses] = useState<OrderStatusConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('order_statuses')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
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
      
      setStatuses([...statuses, data]);
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
      
      setStatuses(statuses.map(s => s.id === id ? { ...s, ...updates } : s));
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
      
      setStatuses(statuses.filter(s => s.id !== id));
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
  };
};
