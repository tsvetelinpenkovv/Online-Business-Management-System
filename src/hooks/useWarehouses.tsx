import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Warehouse } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [multiWarehouseEnabled, setMultiWarehouseEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWarehouses = useCallback(async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching warehouses:', error);
      return;
    }
    setWarehouses(data as Warehouse[]);
  }, []);

  const fetchMultiWarehouseSetting = useCallback(async () => {
    const { data, error } = await supabase
      .from('api_settings')
      .select('setting_value')
      .eq('setting_key', 'multi_warehouse_enabled')
      .maybeSingle();

    if (!error && data) {
      setMultiWarehouseEnabled(data.setting_value === 'true');
    }
  }, []);

  const toggleMultiWarehouse = async (enabled: boolean) => {
    const { error } = await supabase
      .from('api_settings')
      .upsert({
        setting_key: 'multi_warehouse_enabled',
        setting_value: enabled ? 'true' : 'false',
      }, { onConflict: 'setting_key' });

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешна промяна на настройката', variant: 'destructive' });
      return false;
    }

    setMultiWarehouseEnabled(enabled);
    toast({ 
      title: 'Успех', 
      description: enabled ? 'Многоскладовият режим е активиран' : 'Многоскладовият режим е деактивиран' 
    });
    return true;
  };

  const createWarehouse = async (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => {
    // If this is set as default, unset others first
    if (warehouse.is_default) {
      await supabase
        .from('warehouses')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert(warehouse)
      .select()
      .single();

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на склад', variant: 'destructive' });
      return null;
    }

    toast({ title: 'Успех', description: 'Складът е създаден' });
    await fetchWarehouses();
    return data;
  };

  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    // If this is set as default, unset others first
    if (updates.is_default) {
      await supabase
        .from('warehouses')
        .update({ is_default: false })
        .neq('id', id);
    }

    const { error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешна актуализация на склад', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Успех', description: 'Складът е актуализиран' });
    await fetchWarehouses();
    return true;
  };

  const deleteWarehouse = async (id: string) => {
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на склад', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Успех', description: 'Складът е изтрит' });
    await fetchWarehouses();
    return true;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchWarehouses(), fetchMultiWarehouseSetting()]);
      setLoading(false);
    };
    load();
  }, [fetchWarehouses, fetchMultiWarehouseSetting]);

  return {
    warehouses,
    multiWarehouseEnabled,
    loading,
    toggleMultiWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    refresh: fetchWarehouses,
  };
}
