import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Store {
  id: string;
  name: string;
  country_code: string;
  country_name: string;
  flag_emoji: string;
  currency: string;
  currency_symbol: string;
  wc_url: string | null;
  wc_consumer_key: string | null;
  wc_consumer_secret: string | null;
  wc_webhook_secret: string | null;
  is_enabled: boolean;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [multiStoreEnabled, setMultiStoreEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setStores((data || []) as Store[]);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  }, []);

  const fetchMultiStoreEnabled = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('multi_store_enabled')
        .limit(1)
        .maybeSingle();

      setMultiStoreEnabled(data?.multi_store_enabled || false);
    } catch (error) {
      console.error('Error fetching multi-store setting:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStores(), fetchMultiStoreEnabled()]);
      setLoading(false);
    };
    load();
  }, [fetchStores, fetchMultiStoreEnabled]);

  const toggleMultiStore = async (enabled: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('company_settings')
          .update({ multi_store_enabled: enabled })
          .eq('id', existing.id);
      }
      setMultiStoreEnabled(enabled);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createStore = async (store: Partial<Store>) => {
    try {
      const { error } = await supabase.from('stores').insert(store as any);
      if (error) throw error;
      await fetchStores();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateStore = async (id: string, updates: Partial<Store>) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
      await fetchStores();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteStore = async (id: string) => {
    try {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      await fetchStores();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const getEnabledStores = () => stores.filter(s => s.is_enabled);

  return {
    stores,
    multiStoreEnabled,
    loading,
    fetchStores,
    toggleMultiStore,
    createStore,
    updateStore,
    deleteStore,
    getEnabledStores,
  };
};
