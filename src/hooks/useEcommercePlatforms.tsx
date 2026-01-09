import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EcommercePlatform {
  id: string;
  name: string;
  display_name: string;
  logo_url: string | null;
  is_enabled: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useEcommercePlatforms = () => {
  const [platforms, setPlatforms] = useState<EcommercePlatform[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatforms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ecommerce_platforms')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Type assertion for the config field and sort with WooCommerce first
      const typedData = (data || []).map(platform => ({
        ...platform,
        config: (platform.config || {}) as Record<string, any>
      }));
      
      // Sort: WooCommerce first, then alphabetically by display_name
      typedData.sort((a, b) => {
        if (a.name === 'woocommerce') return -1;
        if (b.name === 'woocommerce') return 1;
        return a.display_name.localeCompare(b.display_name);
      });
      
      setPlatforms(typedData);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const updatePlatform = async (id: string, updates: Partial<EcommercePlatform>) => {
    try {
      const { error } = await supabase
        .from('ecommerce_platforms')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchPlatforms();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const togglePlatform = async (id: string, is_enabled: boolean) => {
    return updatePlatform(id, { is_enabled });
  };

  const updatePlatformConfig = async (id: string, config: Record<string, any>) => {
    return updatePlatform(id, { config });
  };

  const getEnabledPlatforms = () => platforms.filter(p => p.is_enabled);

  const getEnabledSources = () => {
    // Always include phone and standard sources, plus enabled platforms
    const sources = ['google', 'facebook', 'phone'];
    platforms.filter(p => p.is_enabled).forEach(p => sources.push(p.name));
    return sources;
  };

  return {
    platforms,
    loading,
    fetchPlatforms,
    updatePlatform,
    togglePlatform,
    updatePlatformConfig,
    getEnabledPlatforms,
    getEnabledSources
  };
};
