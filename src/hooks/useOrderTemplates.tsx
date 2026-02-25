import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrderTemplate {
  id: string;
  name: string;
  template_data: Record<string, any>;
  usage_count: number;
  created_at: string;
}

export const useOrderTemplates = () => {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('order_templates')
        .select('*')
        .order('usage_count', { ascending: false });
      if (error) throw error;
      setTemplates((data || []) as OrderTemplate[]);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTemplate = useCallback(async (name: string, data: Record<string, any>) => {
    const { data: result, error } = await supabase
      .from('order_templates')
      .insert({ name, template_data: data })
      .select()
      .single();
    if (error) throw error;
    setTemplates(prev => [result as OrderTemplate, ...prev]);
    return result;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from('order_templates').delete().eq('id', id);
    if (error) throw error;
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const incrementUsage = useCallback(async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    await supabase
      .from('order_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', id);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, usage_count: (t.usage_count || 0) + 1 } : t));
  }, [templates]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  return { templates, loading, saveTemplate, deleteTemplate, incrementUsage, refetch: fetchTemplates };
};
