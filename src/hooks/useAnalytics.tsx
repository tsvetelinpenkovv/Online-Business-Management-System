import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
  prevRevenue?: number;
  prevOrders?: number;
}

export interface ProductABC {
  name: string;
  revenue: number;
  quantity: number;
  percentage: number;
  cumulative: number;
  category: 'A' | 'B' | 'C';
}

export interface TopCustomer {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
}

export interface KPIData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  ordersPerDay: number;
  conversionRate: number;
  returnRate: number;
  deliveredCount: number;
  returnedCount: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export const useAnalytics = (dateFrom: string, dateTo: string) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [prevOrders, setPrevOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate previous period
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const periodMs = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - periodMs - 86400000);
      const prevTo = new Date(from.getTime() - 86400000);
      const prevFromStr = prevFrom.toISOString().split('T')[0];
      const prevToStr = prevTo.toISOString().split('T')[0];

      const [ordersRes, prevOrdersRes, customersRes, productsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, customer_name, phone, total_price, product_name, quantity, status, payment_status, source')
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo + 'T23:59:59')
          .order('created_at', { ascending: true }),
        supabase
          .from('orders')
          .select('id, created_at, customer_name, phone, total_price, product_name, quantity, status, payment_status, source')
          .gte('created_at', prevFromStr)
          .lte('created_at', prevToStr + 'T23:59:59'),
        supabase
          .from('customers')
          .select('name, phone, total_orders, total_spent, last_order_date')
          .order('total_spent', { ascending: false })
          .limit(20),
        supabase
          .from('inventory_products')
          .select('name, sale_price, current_stock')
          .eq('is_active', true),
      ]);

      setOrders(ordersRes.data || []);
      setPrevOrders(prevOrdersRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpi = useMemo((): KPIData => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const daysRaw = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 1;
    const ordersPerDay = totalOrders / days;

    const deliveredCount = orders.filter(o => o.status === 'Доставена' || o.status === 'Завършена').length;
    const returnedCount = orders.filter(o => o.status === 'Върната').length;
    const conversionRate = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;
    const returnRate = totalOrders > 0 ? (returnedCount / totalOrders) * 100 : 0;

    // Calculate growth vs previous period
    const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total_price), 0);
    const prevTotal = prevOrders.length;
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth = prevTotal > 0 ? ((totalOrders - prevTotal) / prevTotal) * 100 : 0;

    return {
      totalRevenue, totalOrders, avgOrderValue, ordersPerDay,
      conversionRate, returnRate, deliveredCount, returnedCount,
      revenueGrowth, ordersGrowth,
    };
  }, [orders, prevOrders, dateFrom, dateTo]);

  const dailyRevenue = useMemo((): DailyRevenue[] => {
    // Current period
    const map = new Map<string, { revenue: number; orders: number }>();
    orders.forEach(o => {
      const date = o.created_at.split('T')[0];
      const existing = map.get(date) || { revenue: 0, orders: 0 };
      existing.revenue += Number(o.total_price);
      existing.orders += 1;
      map.set(date, existing);
    });

    // Previous period - map by day offset
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const periodMs = to.getTime() - from.getTime();
    const prevMap = new Map<number, { revenue: number; orders: number }>();
    prevOrders.forEach(o => {
      if (!o.created_at) return;
      const prevDate = new Date(o.created_at);
      const prevFrom = new Date(from.getTime() - periodMs - 86400000);
      const dayOffset = Math.floor((prevDate.getTime() - prevFrom.getTime()) / 86400000);
      const existing = prevMap.get(dayOffset) || { revenue: 0, orders: 0 };
      existing.revenue += Number(o.total_price);
      existing.orders += 1;
      prevMap.set(dayOffset, existing);
    });

    const sorted = Array.from(map.entries())
      .map(([date, data]) => {
        const currentDate = new Date(date);
        const dayOffset = Math.floor((currentDate.getTime() - from.getTime()) / 86400000);
        const prev = prevMap.get(dayOffset);
        return {
          date,
          ...data,
          prevRevenue: prev?.revenue || 0,
          prevOrders: prev?.orders || 0,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return sorted;
  }, [orders, prevOrders, dateFrom, dateTo]);

  const abcAnalysis = useMemo((): ProductABC[] => {
    const productMap = new Map<string, { revenue: number; quantity: number }>();
    orders.forEach(o => {
      const name = o.product_name;
      const existing = productMap.get(name) || { revenue: 0, quantity: 0 };
      existing.revenue += Number(o.total_price);
      existing.quantity += Number(o.quantity);
      productMap.set(name, existing);
    });

    const totalRevenue = Array.from(productMap.values()).reduce((s, p) => s + p.revenue, 0);
    const sorted = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        quantity: data.quantity,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        cumulative: 0,
        category: 'C' as const,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    let cumulative = 0;
    sorted.forEach(item => {
      cumulative += item.percentage;
      item.cumulative = cumulative;
      if (cumulative <= 80) (item as any).category = 'A';
      else if (cumulative <= 95) (item as any).category = 'B';
    });

    return sorted;
  }, [orders]);

  const topCustomers = useMemo((): TopCustomer[] => {
    return customers
      .filter(c => c.total_spent > 0)
      .map(c => ({
        name: c.name,
        phone: c.phone || '',
        totalOrders: c.total_orders || 0,
        totalSpent: Number(c.total_spent) || 0,
        lastOrder: c.last_order_date || '',
      }))
      .slice(0, 10);
  }, [customers]);

  const sourceDistribution = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const source = o.source || 'Неизвестен';
      map.set(source, (map.get(source) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      map.set(o.status, (map.get(o.status) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  return {
    kpi, dailyRevenue, abcAnalysis, topCustomers,
    sourceDistribution, statusDistribution,
    orders, loading, refetch: fetchData,
  };
};
