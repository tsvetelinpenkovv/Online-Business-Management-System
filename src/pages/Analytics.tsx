import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { buildPath } from '@/components/SecretPathGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFlagByCountryCode } from '@/components/orders/StoreFilterTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  BarChart3, Users, Package, Percent, Truck, RotateCcw, Loader2, RefreshCw, Download, FileSpreadsheet, FileText, Filter, Store,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { exportOrdersExcel, exportOrdersPDF } from '@/lib/exportUtils';

const COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)',
  'hsl(263, 70%, 60%)', 'hsl(172, 66%, 40%)', 'hsl(0, 84%, 60%)',
  'hsl(199, 89%, 48%)', 'hsl(340, 82%, 52%)',
];

const ABC_COLORS = { A: 'hsl(142, 76%, 36%)', B: 'hsl(38, 92%, 50%)', C: 'hsl(0, 84%, 60%)' };

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color }: {
  title: string; value: string; subtitle?: string; icon: any; trend?: number; color?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color || 'bg-primary/10'}`}>
          <Icon className={`w-4 h-4 ${color ? 'text-white' : 'text-primary'}`} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {trend !== undefined && trend !== 0 && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </CardContent>
  </Card>
);

const Analytics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { kpi, dailyRevenue, abcAnalysis, topCustomers, sourceDistribution, statusDistribution, storeRevenue, loading, refetch, orders: rawOrders } = useAnalytics(dateFrom, dateTo);

  // Get unique sources and statuses for filter dropdowns
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    rawOrders.forEach(o => { if (o.source) sources.add(o.source); });
    return Array.from(sources).sort();
  }, [rawOrders]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    rawOrders.forEach(o => { if (o.status) statuses.add(o.status); });
    return Array.from(statuses).sort();
  }, [rawOrders]);

  // Filtered orders for display
  const filteredOrders = useMemo(() => {
    return rawOrders.filter(o => {
      if (sourceFilter !== 'all' && o.source !== sourceFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
  }, [rawOrders, sourceFilter, statusFilter]);

  // Recalculate KPIs based on filters
  const filteredKpi = useMemo(() => {
    if (sourceFilter === 'all' && statusFilter === 'all') return kpi;
    const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total_price), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const daysRaw = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 1;
    const deliveredCount = filteredOrders.filter(o => o.status === 'Доставена' || o.status === 'Завършена').length;
    const returnedCount = filteredOrders.filter(o => o.status === 'Върната').length;
    return {
      ...kpi,
      totalRevenue, totalOrders, avgOrderValue,
      ordersPerDay: totalOrders / days,
      conversionRate: totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0,
      returnRate: totalOrders > 0 ? (returnedCount / totalOrders) * 100 : 0,
      deliveredCount, returnedCount,
    };
  }, [kpi, filteredOrders, sourceFilter, statusFilter, dateFrom, dateTo]);

  // Filtered daily revenue
  const filteredDailyRevenue = useMemo(() => {
    if (sourceFilter === 'all' && statusFilter === 'all') return dailyRevenue;
    const map = new Map<string, { revenue: number; orders: number }>();
    filteredOrders.forEach(o => {
      const date = o.created_at.split('T')[0];
      const existing = map.get(date) || { revenue: 0, orders: 0 };
      existing.revenue += Number(o.total_price);
      existing.orders += 1;
      map.set(date, existing);
    });
    return Array.from(map.entries())
      .map(([date, data]) => ({ date, ...data, prevRevenue: 0, prevOrders: 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyRevenue, filteredOrders, sourceFilter, statusFilter]);

  const hasFilters = sourceFilter !== 'all' || statusFilter !== 'all';

  const handleExportExcel = () => {
    const data = hasFilters ? filteredOrders : rawOrders;
    if (data.length === 0) return;
    exportOrdersExcel(data, `аналитика_${dateFrom}_${dateTo}.xlsx`);
  };

  const handleExportPDF = () => {
    const data = hasFilters ? filteredOrders : rawOrders;
    if (data.length === 0) return;
    exportOrdersPDF(data, undefined, dateFrom, dateTo);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) { navigate(buildPath('/auth')); return null; }

  const revenueChartConfig = {
    revenue: { label: 'Приходи', color: 'hsl(221, 83%, 53%)' },
    prevRevenue: { label: 'Предходен период', color: 'hsl(221, 83%, 53%)' },
    orders: { label: 'Поръчки', color: 'hsl(142, 76%, 36%)' },
    prevOrders: { label: 'Предходен период', color: 'hsl(142, 76%, 36%)' },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/'))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Аналитика
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">KPI, трендове и ABC анализ</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[130px] sm:w-36" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[130px] sm:w-36" />
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Експорт Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" /> Експорт PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Източник" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички източници</SelectItem>
              {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              {uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSourceFilter('all'); setStatusFilter('all'); }}>
              Изчисти филтри
            </Button>
          )}
          {hasFilters && (
            <Badge variant="secondary" className="text-xs">{filteredOrders.length} от {rawOrders.length} поръчки</Badge>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard title="Приходи" value={`${filteredKpi.totalRevenue.toFixed(0)} €`} icon={DollarSign} trend={filteredKpi.revenueGrowth} />
          <KPICard title="Поръчки" value={String(filteredKpi.totalOrders)} subtitle={`${filteredKpi.ordersPerDay.toFixed(1)} / ден`} icon={ShoppingCart} trend={filteredKpi.ordersGrowth} />
          <KPICard title="Ср. стойност" value={`${filteredKpi.avgOrderValue.toFixed(2)} €`} icon={TrendingUp} />
          <KPICard title="Конверсия" value={`${filteredKpi.conversionRate.toFixed(1)}%`} subtitle={`${filteredKpi.deliveredCount} доставени`} icon={Percent} />
          <KPICard title="Доставени" value={String(filteredKpi.deliveredCount)} icon={Truck} color="bg-green-500" />
          <KPICard title="Върнати" value={`${filteredKpi.returnRate.toFixed(1)}%`} subtitle={`${filteredKpi.returnedCount} бр.`} icon={RotateCcw} color="bg-destructive" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend with comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Приходи по дни
                {!hasFilters && <Badge variant="outline" className="text-[10px] font-normal">+ предходен период</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <AreaChart data={filteredDailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={v => format(new Date(v), 'dd.MM')} className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {!hasFilters && (
                    <Area type="monotone" dataKey="prevRevenue" stroke="hsl(221, 83%, 73%)" fill="hsl(221, 83%, 73%)" fillOpacity={0.05} strokeWidth={1} strokeDasharray="4 4" name="Предходен период" />
                  )}
                  <Area type="monotone" dataKey="revenue" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.1} strokeWidth={2} name="Текущ период" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Orders per day with comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Поръчки по дни
                {!hasFilters && <Badge variant="outline" className="text-[10px] font-normal">+ предходен период</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <BarChart data={filteredDailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={v => format(new Date(v), 'dd.MM')} className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {!hasFilters && (
                    <Bar dataKey="prevOrders" fill="hsl(142, 76%, 36%)" fillOpacity={0.2} radius={[4, 4, 0, 0]} name="Предходен период" />
                  )}
                  <Bar dataKey="orders" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Текущ период" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Source & Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Източници на поръчки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {sourceDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Статуси на поръчки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusDistribution.slice(0, 8).map((item, i) => {
                  const total = statusDistribution.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm flex-1 truncate">{item.name}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stores">
          <TabsList>
            <TabsTrigger value="stores"><Store className="w-4 h-4 mr-1" />По магазин</TabsTrigger>
            <TabsTrigger value="abc"><Package className="w-4 h-4 mr-1" />ABC Анализ</TabsTrigger>
            <TabsTrigger value="customers"><Users className="w-4 h-4 mr-1" />Топ клиенти</TabsTrigger>
          </TabsList>

          <TabsContent value="stores">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Приходи по магазин
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storeRevenue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Няма данни за магазини в този период</p>
                ) : (
                  <div className="space-y-3">
                    {storeRevenue.map((store, i) => {
                      const maxRevenue = Math.max(...storeRevenue.map(s => s.revenue));
                      const pct = maxRevenue > 0 ? (store.revenue / maxRevenue) * 100 : 0;
                      const FlagComp = getFlagByCountryCode(store.countryCode);
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {FlagComp && <FlagComp className="w-5 h-3.5 rounded-[1px] shadow-sm" />}
                              <span className="font-medium text-sm">{store.storeName}</span>
                              <Badge variant="outline" className="text-xs">{store.currency}</Badge>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-sm">{store.revenue.toFixed(2)} {store.currencySymbol}</span>
                              <span className="text-xs text-muted-foreground ml-2">({store.orders} поръчки)</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abc">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  ABC Анализ на продукти
                  <Badge variant="outline" className="text-xs">A=80% | B=95% | C=100%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Категория</TableHead>
                      <TableHead>Продукт</TableHead>
                      <TableHead className="text-right">Приходи</TableHead>
                      <TableHead className="text-right">Бройки</TableHead>
                      <TableHead className="text-right">% от общо</TableHead>
                      <TableHead className="text-right">Кумулативно</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abcAnalysis.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Няма данни за периода</TableCell></TableRow>
                    ) : abcAnalysis.slice(0, 20).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge style={{ backgroundColor: ABC_COLORS[item.category], color: 'white' }}>
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">{item.name}</TableCell>
                        <TableCell className="text-right font-medium">{item.revenue.toFixed(2)} €</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.cumulative.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Топ 10 клиенти по оборот</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead className="text-right">Поръчки</TableHead>
                      <TableHead className="text-right">Общо харчено</TableHead>
                      <TableHead>Последна поръчка</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Няма данни</TableCell></TableRow>
                    ) : topCustomers.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                        <TableCell className="text-right">{c.totalOrders}</TableCell>
                        <TableCell className="text-right font-medium">{c.totalSpent.toFixed(2)} €</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.lastOrder ? format(new Date(c.lastOrder), 'dd.MM.yyyy') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
