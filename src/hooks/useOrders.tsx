import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/order';
import { useToast } from '@/hooks/use-toast';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на поръчките',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOrders(orders.filter(order => order.id !== id));
      toast({
        title: 'Успех',
        description: 'Поръчката беше изтрита',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно изтриване на поръчката',
        variant: 'destructive',
      });
    }
  };

  const deleteOrders = async (ids: number[]) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', ids);

      if (error) throw error;

      setOrders(orders.filter(order => !ids.includes(order.id)));
      toast({
        title: 'Успех',
        description: `${ids.length} поръчки бяха изтрити`,
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно изтриване на поръчките',
        variant: 'destructive',
      });
    }
  };

  const updateOrder = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          code: order.code,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          is_correct: order.is_correct,
          phone: order.phone,
          total_price: order.total_price,
          product_name: order.product_name,
          catalog_number: order.catalog_number,
          quantity: order.quantity,
          delivery_address: order.delivery_address,
          courier_tracking_url: order.courier_tracking_url,
          status: order.status,
          comment: order.comment,
          source: order.source,
        })
        .eq('id', order.id);

      if (error) throw error;

      setOrders(orders.map(o => o.id === order.id ? order : o));
      toast({
        title: 'Успех',
        description: 'Поръчката беше обновена',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно обновяване на поръчката',
        variant: 'destructive',
      });
    }
  };

  const updateOrdersStatus = async (ids: number[], status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', ids);

      if (error) throw error;

      setOrders(orders.map(o => ids.includes(o.id) ? { ...o, status: status as Order['status'] } : o));
      toast({
        title: 'Успех',
        description: `Статусът на ${ids.length} поръчки беше променен`,
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешна промяна на статуса',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, deleteOrder, deleteOrders, updateOrder, updateOrdersStatus, refetch: fetchOrders };
};
