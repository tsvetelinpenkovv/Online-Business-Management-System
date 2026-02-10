import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  tags: string[];
  total_orders: number;
  total_spent: number;
  first_order_date: string | null;
  last_order_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  note: string;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
}

const AVAILABLE_TAGS = ['VIP', 'Нов', 'Редовен', 'Проблемен', 'Лоялен', 'Корпоративен', 'Дропшипинг'];

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_order_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setCustomers((data || []) as Customer[]);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на клиентите', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const updateCustomerTags = async (customerId: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ tags })
        .eq('id', customerId);
      if (error) throw error;
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, tags } : c));
      toast({ title: 'Успех', description: 'Таговете бяха обновени' });
    } catch (error) {
      toast({ title: 'Грешка', description: 'Неуспешно обновяване на таговете', variant: 'destructive' });
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId);
      if (error) throw error;
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updates } : c));
      toast({ title: 'Успех', description: 'Клиентът беше обновен' });
    } catch (error) {
      toast({ title: 'Грешка', description: 'Неуспешно обновяване', variant: 'destructive' });
    }
  };

  const fetchNotes = async (customerId: string): Promise<CustomerNote[]> => {
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data || []) as CustomerNote[];
  };

  const addNote = async (customerId: string, note: string, userId?: string, userEmail?: string) => {
    try {
      const { error } = await supabase
        .from('customer_notes')
        .insert({ customer_id: customerId, note, created_by: userId || null, created_by_email: userEmail || null });
      if (error) throw error;
      toast({ title: 'Успех', description: 'Бележката беше добавена' });
    } catch (error) {
      toast({ title: 'Грешка', description: 'Неуспешно добавяне на бележка', variant: 'destructive' });
    }
  };

  const findCustomerByPhone = (phone: string): Customer | undefined => {
    if (!phone || phone.length < 5) return undefined;
    const clean = phone.replace(/\s+/g, '');
    return customers.find(c => c.phone?.replace(/\s+/g, '') === clean);
  };

  const syncCustomersFromOrders = async () => {
    try {
      toast({ title: 'Синхронизация', description: 'Синхронизиране на клиенти от поръчки...' });
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_name, phone, customer_email, total_price, created_at')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (!orders) return;

      // Group by phone
      const customerMap = new Map<string, { name: string; phone: string; email: string | null; total_orders: number; total_spent: number; first_order_date: string; last_order_date: string }>();
      
      for (const order of orders) {
        if (!order.phone) continue;
        const phone = order.phone.replace(/\s+/g, '');
        const existing = customerMap.get(phone);
        if (existing) {
          existing.total_orders += 1;
          existing.total_spent += Number(order.total_price) || 0;
          existing.last_order_date = order.created_at;
          if (!existing.email && order.customer_email) existing.email = order.customer_email;
        } else {
          customerMap.set(phone, {
            name: order.customer_name,
            phone: order.phone,
            email: order.customer_email || null,
            total_orders: 1,
            total_spent: Number(order.total_price) || 0,
            first_order_date: order.created_at,
            last_order_date: order.created_at,
          });
        }
      }

      // Upsert customers
      for (const [, customer] of customerMap) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customer.phone)
          .maybeSingle();
        
        if (existing) {
          await supabase.from('customers').update({
            total_orders: customer.total_orders,
            total_spent: customer.total_spent,
            first_order_date: customer.first_order_date,
            last_order_date: customer.last_order_date,
            email: customer.email,
          }).eq('id', existing.id);
        } else {
          await supabase.from('customers').insert(customer);
        }
      }

      await fetchCustomers();
      toast({ title: 'Успех', description: `Синхронизирани ${customerMap.size} клиента от поръчките` });
    } catch (error) {
      console.error('Error syncing customers:', error);
      toast({ title: 'Грешка', description: 'Неуспешна синхронизация', variant: 'destructive' });
    }
  };

  return {
    customers,
    loading,
    fetchCustomers,
    updateCustomerTags,
    updateCustomer,
    fetchNotes,
    addNote,
    findCustomerByPhone,
    syncCustomersFromOrders,
    AVAILABLE_TAGS,
  };
};
