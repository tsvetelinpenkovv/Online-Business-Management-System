import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_enabled: boolean;
  priority: number;
  created_at: string;
}

export const useAutomationRules = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules((data || []) as AutomationRule[]);
    } catch (err) {
      console.error('Error fetching automation rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRule = useCallback(async (rule: Omit<AutomationRule, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert(rule)
      .select()
      .single();
    if (error) throw error;
    setRules(prev => [...prev, data as AutomationRule]);
    return data;
  }, []);

  const updateRule = useCallback(async (id: string, updates: Partial<AutomationRule>) => {
    const { error } = await supabase.from('automation_rules').update(updates).eq('id', id);
    if (error) throw error;
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    const { error } = await supabase.from('automation_rules').delete().eq('id', id);
    if (error) throw error;
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleRule = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (rule) await updateRule(id, { is_enabled: !rule.is_enabled });
  }, [rules, updateRule]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  return { rules, loading, createRule, updateRule, deleteRule, toggleRule, refetch: fetchRules };
};
