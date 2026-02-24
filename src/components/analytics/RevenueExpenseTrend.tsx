import { FC, useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Props {
  orders: any[];
  dateFrom: string;
  dateTo: string;
}

export const RevenueExpenseTrend: FC<Props> = ({ orders, dateFrom, dateTo }) => {
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo)
        .order('expense_date');
      if (data) setExpenses(data);
    };
    fetchExpenses();
  }, [dateFrom, dateTo]);

  const trendData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; expenses: number; profit: number }>();
    
    orders.forEach(o => {
      const date = o.created_at.split('T')[0];
      const existing = map.get(date) || { date, revenue: 0, expenses: 0, profit: 0 };
      existing.revenue += Number(o.total_price);
      map.set(date, existing);
    });

    expenses.forEach(e => {
      const date = e.expense_date;
      const existing = map.get(date) || { date, revenue: 0, expenses: 0, profit: 0 };
      existing.expenses += Number(e.amount);
      map.set(date, existing);
    });

    return [...map.values()]
      .map(d => ({ ...d, profit: d.revenue - d.expenses }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [orders, expenses]);

  const totals = useMemo(() => {
    const totalRevenue = trendData.reduce((s, d) => s + d.revenue, 0);
    const totalExpenses = trendData.reduce((s, d) => s + d.expenses, 0);
    return { revenue: totalRevenue, expenses: totalExpenses, profit: totalRevenue - totalExpenses };
  }, [trendData]);

  // Monthly summary
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; expenses: number; profit: number }>();
    trendData.forEach(d => {
      const month = d.date.substring(0, 7);
      const existing = map.get(month) || { month, revenue: 0, expenses: 0, profit: 0 };
      existing.revenue += d.revenue;
      existing.expenses += d.expenses;
      existing.profit += d.revenue - d.expenses;
      map.set(month, existing);
    });
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [trendData]);

  const chartConfig = {
    revenue: { label: 'Приходи', color: 'hsl(142, 76%, 36%)' },
    expenses: { label: 'Разходи', color: 'hsl(0, 84%, 60%)' },
    profit: { label: 'Печалба', color: 'hsl(221, 83%, 53%)' },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Общо приходи</span>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{totals.revenue.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Общо разходи</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{totals.expenses.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Нетна печалба</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totals.profit.toFixed(2)} €
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Приходи vs Разходи (по дни)
            <Badge variant="outline" className="text-[10px]">
              {trendData.length} дни
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickFormatter={v => format(new Date(v), 'dd.MM')} className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.1} strokeWidth={2} name="Приходи" />
              <Area type="monotone" dataKey="expenses" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.1} strokeWidth={2} name="Разходи" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly bars */}
      {monthlyData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Месечен преглед</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Приходи" />
                <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Разходи" />
                <Bar dataKey="profit" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Печалба" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
