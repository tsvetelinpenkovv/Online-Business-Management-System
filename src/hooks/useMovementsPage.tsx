import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockMovement, MovementType } from '@/types/inventory';
import { useDebounce } from '@/hooks/useDebounce';

export type MovementSortKey = 'created_at' | 'movement_type' | 'quantity' | 'stock_before' | 'stock_after' | 'unit_price' | 'total_price';

export function useMovementsPage(pageSize = 50) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<MovementSortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:inventory_products(id, name, sku),
          batch:stock_batches(id, batch_number)
        `, { count: 'exact' });

      // Type filter
      if (typeFilter !== 'all') {
        query = query.eq('movement_type', typeFilter as any);
      }

      // Search - filter by reason (product search requires join filtering which is limited)
      if (debouncedSearch.trim()) {
        query = query.ilike('reason', `%${debouncedSearch.trim()}%`);
      }

      // Sort
      query = query.order(sortKey, { ascending: sortDirection === 'asc' });

      // Pagination
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setMovements(data as unknown as StockMovement[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching movements page:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, typeFilter, sortKey, sortDirection]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, sortKey, sortDirection]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (key: MovementSortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return {
    movements,
    totalCount,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    sortKey,
    sortDirection,
    handleSort,
    loading,
    refetch: fetchPage,
  };
}
