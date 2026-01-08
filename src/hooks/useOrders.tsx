import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/order';
import { useToast } from '@/hooks/use-toast';

// Default status that triggers stock deduction
const DEFAULT_SHIPPED_STATUS = 'Изпратена';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippedStatus, setShippedStatus] = useState(DEFAULT_SHIPPED_STATUS);
  const { toast } = useToast();

  // Load the stock deduction status from settings
  const loadShippedStatus = useCallback(async () => {
    const { data } = await supabase
      .from('api_settings')
      .select('setting_value')
      .eq('setting_key', 'stock_deduction_status')
      .single();
    
    if (data?.setting_value) {
      setShippedStatus(data.setting_value);
    }
  }, []);

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

  // Deduct stock when order is shipped
  const deductStockForOrder = async (order: Order) => {
    try {
      // Try to find product by catalog_number (SKU) or by name
      let product = null;
      
      if (order.catalog_number) {
        const { data } = await supabase
          .from('inventory_products')
          .select('id, current_stock, name')
          .or(`sku.eq.${order.catalog_number},barcode.eq.${order.catalog_number}`)
          .single();
        product = data;
      }
      
      // If not found by catalog number, try by product name
      if (!product && order.product_name) {
        const { data } = await supabase
          .from('inventory_products')
          .select('id, current_stock, name')
          .ilike('name', `%${order.product_name}%`)
          .limit(1)
          .single();
        product = data;
      }
      
      if (!product) {
        console.log(`Продуктът "${order.product_name}" не е намерен в склада`);
        return { success: false, reason: 'not_found' };
      }

      const quantity = order.quantity || 1;
      const stockBefore = product.current_stock;
      const stockAfter = stockBefore - quantity;

      // Create stock movement for the dispatch
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: product.id,
          movement_type: 'out',
          quantity: quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: `Поръчка #${order.code} - ${order.customer_name}`,
        });

      if (movementError) throw movementError;

      // Update product stock (the trigger should handle this, but we'll do it explicitly too)
      const { error: updateError } = await supabase
        .from('inventory_products')
        .update({ current_stock: stockAfter })
        .eq('id', product.id);

      if (updateError) throw updateError;

      return { success: true, productName: product.name, quantity };
    } catch (error) {
      console.error('Error deducting stock:', error);
      return { success: false, reason: 'error' };
    }
  };

  const updateOrder = async (order: Order) => {
    try {
      // Check if status is changing to the shipped status
      const oldOrder = orders.find(o => o.id === order.id);
      const isBeingShipped = oldOrder && oldOrder.status !== shippedStatus && order.status === shippedStatus;

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
          courier_id: order.courier_id,
          status: order.status,
          comment: order.comment,
          source: order.source,
        })
        .eq('id', order.id);

      if (error) throw error;

      // Deduct stock if order is being shipped
      if (isBeingShipped) {
        const result = await deductStockForOrder(order);
        if (result.success) {
          toast({
            title: 'Склад актуализиран',
            description: `Изписани ${result.quantity} бр. от "${result.productName}"`,
          });
        } else if (result.reason === 'not_found') {
          toast({
            title: 'Внимание',
            description: `Продуктът "${order.product_name}" не е намерен в склада`,
            variant: 'destructive',
          });
        }
      }

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
      // Get orders that are being shipped
      const ordersToShip = status === shippedStatus 
        ? orders.filter(o => ids.includes(o.id) && o.status !== shippedStatus)
        : [];

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', ids);

      if (error) throw error;

      // Deduct stock for each shipped order
      if (ordersToShip.length > 0) {
        let stockUpdated = 0;
        for (const order of ordersToShip) {
          const result = await deductStockForOrder(order);
          if (result.success) stockUpdated++;
        }
        
        if (stockUpdated > 0) {
          toast({
            title: 'Склад актуализиран',
            description: `Изписани наличности за ${stockUpdated} поръчки`,
          });
        }
      }

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
    loadShippedStatus();
  }, [loadShippedStatus]);

  return { orders, loading, deleteOrder, deleteOrders, updateOrder, updateOrdersStatus, refetch: fetchOrders };
};
