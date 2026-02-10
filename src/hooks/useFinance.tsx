import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderFinance {
  id: number;
  code: string;
  customer_name: string;
  total_price: number;
  payment_status: string;
  paid_amount: number;
  payment_method: string | null;
  payment_date: string | null;
  created_at: string;
  status: string;
  product_name: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
  created_at: string;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalPaid: number;
  totalUnpaid: number;
  totalPartial: number;
  totalExpenses: number;
  profit: number;
  orderCount: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
}

export const EXPENSE_CATEGORIES = [
  { value: 'shipping', label: 'Доставка' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'salary', label: 'Заплати' },
  { value: 'rent', label: 'Наем' },
  { value: 'supplies', label: 'Консумативи' },
  { value: 'returns', label: 'Връщания' },
  { value: 'other', label: 'Други' },
];

export const useFinance = () => {
  const [orders, setOrders] = useState<OrderFinance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, expensesRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, code, customer_name, total_price, payment_status, paid_amount, payment_method, payment_date, created_at, status, product_name')
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .order('expense_date', { ascending: false }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (expensesRes.error) throw expensesRes.error;

      setOrders((ordersRes.data || []) as OrderFinance[]);
      setExpenses(expensesRes.data || []);
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updatePaymentStatus = useCallback(async (orderId: number, status: string, paidAmount: number, method?: string) => {
    try {
      const updateData: any = {
        payment_status: status,
        paid_amount: paidAmount,
      };
      if (method) updateData.payment_method = method;
      if (status === 'paid') updateData.payment_date = new Date().toISOString();

      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));
      toast({ title: 'Успешно', description: 'Статусът на плащане е обновен' });
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message, variant: 'destructive' });
    }
  }, [toast]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single();
      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
      toast({ title: 'Успешно', description: 'Разходът е добавен' });
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message, variant: 'destructive' });
    }
  }, [toast]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Успешно', description: 'Разходът е изтрит' });
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message, variant: 'destructive' });
    }
  }, [toast]);

  const getSummary = useCallback((dateFrom?: string, dateTo?: string): FinanceSummary => {
    let filteredOrders = orders;
    let filteredExpenses = expenses;

    if (dateFrom) {
      filteredOrders = filteredOrders.filter(o => o.created_at >= dateFrom);
      filteredExpenses = filteredExpenses.filter(e => e.expense_date >= dateFrom);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      const toStr = to.toISOString();
      filteredOrders = filteredOrders.filter(o => o.created_at < toStr);
      filteredExpenses = filteredExpenses.filter(e => e.expense_date < dateTo);
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    const totalPaid = filteredOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_price), 0);
    const totalUnpaid = filteredOrders.filter(o => o.payment_status === 'unpaid').reduce((sum, o) => sum + Number(o.total_price), 0);
    const totalPartial = filteredOrders.filter(o => o.payment_status === 'partial').reduce((sum, o) => sum + Number(o.paid_amount), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      totalRevenue,
      totalPaid,
      totalUnpaid,
      totalPartial,
      totalExpenses,
      profit: totalPaid + totalPartial - totalExpenses,
      orderCount: filteredOrders.length,
      paidCount: filteredOrders.filter(o => o.payment_status === 'paid').length,
      unpaidCount: filteredOrders.filter(o => o.payment_status === 'unpaid').length,
      partialCount: filteredOrders.filter(o => o.payment_status === 'partial').length,
    };
  }, [orders, expenses]);

  return {
    orders,
    expenses,
    loading,
    updatePaymentStatus,
    addExpense,
    deleteExpense,
    getSummary,
    refetch: fetchData,
  };
};
