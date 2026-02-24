import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches thumbnail URLs from product_images for a list of product IDs.
 * Returns a map of productId -> thumbnail/original URL.
 */
export function useProductThumbnails(productIds: string[]): Record<string, string> {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productIds.length === 0) {
      setThumbnails({});
      return;
    }

    const fetchThumbnails = async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('product_id, thumbnail_url, cached_url, original_url')
        .in('product_id', productIds)
        .eq('position', 0)
        .limit(productIds.length);

      if (error) {
        console.error('Error fetching thumbnails:', error);
        return;
      }

      const map: Record<string, string> = {};
      data?.forEach((img) => {
        // Prefer thumbnail > cached > original
        map[img.product_id] = img.thumbnail_url || img.cached_url || img.original_url;
      });
      setThumbnails(map);
    };

    fetchThumbnails();
  }, [productIds.join(',')]);

  return thumbnails;
}
