import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InventoryProduct } from '@/types/inventory';
import { useDebounce } from '@/hooks/useDebounce';

export type ProductSortKey = 'name' | 'sku' | 'current_stock' | 'purchase_price' | 'sale_price' | 'category';

export function useProductsPage(pageSize = 50) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<ProductSortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('inventory_products')
        .select(`
          *,
          category:inventory_categories(*),
          unit:units_of_measure(*)
        `, { count: 'exact' });

      // Server-side search
      if (debouncedSearch.trim()) {
        const s = debouncedSearch.trim();
        query = query.or(`name.ilike.%${s}%,sku.ilike.%${s}%,barcode.ilike.%${s}%`);
      }

      // Server-side sort
      const sortColumn = sortKey === 'category' ? 'category_id' : sortKey;
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

      // Pagination
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setProducts(data as unknown as InventoryProduct[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching products page:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortKey, sortDirection]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Reset page on search/sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey, sortDirection]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (key: ProductSortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return {
    products,
    totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    search,
    setSearch,
    sortKey,
    sortDirection,
    handleSort,
    loading,
    refetch: fetchPage,
  };
}
