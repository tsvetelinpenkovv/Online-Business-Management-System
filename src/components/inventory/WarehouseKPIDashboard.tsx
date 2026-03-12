import { FC, useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Warehouse, Package, AlertTriangle, TrendingUp, TrendingDown,
  BarChart3, Boxes, Euro, Clock, RotateCcw, Skull, ArrowUpDown,
  Loader2, Calendar, X, ChevronDown
} from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, subDays, differenceInDays } from 'date-fns';
import { bg } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const formatDateWithYear = (date: Date) => {
  return format(date, 'dd.MM.yy', { locale: bg }) + ' г.';
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

export const WarehouseKPIDashboard: FC = () => {
  const isMobile = useIsMobile();
  const inventory = useInventory();
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [movementData, setMovementData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, [dateFrom, dateTo]);

  const fetchMovements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('stock_movements')
      .select('*, product:inventory_products(name, sku, purchase_price, sale_price)')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo + 'T23:59:59')
      .order('created_at', { ascending: false });
    setMovementData(data || []);
    setLoading(false);
  };

  // === KPI Calculations ===

  // 1. Total Stock Value (at purchase price)
  const stockValuePurchase = useMemo(() => 
    inventory.products.reduce((sum, p) => sum + p.current_stock * p.purchase_price, 0),
    [inventory.products]
  );

  // 2. Total Stock Value (at sale price)
  const stockValueSale = useMemo(() => 
    inventory.products.reduce((sum, p) => sum + p.current_stock * p.sale_price, 0),
    [inventory.products]
  );

  // 3. Potential Profit
  const potentialProfit = stockValueSale - stockValuePurchase;

  // 4. Stock Turnover Rate
  const turnoverRate = useMemo(() => {
    const periodDays = differenceInDays(parseISO(dateTo), parseISO(dateFrom)) || 1;
    const totalOutQty = movementData
      .filter(m => m.movement_type === 'out')
      .reduce((sum: number, m: any) => sum + (m.quantity || 0), 0);
    const avgStock = inventory.products.reduce((sum, p) => sum + p.current_stock, 0);
    if (avgStock === 0) return 0;
    return (totalOutQty / avgStock) * (365 / periodDays);
  }, [movementData, inventory.products, dateFrom, dateTo]);

  // 5. Average Days to Sell
  const avgDaysToSell = turnoverRate > 0 ? Math.round(365 / turnoverRate) : 0;

  // 6. Dead Stock (no movement in 90+ days)
  const deadStock = useMemo(() => {
    const productLastMovement = new Map<string, string>();
    movementData.forEach(m => {
      const existing = productLastMovement.get(m.product_id);
      if (!existing || m.created_at > existing) {
        productLastMovement.set(m.product_id, m.created_at);
      }
    });

    const cutoff = subDays(new Date(), 90);
    return inventory.products.filter(p => {
      if (p.current_stock <= 0) return false;
      const lastMove = productLastMovement.get(p.id);
      if (!lastMove) return true; // No movement at all
      return new Date(lastMove) < cutoff;
    });
  }, [inventory.products, movementData]);

  const deadStockValue = deadStock.reduce((sum, p) => sum + p.current_stock * p.purchase_price, 0);

  // 7. Low stock and out of stock
  const lowStockProducts = inventory.products.filter(
    p => p.current_stock > 0 && p.current_stock <= p.min_stock_level
  );
  const outOfStockProducts = inventory.products.filter(p => p.current_stock <= 0 && p.is_active);

  // 8. Movement summary for period
  const movementSummary = useMemo(() => {
    const inQty = movementData.filter(m => m.movement_type === 'in' || m.movement_type === 'return')
      .reduce((sum: number, m: any) => sum + m.quantity, 0);
    const outQty = movementData.filter(m => m.movement_type === 'out')
      .reduce((sum: number, m: any) => sum + m.quantity, 0);
    const inValue = movementData.filter(m => m.movement_type === 'in' || m.movement_type === 'return')
      .reduce((sum: number, m: any) => sum + (m.total_price || 0), 0);
    const outValue = movementData.filter(m => m.movement_type === 'out')
      .reduce((sum: number, m: any) => sum + (m.total_price || 0), 0);
    return { inQty, outQty, inValue, outValue };
  }, [movementData]);

  // 9. Stock distribution by category
  const categoryDistribution = useMemo(() => {
    const catMap = new Map<string, { name: string; value: number; count: number }>();
    inventory.products.forEach(p => {
      const catName = p.category?.name || 'Без категория';
      const existing = catMap.get(catName) || { name: catName, value: 0, count: 0 };
      existing.value += p.current_stock * p.purchase_price;
      existing.count += p.current_stock;
      catMap.set(catName, existing);
    });
    return Array.from(catMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [inventory.products]);

  // 10. Top movers
  const topMovers = useMemo(() => {
    const productMoves = new Map<string, { name: string; sku: string; outQty: number }>();
    movementData.filter(m => m.movement_type === 'out').forEach(m => {
      const key = m.product_id;
      const existing = productMoves.get(key) || {
        name: m.product?.name || 'Неизвестен',
        sku: m.product?.sku || '',
        outQty: 0,
      };
      existing.outQty += m.quantity;
      productMoves.set(key, existing);
    });
    return Array.from(productMoves.values())
      .sort((a, b) => b.outQty - a.outQty)
      .slice(0, 10);
  }, [movementData]);

  if (inventory.loading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> От</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> До</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Euro className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Стойност (покупна)</p>
                <p className="text-xl font-bold">{stockValuePurchase.toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Стойност (продажна)</p>
                <p className="text-xl font-bold text-success">{stockValueSale.toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <RotateCcw className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Оборот (год.)</p>
                <p className="text-xl font-bold">{turnoverRate.toFixed(1)}x</p>
                <p className="text-[10px] text-muted-foreground">~{avgDaysToSell} дни за продажба</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Потенциална печалба</p>
                <p className="text-xl font-bold text-warning">{potentialProfit.toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement & Alert Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <ArrowUpDown className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Приход (период)</p>
                <p className="text-lg font-bold">{movementSummary.inQty} бр.</p>
                <p className="text-[10px] text-muted-foreground">{movementSummary.inValue.toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Разход (период)</p>
                <p className="text-lg font-bold">{movementSummary.outQty} бр.</p>
                <p className="text-[10px] text-muted-foreground">{movementSummary.outValue.toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Skull className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Мъртва наличност</p>
                <p className="text-lg font-bold text-destructive">{deadStock.length} арт.</p>
                <p className="text-[10px] text-muted-foreground">{deadStockValue.toFixed(0)} € блокирани</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Критични</p>
                <p className="text-lg font-bold">
                  <span className="text-warning">{lowStockProducts.length}</span>
                  {' / '}
                  <span className="text-destructive">{outOfStockProducts.length}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">ниски / изчерпани</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
        {/* Category Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Стойност по категории
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 55}
                    outerRadius={isMobile ? 65 : 85}
                    paddingAngle={3}
                    dataKey="value"
                    label={!isMobile ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)` : false}
                    labelLine={!isMobile}
                  >
                    {categoryDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)} €`, 'Стойност']}
                  />
                  {isMobile && <Legend verticalAlign="bottom" height={36} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Movers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4" />
              Най-продавани (период)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMovers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Няма движения за периода</p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMovers} layout="vertical" margin={{ left: isMobile ? 60 : 100 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 11 }} 
                      width={isMobile ? 60 : 100}
                      tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '…' : v}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} бр.`, 'Продадени']}
                    />
                    <Bar dataKey="outQty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Количество" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dead Stock List */}
      {deadStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-destructive" />
              Мъртва наличност (без движение 90+ дни)
            </CardTitle>
            <CardDescription>
              Артикули, които не са имали движения повече от 90 дни. Обмислете промоция или ликвидация.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {deadStock.slice(0, 20).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">
                      {p.current_stock} бр.
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(p.current_stock * p.purchase_price).toFixed(2)} € блокирани
                    </p>
                  </div>
                </div>
              ))}
              {deadStock.length > 20 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ... и още {deadStock.length - 20} артикула
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
