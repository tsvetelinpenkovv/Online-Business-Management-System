import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/order';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Default statuses
const DEFAULT_SHIPPED_STATUS = 'Изпратена';
const DEFAULT_CANCELLED_STATUS = 'Отказана';
const DEFAULT_RESERVE_STATUS = 'В обработка';

 // Track processed orders to avoid double-processing
 const processedShipments = new Set<number>();
 const processedCancellations = new Set<number>();

interface StockSettings {
  deductionStatus: string;
  restoreStatus: string;
  reserveStatus: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockSettings, setStockSettings] = useState<StockSettings>({
    deductionStatus: DEFAULT_SHIPPED_STATUS,
    restoreStatus: DEFAULT_CANCELLED_STATUS,
    reserveStatus: DEFAULT_RESERVE_STATUS,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Audit log helper
  const logAuditAction = useCallback(async (
    action: string, 
    tableName: string, 
    recordId: string, 
    oldData?: Record<string, any>, 
    newData?: Record<string, any>
  ) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData || null,
        new_data: newData || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
    } catch (err) {
      console.error('Error logging audit action:', err);
    }
  }, [user]);

  // Load stock settings from database
  const loadStockSettings = useCallback(async () => {
    try {
    const { data } = await supabase
      .from('api_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['stock_deduction_status', 'stock_restore_status', 'stock_reserve_status']);
    
    if (data) {
      const settings: StockSettings = {
        deductionStatus: DEFAULT_SHIPPED_STATUS,
        restoreStatus: DEFAULT_CANCELLED_STATUS,
        reserveStatus: DEFAULT_RESERVE_STATUS,
      };
      data.forEach(item => {
        if (item.setting_key === 'stock_deduction_status' && item.setting_value) {
          settings.deductionStatus = item.setting_value;
        }
        if (item.setting_key === 'stock_restore_status' && item.setting_value) {
          settings.restoreStatus = item.setting_value;
        }
        if (item.setting_key === 'stock_reserve_status' && item.setting_value) {
          settings.reserveStatus = item.setting_value;
        }
      });
      setStockSettings(settings);
    }
    } catch (err) {
      console.error('Error loading stock settings:', err);
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
      // Get order data before deleting for audit log
      const orderToDelete = orders.find(o => o.id === id);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log deletion to audit
      if (orderToDelete) {
        await logAuditAction('delete', 'orders', id.toString(), orderToDelete, null);
      }

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
      // Get orders to delete for audit log
      const ordersToDelete = orders.filter(o => ids.includes(o.id));

      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Log bulk deletion to audit
      for (const order of ordersToDelete) {
        await logAuditAction('delete', 'orders', order.id.toString(), order, null);
      }

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

  // Find product by SKU, barcode, or name
  const findProduct = async (catalogNumber: string | null, productName: string) => {
    let product = null;
    
    // First try by catalog number (SKU or barcode)
    if (catalogNumber) {
      // Handle multiple catalog numbers separated by comma
      const catalogNumbers = catalogNumber.split(',').map(c => c.trim()).filter(Boolean);
      
      for (const catNum of catalogNumbers) {
        const { data } = await supabase
          .from('inventory_products')
          .select('id, current_stock, reserved_stock, name, is_bundle')
          .or(`sku.eq.${catNum},barcode.eq.${catNum}`)
          .maybeSingle();
        if (data) {
          product = data;
          break;
        }
      }
    }
    
    // If not found by catalog number, try by SKU directly from product name
    // Sometimes product_name contains the SKU (e.g., "BST551516 (x2)")
    if (!product && productName) {
      // Extract potential SKU from product name (first word or alphanumeric code)
      const skuMatch = productName.match(/^([A-Z0-9-]+)/i);
      if (skuMatch) {
        const potentialSku = skuMatch[1];
        const { data } = await supabase
          .from('inventory_products')
          .select('id, current_stock, reserved_stock, name, is_bundle')
          .or(`sku.eq.${potentialSku},barcode.eq.${potentialSku}`)
          .maybeSingle();
        if (data) {
          product = data;
        }
      }
    }
    
    // Finally, try by name similarity
    if (!product && productName) {
      // Clean up product name (remove quantity indicators like "(x2)")
      const cleanName = productName.replace(/\s*\(x\d+\)\s*/gi, '').trim();
      const { data } = await supabase
        .from('inventory_products')
        .select('id, current_stock, reserved_stock, name, is_bundle')
        .ilike('name', `%${cleanName}%`)
        .limit(1)
        .maybeSingle();
      product = data;
    }
    
    return product;
  };

  // Process order items (for orders with multiple products)
  const processOrderItems = async (orderId: number, operation: 'deduct' | 'restore' | 'reserve' | 'unreserve') => {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (!orderItems || orderItems.length === 0) return [];
    
    const results = [];
    for (const item of orderItems) {
      const product = await findProduct(item.catalog_number, item.product_name);
      if (product) {
        const result = await processProductStock(product, item.quantity, operation, `Поръчка артикул: ${item.product_name}`);
        results.push({ ...result, itemName: item.product_name });
      }
    }
    return results;
  };

  // Process stock for a single product
  const processProductStock = async (
    product: { id: string; current_stock: number; reserved_stock: number; name: string; is_bundle: boolean },
    quantity: number,
    operation: 'deduct' | 'restore' | 'reserve' | 'unreserve',
    reason: string
  ) => {
    try {
      const stockBefore = product.current_stock;
      
      if (operation === 'deduct') {
        const stockAfter = stockBefore - quantity;
        
        // Create stock movement - trigger will handle bundle components
        await supabase.from('stock_movements').insert({
          product_id: product.id,
          movement_type: 'out',
          quantity: quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: reason,
        });

        // Update product stock and clear reservation
        await supabase
          .from('inventory_products')
          .update({ 
            current_stock: stockAfter,
            reserved_stock: Math.max(0, (product.reserved_stock || 0) - quantity)
          })
          .eq('id', product.id);

        return { success: true, productName: product.name, quantity, operation };
      }
      
      if (operation === 'restore') {
        const stockAfter = stockBefore + quantity;
        
        // Create return movement
        await supabase.from('stock_movements').insert({
          product_id: product.id,
          movement_type: 'return',
          quantity: quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: reason,
        });

        await supabase
          .from('inventory_products')
          .update({ current_stock: stockAfter })
          .eq('id', product.id);

        return { success: true, productName: product.name, quantity, operation };
      }
      
      if (operation === 'reserve') {
        await supabase
          .from('inventory_products')
          .update({ reserved_stock: (product.reserved_stock || 0) + quantity })
          .eq('id', product.id);
        return { success: true, productName: product.name, quantity, operation };
      }
      
      if (operation === 'unreserve') {
        await supabase
          .from('inventory_products')
          .update({ reserved_stock: Math.max(0, (product.reserved_stock || 0) - quantity) })
          .eq('id', product.id);
        return { success: true, productName: product.name, quantity, operation };
      }

      return { success: false, reason: 'unknown_operation' };
    } catch (error) {
      console.error('Error processing stock:', error);
      return { success: false, reason: 'error' };
    }
  };

  // Main function to handle stock for an order
  const handleOrderStock = async (order: Order, operation: 'deduct' | 'restore' | 'reserve' | 'unreserve') => {
    try {
      // First, check if order has multiple items
      const itemResults = await processOrderItems(order.id, operation);
      
      if (itemResults.length > 0) {
        const successCount = itemResults.filter(r => r.success).length;
        return { 
          success: successCount > 0, 
          processedItems: successCount,
          totalItems: itemResults.length,
          isMultiItem: true
        };
      }
      
      // If no order_items, use the main order product
      const product = await findProduct(order.catalog_number, order.product_name);
      
      if (!product) {
        console.log(`Продуктът "${order.product_name}" не е намерен в склада`);
        return { success: false, reason: 'not_found' };
      }

      const quantity = order.quantity || 1;
      const reason = `Поръчка #${order.code} - ${order.customer_name}`;
      
      const result = await processProductStock(product, quantity, operation, reason);
      return result;
    } catch (error) {
      console.error('Error handling order stock:', error);
      return { success: false, reason: 'error' };
    }
  };

  // Reserve stock when order is created
  const reserveStockForOrder = async (order: Order) => {
    const result = await handleOrderStock(order, 'reserve');
    if (result.success) {
      console.log(`Reserved stock for order ${order.code}`);
    }
    return result;
  };

  // Deduct stock when order is shipped
  const deductStockForOrder = async (order: Order) => {
    const result = await handleOrderStock(order, 'deduct');
    
    // Mark order as stock deducted
    if (result.success) {
      await supabase
        .from('orders')
        .update({ stock_deducted: true })
        .eq('id', order.id);
    }
    
    return result;
  };

  // Restore stock when order is cancelled
  const restoreStockForOrder = async (order: Order) => {
    // Only restore if stock was already deducted
    const { data: orderData } = await supabase
      .from('orders')
      .select('stock_deducted')
      .eq('id', order.id)
      .single();
    
    if (!orderData?.stock_deducted) {
      // If stock wasn't deducted, just unreserve
      return handleOrderStock(order, 'unreserve');
    }
    
    const result = await handleOrderStock(order, 'restore');
    
    if (result.success) {
      await supabase
        .from('orders')
        .update({ stock_deducted: false })
        .eq('id', order.id);
    }
    
    return result;
  };

  const updateOrder = async (order: Order) => {
    try {
      const oldOrder = orders.find(o => o.id === order.id);
      const isBeingShipped = oldOrder && oldOrder.status !== stockSettings.deductionStatus && order.status === stockSettings.deductionStatus;
      const isBeingCancelled = oldOrder && oldOrder.status !== stockSettings.restoreStatus && order.status === stockSettings.restoreStatus;
      const isBeingReserved = oldOrder && oldOrder.status !== stockSettings.reserveStatus && order.status === stockSettings.reserveStatus;

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

      // Handle stock reservation when status changes to reserve status
      if (isBeingReserved) {
        const result = await reserveStockForOrder(order);
        if (result.success) {
          if ('isMultiItem' in result && result.isMultiItem) {
            toast({
              title: 'Резервация',
              description: `Резервирани наличности за ${result.processedItems}/${result.totalItems} артикула`,
            });
          } else if ('productName' in result) {
            toast({
              title: 'Резервация',
              description: `Резервирани ${result.quantity} бр. от "${result.productName}"`,
            });
          }
        }
      }

      // Handle unreserve when leaving reserve status (but not when shipping or cancelling - those handle their own stock ops)
      const isLeavingReserveStatus = oldOrder && oldOrder.status === stockSettings.reserveStatus && 
        order.status !== stockSettings.reserveStatus && 
        order.status !== stockSettings.deductionStatus && 
        order.status !== stockSettings.restoreStatus;
      
      if (isLeavingReserveStatus) {
        // Unreserve the stock without deducting
        const result = await handleOrderStock(order, 'unreserve');
        if (result.success) {
          toast({
            title: 'Резервация премахната',
            description: 'Резервираната наличност беше освободена',
          });
        }
      }

      // Handle stock deduction when shipped
      if (isBeingShipped) {
        const result = await deductStockForOrder(order);
        if (result.success) {
          if ('isMultiItem' in result && result.isMultiItem) {
            toast({
              title: 'Склад актуализиран',
              description: `Изписани наличности за ${result.processedItems}/${result.totalItems} артикула`,
            });
          } else if ('productName' in result) {
            toast({
              title: 'Склад актуализиран',
              description: `Изписани ${result.quantity} бр. от "${result.productName}"`,
            });
          }
        } else if ('reason' in result && result.reason === 'not_found') {
          toast({
            title: 'Внимание',
            description: `Продуктът "${order.product_name}" не е намерен в склада`,
            variant: 'destructive',
          });
        }
      }

      // Handle stock restoration when cancelled
      if (isBeingCancelled) {
        const result = await restoreStockForOrder(order);
        if (result.success) {
          toast({
            title: 'Склад актуализиран',
            description: 'Наличността беше възстановена',
          });
        }
      }

      // Log status change to audit if status changed
      if (oldOrder && oldOrder.status !== order.status) {
        await logAuditAction(
          'status_change', 
          'orders', 
          order.id.toString(), 
          { status: oldOrder.status }, 
          { status: order.status }
        );
      }

      // Log update to audit
      if (oldOrder) {
        await logAuditAction('update', 'orders', order.id.toString(), oldOrder, order);
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
      const ordersToShip = status === stockSettings.deductionStatus 
        ? orders.filter(o => ids.includes(o.id) && o.status !== stockSettings.deductionStatus)
        : [];
      
      const ordersToCancel = status === stockSettings.restoreStatus
        ? orders.filter(o => ids.includes(o.id) && o.status !== stockSettings.restoreStatus)
        : [];

      const ordersToReserve = status === stockSettings.reserveStatus
        ? orders.filter(o => ids.includes(o.id) && o.status !== stockSettings.reserveStatus)
        : [];

      // Orders leaving reserve status (but not being shipped or cancelled)
      const ordersToUnreserve = status !== stockSettings.reserveStatus && 
        status !== stockSettings.deductionStatus && 
        status !== stockSettings.restoreStatus
        ? orders.filter(o => ids.includes(o.id) && o.status === stockSettings.reserveStatus)
        : [];

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', ids);

      if (error) throw error;

      // Handle stock reservation
      if (ordersToReserve.length > 0) {
        let stockReserved = 0;
        for (const order of ordersToReserve) {
          const result = await reserveStockForOrder(order);
          if (result.success) stockReserved++;
        }
        
        if (stockReserved > 0) {
          toast({
            title: 'Резервация',
            description: `Резервирани наличности за ${stockReserved} поръчки`,
          });
        }
      }

      // Handle unreserving
      if (ordersToUnreserve.length > 0) {
        let stockUnreserved = 0;
        for (const order of ordersToUnreserve) {
          const result = await handleOrderStock(order, 'unreserve');
          if (result.success) stockUnreserved++;
        }
        
        if (stockUnreserved > 0) {
          toast({
            title: 'Резервация премахната',
            description: `Освободени резервации за ${stockUnreserved} поръчки`,
          });
        }
      }

      // Handle stock deduction for shipped orders
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

      // Handle stock restoration for cancelled orders
      if (ordersToCancel.length > 0) {
        let stockRestored = 0;
        for (const order of ordersToCancel) {
          const result = await restoreStockForOrder(order);
          if (result.success) stockRestored++;
        }
        
        if (stockRestored > 0) {
          toast({
            title: 'Склад актуализиран',
            description: `Възстановени наличности за ${stockRestored} поръчки`,
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

  const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          code: orderData.code,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          phone: orderData.phone,
          total_price: orderData.total_price,
          product_name: orderData.product_name,
          catalog_number: orderData.catalog_number,
          quantity: orderData.quantity,
          delivery_address: orderData.delivery_address,
          courier_tracking_url: orderData.courier_tracking_url,
          courier_id: orderData.courier_id,
          status: orderData.status,
          comment: orderData.comment,
          source: orderData.source || 'phone',
          is_correct: orderData.is_correct,
          stock_deducted: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newOrder = data as Order;
      
      // Reserve stock for the new order
      await reserveStockForOrder(newOrder);

      setOrders([newOrder, ...orders]);
      toast({
        title: 'Успех',
        description: 'Поръчката беше създадена',
      });
      return newOrder;
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно създаване на поръчката',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
    loadStockSettings();
  }, [loadStockSettings]);

  return { 
    orders, 
    loading, 
    createOrder, 
    deleteOrder, 
    deleteOrders, 
    updateOrder, 
    updateOrdersStatus, 
    refetch: fetchOrders,
    stockSettings
  };
};
