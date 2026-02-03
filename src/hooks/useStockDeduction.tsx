import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockDeductionSettings {
  deduction_status: string;      // Status that triggers stock deduction
  restore_status: string;        // Status that restores stock (returns/cancellation)
  reservation_status: string;    // Status that reserves stock
  auto_deduct_enabled: boolean;  // Whether auto deduction is enabled
}

const DEFAULT_SETTINGS: StockDeductionSettings = {
  deduction_status: 'Изпратена',
  restore_status: 'Върната',
  reservation_status: 'В обработка',
  auto_deduct_enabled: true,
};

export function useStockDeduction() {
  const [settings, setSettings] = useState<StockDeductionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    
    const keys = ['stock_deduction_status', 'stock_restore_status', 'stock_reservation_status', 'stock_auto_deduct_enabled'];
    
    const { data, error } = await supabase
      .from('api_settings')
      .select('setting_key, setting_value')
      .in('setting_key', keys);
    
    if (error) {
      console.error('Error fetching stock deduction settings:', error);
      setLoading(false);
      return;
    }
    
    const settingsMap = data?.reduce((acc, item) => {
      acc[item.setting_key] = item.setting_value;
      return acc;
    }, {} as Record<string, string | null>) || {};
    
    setSettings({
      deduction_status: settingsMap['stock_deduction_status'] || DEFAULT_SETTINGS.deduction_status,
      restore_status: settingsMap['stock_restore_status'] || DEFAULT_SETTINGS.restore_status,
      reservation_status: settingsMap['stock_reservation_status'] || DEFAULT_SETTINGS.reservation_status,
      auto_deduct_enabled: settingsMap['stock_auto_deduct_enabled'] !== 'false',
    });
    
    setLoading(false);
  }, []);

  const updateSettings = async (newSettings: Partial<StockDeductionSettings>) => {
    const updates: { setting_key: string; setting_value: string }[] = [];
    
    if (newSettings.deduction_status !== undefined) {
      updates.push({ setting_key: 'stock_deduction_status', setting_value: newSettings.deduction_status });
    }
    if (newSettings.restore_status !== undefined) {
      updates.push({ setting_key: 'stock_restore_status', setting_value: newSettings.restore_status });
    }
    if (newSettings.reservation_status !== undefined) {
      updates.push({ setting_key: 'stock_reservation_status', setting_value: newSettings.reservation_status });
    }
    if (newSettings.auto_deduct_enabled !== undefined) {
      updates.push({ setting_key: 'stock_auto_deduct_enabled', setting_value: String(newSettings.auto_deduct_enabled) });
    }
    
    for (const update of updates) {
      const { error } = await supabase
        .from('api_settings')
        .upsert(update, { onConflict: 'setting_key' });
      
      if (error) {
        console.error('Error updating stock deduction setting:', error);
        toast({ 
          title: 'Грешка', 
          description: 'Неуспешно запазване на настройките', 
          variant: 'destructive' 
        });
        return false;
      }
    }
    
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast({ title: 'Успех', description: 'Настройките са запазени' });
    return true;
  };

  // Deduct stock for a product based on SKU
  const deductStock = async (sku: string, quantity: number, orderId: number) => {
    if (!settings.auto_deduct_enabled) return false;
    
    // Find product by SKU
    const { data: product, error: productError } = await supabase
      .from('inventory_products')
      .select('id, current_stock, name')
      .eq('sku', sku)
      .maybeSingle();
    
    if (productError || !product) {
      console.log('Product not found for SKU:', sku);
      return false;
    }
    
    // Create stock movement for deduction
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: product.id,
        movement_type: 'out',
        quantity: quantity,
        stock_before: product.current_stock,
        stock_after: product.current_stock - quantity,
        reason: `Автоматично приспадане от поръчка #${orderId}`,
      });
    
    if (movementError) {
      console.error('Error creating stock movement:', movementError);
      return false;
    }
    
    console.log(`Stock deducted for ${product.name}: ${quantity} units`);
    return true;
  };

  // Restore stock for a product (for returns/cancellations)
  const restoreStock = async (sku: string, quantity: number, orderId: number) => {
    if (!settings.auto_deduct_enabled) return false;
    
    const { data: product, error: productError } = await supabase
      .from('inventory_products')
      .select('id, current_stock, name')
      .eq('sku', sku)
      .maybeSingle();
    
    if (productError || !product) {
      console.log('Product not found for SKU:', sku);
      return false;
    }
    
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: product.id,
        movement_type: 'return',
        quantity: quantity,
        stock_before: product.current_stock,
        stock_after: product.current_stock + quantity,
        reason: `Автоматично възстановяване от поръчка #${orderId}`,
      });
    
    if (movementError) {
      console.error('Error creating stock movement:', movementError);
      return false;
    }
    
    console.log(`Stock restored for ${product.name}: ${quantity} units`);
    return true;
  };

  // Reserve stock for a product
  const reserveStock = async (sku: string, quantity: number) => {
    const { data: product, error: productError } = await supabase
      .from('inventory_products')
      .select('id, reserved_stock')
      .eq('sku', sku)
      .maybeSingle();
    
    if (productError || !product) {
      return false;
    }
    
    const { error } = await supabase
      .from('inventory_products')
      .update({ reserved_stock: (product.reserved_stock || 0) + quantity })
      .eq('id', product.id);
    
    return !error;
  };

  // Release reserved stock
  const releaseReservation = async (sku: string, quantity: number) => {
    const { data: product, error: productError } = await supabase
      .from('inventory_products')
      .select('id, reserved_stock')
      .eq('sku', sku)
      .maybeSingle();
    
    if (productError || !product) {
      return false;
    }
    
    const newReserved = Math.max(0, (product.reserved_stock || 0) - quantity);
    
    const { error } = await supabase
      .from('inventory_products')
      .update({ reserved_stock: newReserved })
      .eq('id', product.id);
    
    return !error;
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    deductStock,
    restoreStock,
    reserveStock,
    releaseReservation,
    refresh: fetchSettings,
  };
}
