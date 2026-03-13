import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockDocument } from '@/types/inventory';
import { useDebounce } from '@/hooks/useDebounce';

export type DocumentSortKey = 'document_number' | 'document_type' | 'document_date' | 'total_amount';

export function useDocumentsPage(pageSize = 50) {
  const [documents, setDocuments] = useState<StockDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<DocumentSortKey>('document_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('stock_documents')
        .select(`
          *,
          supplier:suppliers(*)
        `, { count: 'exact' });

      if (debouncedSearch.trim()) {
        const s = debouncedSearch.trim();
        query = query.or(`document_number.ilike.%${s}%,counterparty_name.ilike.%${s}%`);
      }

      const sortColumn = sortKey;
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setDocuments(data as unknown as StockDocument[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching documents page:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortKey, sortDirection]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey, sortDirection]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (key: DocumentSortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return {
    documents,
    totalCount,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    sortKey,
    sortDirection,
    handleSort,
    loading,
    refetch: fetchPage,
  };
}
