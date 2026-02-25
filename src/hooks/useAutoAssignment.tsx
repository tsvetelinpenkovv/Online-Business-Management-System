import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAutoAssignment = () => {
  const assignOrder = useCallback(async (orderId: number) => {
    try {
      // Get all users with 'user' or 'admin' role
      const { data: users, error: usersError } = await supabase
        .from('allowed_users')
        .select('id, email, name')
        .order('name');

      if (usersError || !users || users.length === 0) return null;

      // Get current assignment counts for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: assignments } = await supabase
        .from('orders')
        .select('assigned_to')
        .not('assigned_to', 'is', null)
        .gte('assigned_at', today.toISOString());

      // Count assignments per user
      const counts: Record<string, number> = {};
      users.forEach(u => { counts[u.id] = 0; });
      (assignments || []).forEach((a: any) => {
        if (a.assigned_to && counts[a.assigned_to] !== undefined) {
          counts[a.assigned_to]++;
        }
      });

      // Find user with fewest assignments (round-robin)
      const sorted = users.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
      const assignee = sorted[0];

      // Assign the order
      const { error } = await supabase
        .from('orders')
        .update({ assigned_to: assignee.id, assigned_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      return { userId: assignee.id, userName: assignee.name, userEmail: assignee.email };
    } catch (err) {
      console.error('Error auto-assigning order:', err);
      return null;
    }
  }, []);

  const bulkAssign = useCallback(async (orderIds: number[]) => {
    const results = [];
    for (const id of orderIds) {
      const result = await assignOrder(id);
      results.push({ orderId: id, ...result });
    }
    return results;
  }, [assignOrder]);

  return { assignOrder, bulkAssign };
};
