import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReturnItem {
  id: string;
  return_id: string;
  product_name: string;
  catalog_number: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  reason: string | null;
  condition: string;
  restock: boolean;
  created_at: string;
}

export interface Return {
  id: string;
  order_id: number | null;
  customer_name: string;
  customer_phone: string | null;
  status: 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';
  reason: 'defect' | 'wrong_product' | 'not_liked' | 'damaged_delivery' | 'other';
  reason_details: string | null;
  return_type: 'full' | 'partial';
  refund_amount: number;
  refund_method: string | null;
  credit_note_id: string | null;
  stock_restored: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  return_items?: ReturnItem[];
}

export const RETURN_STATUSES = {
  requested: { label: 'Заявена', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Одобрена', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  received: { label: 'Получена', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  rejected: { label: 'Отхвърлена', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { label: 'Възстановена', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

export const RETURN_REASONS = {
  defect: 'Дефект',
  wrong_product: 'Грешен продукт',
  not_liked: 'Не харесва',
  damaged_delivery: 'Повреда при доставка',
  other: 'Друго',
};

export const ITEM_CONDITIONS = {
  good: 'Добро',
  damaged: 'Повредено',
  defective: 'Дефектно',
  used: 'Използвано',
};

export function useReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('returns')
      .select('*, return_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching returns:', error);
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на връщанията', variant: 'destructive' });
    } else {
      setReturns((data as any) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const createReturn = useCallback(async (
    returnData: Omit<Return, 'id' | 'created_at' | 'updated_at' | 'return_items'>,
    items: Omit<ReturnItem, 'id' | 'return_id' | 'created_at'>[]
  ) => {
    const { data, error } = await supabase
      .from('returns')
      .insert(returnData as any)
      .select()
      .single();

    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
      return null;
    }

    if (items.length > 0) {
      const itemsWithReturnId = items.map(item => ({ ...item, return_id: data.id }));
      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(itemsWithReturnId as any);

      if (itemsError) {
        console.error('Error inserting return items:', itemsError);
      }
    }

    toast({ title: 'Успех', description: 'Заявката за връщане е създадена' });
    fetchReturns();
    return data;
  }, [fetchReturns, toast]);

  const updateReturnStatus = useCallback(async (id: string, status: Return['status']) => {
    const { error } = await supabase
      .from('returns')
      .update({ status } as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Успех', description: `Статусът е променен на "${RETURN_STATUSES[status].label}"` });
    fetchReturns();
    return true;
  }, [fetchReturns, toast]);

  const deleteReturn = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('returns')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Изтрито', description: 'Заявката за връщане е изтрита' });
    fetchReturns();
    return true;
  }, [fetchReturns, toast]);

  return { returns, loading, fetchReturns, createReturn, updateReturnStatus, deleteReturn };
}
