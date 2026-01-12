import { useMemo, useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Euro,
  FileText,
  Receipt,
  CalendarDays
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface OrderStatisticsProps {
  orders: Order[];
}

interface InvoiceStats {
  totalCount: number;
  totalAmount: number;
  lastInvoice: {
    number: number;
    date: string;
    amount: number;
    buyerName: string;
  } | null;
  todayCount: number;
  monthCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  'Нова': '#3b82f6',
  'В обработка': '#f59e0b',
  'Потвърдена': '#22c55e',
  'Изпратена': '#8b5cf6',
  'Доставена': '#10b981',
  'Отказана': '#ef4444',
  'Върната': '#f97316',
  'Приключена': '#06b6d4',
};

export const OrderStatistics = ({ orders }: OrderStatisticsProps) => {
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
    totalCount: 0,
    totalAmount: 0,
    lastInvoice: null,
    todayCount: 0,
    monthCount: 0
  });

  // Fetch invoice statistics
  useEffect(() => {
    const fetchInvoiceStats = async () => {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all invoices
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (invoices && invoices.length > 0) {
          const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
          const todayCount = invoices.filter(inv => new Date(inv.created_at) >= today).length;
          const monthCount = invoices.filter(inv => new Date(inv.created_at) >= monthStart).length;
          
          const lastInv = invoices[0];
          
          setInvoiceStats({
            totalCount: invoices.length,
            totalAmount,
            lastInvoice: {
              number: lastInv.invoice_number,
              date: lastInv.issue_date,
              amount: Number(lastInv.total_amount),
              buyerName: lastInv.buyer_name
            },
            todayCount,
            monthCount
          });
        }
      } catch (err) {
        console.error('Error fetching invoice stats:', err);
      }
    };

    fetchInvoiceStats();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count by status
    const newOrders = orders.filter(o => o.status === 'Нова').length;
    const activeOrders = orders.filter(o => 
      ['В обработка', 'Потвърдена', 'Изпратена', 'Неуспешна връзка'].includes(o.status)
    ).length;
    const completedOrders = orders.filter(o => 
      ['Доставена', 'Завършена', 'Приключена'].includes(o.status)
    ).length;
    const cancelledOrders = orders.filter(o => 
      ['Отказана', 'Върната', 'Анулирана'].includes(o.status)
    ).length;

    // Average processing time (from creation to completion)
    const completedWithTime = orders.filter(o => 
      ['Доставена', 'Завършена', 'Приключена'].includes(o.status)
    );
    const avgProcessingHours = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, o) => {
          const created = new Date(o.created_at);
          const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
          return sum + diff;
        }, 0) / completedWithTime.length
      : 0;

    // Overdue orders (new orders older than 48 hours)
    const overdueOrders = orders.filter(o => {
      if (o.status !== 'Нова') return false;
      const created = new Date(o.created_at);
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation > 48;
    }).length;

    // Total values by period
    const todayValue = orders
      .filter(o => new Date(o.created_at) >= today)
      .reduce((sum, o) => sum + Number(o.total_price), 0);
    
    const weekValue = orders
      .filter(o => new Date(o.created_at) >= weekAgo)
      .reduce((sum, o) => sum + Number(o.total_price), 0);
    
    const monthValue = orders
      .filter(o => new Date(o.created_at) >= monthAgo)
      .reduce((sum, o) => sum + Number(o.total_price), 0);

    // Status distribution for charts
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || '#6b7280'
    }));

    return {
      newOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      avgProcessingHours,
      overdueOrders,
      todayValue,
      weekValue,
      monthValue,
      statusData
    };
  }, [orders]);

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} €`;
  };

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}ч`;
    }
    return `${Math.round(hours / 24)}д`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Нови</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newOrders}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Активни</p>
                <p className="text-2xl font-bold text-amber-600">{stats.activeOrders}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Завършени</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completedOrders}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Отказани</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Средно време за обработка</p>
                <p className="text-xl font-bold text-purple-600">{formatHours(stats.avgProcessingHours)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.overdueOrders > 0 ? 'from-orange-500/10 to-orange-600/5 border-orange-500/20' : 'from-gray-500/10 to-gray-600/5 border-gray-500/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stats.overdueOrders > 0 ? 'bg-orange-500/20' : 'bg-gray-500/20'} flex items-center justify-center`}>
                <AlertTriangle className={`w-6 h-6 ${stats.overdueOrders > 0 ? 'text-orange-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Просрочени поръчки</p>
                <p className={`text-xl font-bold ${stats.overdueOrders > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {stats.overdueOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Общо поръчки</p>
                <p className="text-xl font-bold text-cyan-600">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="w-4 h-4 text-green-600" />
              Днес
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayValue)}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="w-4 h-4 text-blue-600" />
              Тази седмица
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.weekValue)}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="w-4 h-4 text-purple-600" />
              Този месец
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.monthValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Общо фактури</p>
                <p className="text-2xl font-bold text-indigo-600">{invoiceStats.totalCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Обща сума фактури</p>
                <p className="text-2xl font-bold text-teal-600">{formatCurrency(invoiceStats.totalAmount)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Фактури този месец</p>
                <p className="text-2xl font-bold text-rose-600">{invoiceStats.monthCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-medium">Последна фактура</p>
              {invoiceStats.lastInvoice ? (
                <>
                  <p className="text-lg font-bold text-violet-600">№ {invoiceStats.lastInvoice.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(invoiceStats.lastInvoice.date), 'dd.MM.yyyy')} • {formatCurrency(invoiceStats.lastInvoice.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={invoiceStats.lastInvoice.buyerName}>
                    {invoiceStats.lastInvoice.buyerName}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Няма издадени</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Разпределение по статус (Bar)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} поръчки`, 'Брой']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Разпределение по статус (Pie)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [`${value} поръчки`, name]}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
