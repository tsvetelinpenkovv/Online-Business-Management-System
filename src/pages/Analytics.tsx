import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { buildPath } from '@/components/SecretPathGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  BarChart3, Users, Package, Percent, Truck, RotateCcw, Loader2, RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

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
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { kpi, dailyRevenue, abcAnalysis, topCustomers, sourceDistribution, statusDistribution, loading, refetch } = useAnalytics(dateFrom, dateTo);

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
    orders: { label: 'Поръчки', color: 'hsl(142, 76%, 36%)' },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/'))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Аналитика
              </h1>
              <p className="text-sm text-muted-foreground">KPI, трендове и ABC анализ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard title="Приходи" value={`${kpi.totalRevenue.toFixed(0)} лв`} icon={DollarSign} trend={kpi.revenueGrowth} />
          <KPICard title="Поръчки" value={String(kpi.totalOrders)} subtitle={`${kpi.ordersPerDay.toFixed(1)} / ден`} icon={ShoppingCart} trend={kpi.ordersGrowth} />
          <KPICard title="Ср. стойност" value={`${kpi.avgOrderValue.toFixed(2)} лв`} icon={TrendingUp} />
          <KPICard title="Конверсия" value={`${kpi.conversionRate.toFixed(1)}%`} subtitle={`${kpi.deliveredCount} доставени`} icon={Percent} />
          <KPICard title="Доставени" value={String(kpi.deliveredCount)} icon={Truck} color="bg-green-500" />
          <KPICard title="Върнати" value={`${kpi.returnRate.toFixed(1)}%`} subtitle={`${kpi.returnedCount} бр.`} icon={RotateCcw} color="bg-destructive" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Приходи по дни</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <AreaChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={v => format(new Date(v), 'dd.MM')} className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Orders per day */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Поръчки по дни</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={v => format(new Date(v), 'dd.MM')} className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
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

        <Tabs defaultValue="abc">
          <TabsList>
            <TabsTrigger value="abc"><Package className="w-4 h-4 mr-1" />ABC Анализ</TabsTrigger>
            <TabsTrigger value="customers"><Users className="w-4 h-4 mr-1" />Топ клиенти</TabsTrigger>
          </TabsList>

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
                        <TableCell className="text-right font-medium">{item.revenue.toFixed(2)} лв</TableCell>
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
                        <TableCell className="text-right font-medium">{c.totalSpent.toFixed(2)} лв</TableCell>
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
