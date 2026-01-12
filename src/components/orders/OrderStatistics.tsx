import { useMemo, useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  CalendarDays,
  Download,
  Calendar as CalendarIcon,
  X
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
import { format, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { bg } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface OrderStatisticsProps {
  orders: Order[];
}

interface Invoice {
  id: string;
  invoice_number: number;
  issue_date: string;
  created_at: string;
  buyer_name: string;
  buyer_address: string | null;
  buyer_eik: string | null;
  buyer_vat_number: string | null;
  product_description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  vat_amount: number | null;
  total_amount: number;
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
  filteredInvoices: Invoice[];
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
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [invoiceDateFrom, setInvoiceDateFrom] = useState<Date | undefined>();
  const [invoiceDateTo, setInvoiceDateTo] = useState<Date | undefined>();
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
    totalCount: 0,
    totalAmount: 0,
    lastInvoice: null,
    todayCount: 0,
    monthCount: 0,
    filteredInvoices: []
  });

  // Fetch all invoices
  useEffect(() => {
    const fetchAllInvoices = async () => {
      try {
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (invoices) {
          setAllInvoices(invoices as Invoice[]);
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
      }
    };

    fetchAllInvoices();
  }, []);

  // Calculate stats based on filters
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Apply date filters
    let filtered = allInvoices;
    if (invoiceDateFrom) {
      filtered = filtered.filter(inv => new Date(inv.issue_date) >= invoiceDateFrom);
    }
    if (invoiceDateTo) {
      const endDate = new Date(invoiceDateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => new Date(inv.issue_date) <= endDate);
    }

    const totalAmount = filtered.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const todayCount = allInvoices.filter(inv => new Date(inv.created_at) >= today).length;
    const monthCount = allInvoices.filter(inv => new Date(inv.created_at) >= monthStart).length;
    
    const lastInv = allInvoices[0];
    
    setInvoiceStats({
      totalCount: filtered.length,
      totalAmount,
      lastInvoice: lastInv ? {
        number: lastInv.invoice_number,
        date: lastInv.issue_date,
        amount: Number(lastInv.total_amount),
        buyerName: lastInv.buyer_name
      } : null,
      todayCount,
      monthCount,
      filteredInvoices: filtered
    });
  }, [allInvoices, invoiceDateFrom, invoiceDateTo]);

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

  // Export invoices to CSV
  const exportInvoicesToCSV = (invoices: Invoice[]) => {
    if (invoices.length === 0) {
      return;
    }

    const headers = ['№ Фактура', 'Дата', 'Купувач', 'ЕИК', 'ДДС №', 'Адрес', 'Описание', 'Количество', 'Ед. цена', 'Стойност', 'ДДС', 'Общо'];
    const rows = invoices.map(inv => [
      inv.invoice_number,
      format(new Date(inv.issue_date), 'dd.MM.yyyy'),
      inv.buyer_name,
      inv.buyer_eik || '',
      inv.buyer_vat_number || '',
      inv.buyer_address || '',
      inv.product_description,
      inv.quantity,
      inv.unit_price.toFixed(2),
      inv.subtotal.toFixed(2),
      (inv.vat_amount || 0).toFixed(2),
      inv.total_amount.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export invoices to Excel
  const exportInvoicesToExcel = (invoices: Invoice[]) => {
    if (invoices.length === 0) {
      return;
    }

    const data = invoices.map(inv => ({
      '№ Фактура': inv.invoice_number,
      'Дата': format(new Date(inv.issue_date), 'dd.MM.yyyy'),
      'Купувач': inv.buyer_name,
      'ЕИК': inv.buyer_eik || '',
      'ДДС №': inv.buyer_vat_number || '',
      'Адрес': inv.buyer_address || '',
      'Описание': inv.product_description,
      'Количество': inv.quantity,
      'Ед. цена': inv.unit_price,
      'Стойност': inv.subtotal,
      'ДДС': inv.vat_amount || 0,
      'Общо': inv.total_amount
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Фактури');
    XLSX.writeFile(wb, `invoices_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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

      {/* Invoice Statistics with Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Статистика на фактурите
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Date From Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">От:</span>
                    {invoiceDateFrom ? format(invoiceDateFrom, 'dd.MM.yy') : 'Начало'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={invoiceDateFrom}
                    onSelect={setInvoiceDateFrom}
                    initialFocus
                    locale={bg}
                  />
                </PopoverContent>
              </Popover>

              {/* Date To Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">До:</span>
                    {invoiceDateTo ? format(invoiceDateTo, 'dd.MM.yy') : 'Край'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={invoiceDateTo}
                    onSelect={setInvoiceDateTo}
                    initialFocus
                    locale={bg}
                  />
                </PopoverContent>
              </Popover>

              {/* Quick filters */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  const now = new Date();
                  setInvoiceDateFrom(startOfMonth(now));
                  setInvoiceDateTo(endOfMonth(now));
                }}
              >
                Този месец
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  const now = new Date();
                  setInvoiceDateFrom(startOfMonth(subMonths(now, 1)));
                  setInvoiceDateTo(endOfMonth(subMonths(now, 1)));
                }}
              >
                Миналия месец
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  const now = new Date();
                  setInvoiceDateFrom(startOfYear(now));
                  setInvoiceDateTo(undefined);
                }}
              >
                Тази година
              </Button>

              {/* Clear filters */}
              {(invoiceDateFrom || invoiceDateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive"
                  onClick={() => {
                    setInvoiceDateFrom(undefined);
                    setInvoiceDateTo(undefined);
                  }}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Изчисти
                </Button>
              )}

              {/* Export buttons */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-8"
                onClick={() => exportInvoicesToCSV(invoiceStats.filteredInvoices)}
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-8"
                onClick={() => exportInvoicesToExcel(invoiceStats.filteredInvoices)}
              >
                <Download className="w-3.5 h-3.5" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {(invoiceDateFrom || invoiceDateTo) ? 'Филтрирани' : 'Общо'} фактури
                  </p>
                  <p className="text-xl font-bold text-indigo-600">{invoiceStats.totalCount}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {(invoiceDateFrom || invoiceDateTo) ? 'Сума (филтър)' : 'Обща сума'}
                  </p>
                  <p className="text-xl font-bold text-teal-600">{formatCurrency(invoiceStats.totalAmount)}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Euro className="w-4 h-4 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Този месец</p>
                  <p className="text-xl font-bold text-rose-600">{invoiceStats.monthCount}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-rose-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-lg p-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Последна фактура</p>
                {invoiceStats.lastInvoice ? (
                  <>
                    <p className="text-lg font-bold text-violet-600">№ {invoiceStats.lastInvoice.number}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(invoiceStats.lastInvoice.date), 'dd.MM.yyyy')} • {formatCurrency(invoiceStats.lastInvoice.amount)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Няма издадени</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
