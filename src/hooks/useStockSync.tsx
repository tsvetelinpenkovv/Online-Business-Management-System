import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  success: boolean;
  results?: Record<string, boolean>;
  error?: string;
}

export function useStockSync() {
  const { toast } = useToast();

  const syncProductStock = useCallback(async (
    productId: string,
    sku: string,
    productName: string,
    newQuantity: number,
    platform?: string
  ): Promise<SyncResult> => {
    try {
      console.log('Syncing stock:', { productId, sku, productName, newQuantity, platform });

      const { data, error } = await supabase.functions.invoke('sync-stock', {
        body: {
          product_id: productId,
          sku,
          product_name: productName,
          new_quantity: newQuantity,
          platform,
        },
      });

      if (error) {
        console.error('Stock sync error:', error);
        return { success: false, error: error.message };
      }

      console.log('Stock sync result:', data);
      return { success: true, results: data?.results };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестна грешка';
      console.error('Stock sync error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  const syncAfterMovement = useCallback(async (
    productId: string,
    newStockLevel: number
  ) => {
    // Get the product SKU and name
    const { data: product } = await supabase
      .from('inventory_products')
      .select('sku, name')
      .eq('id', productId)
      .maybeSingle();

    if (!product?.sku && !product?.name) {
      console.log('No SKU or name found for product, skipping sync');
      return;
    }

    // Sync to all enabled platforms using SKU or name
    const result = await syncProductStock(productId, product.sku || '', product.name || '', newStockLevel);
    
    if (result.success && result.results) {
      const successfulPlatforms = Object.entries(result.results)
        .filter(([, success]) => success)
        .map(([platform]) => platform);
      
      if (successfulPlatforms.length > 0) {
        toast({
          title: 'Синхронизация',
          description: `Наличността е обновена в: ${successfulPlatforms.join(', ')}`,
        });
      }
    }
  }, [syncProductStock, toast]);

  return {
    syncProductStock,
    syncAfterMovement,
  };
}
