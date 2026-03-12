import { FC, useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useInventory } from '@/hooks/useInventory';
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, Package, 
  FolderTree, Truck, Loader2, Download, Euro, Percent, Calendar, ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

const formatDateWithYear = (date: Date) => {
  return format(date, 'dd.MM.yy', { locale: bg }) + ' г.';
};

interface ProfitabilityReportProps {
  inventory: ReturnType<typeof useInventory>;
}

interface ProductProfitability {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  margin: number;
  marginPercent: number;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
}

interface CategoryProfitability {
  name: string;
  productCount: number;
  avgMarginPercent: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
}

interface SupplierProfitability {
  id: string;
  name: string;
  productCount: number;
  avgPurchasePrice: number;
  avgMarginPercent: number;
  totalValue: number;
}

export const ProfitabilityReport: FC<ProfitabilityReportProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [orderData, setOrderData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'revenue'>('profit');

  useEffect(() => {
    fetchOrderData();
  }, [dateFrom, dateTo]);

  const fetchOrderData = async () => {
    setLoading(true);
    // Fetch orders with items for the period
    const fromStr = format(dateFrom, 'yyyy-MM-dd');
    const toStr = format(dateTo, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('orders')
      .select('id, total_price, created_at, status, order_items:order_items(product_name, quantity, unit_price, total_price, catalog_number)')
      .gte('created_at', fromStr)
      .lte('created_at', toStr + 'T23:59:59')
      .not('status', 'in', '("Отказана","Върната")');
    
    setOrderData(data || []);
    setLoading(false);
  };

  // Product profitability
  const productProfitability = useMemo<ProductProfitability[]>(() => {
    const productSales = new Map<string, { totalSold: number; totalRevenue: number }>();

    // Aggregate sales from order items
    orderData.forEach(order => {
      (order.order_items || []).forEach((item: any) => {
        // Try to match by catalog_number (SKU) to inventory
        const matchedProduct = inventory.products.find(
          p => p.sku === item.catalog_number || p.name.toLowerCase() === item.product_name?.toLowerCase()
        );
        if (matchedProduct) {
          const existing = productSales.get(matchedProduct.id) || { totalSold: 0, totalRevenue: 0 };
          existing.totalSold += item.quantity || 1;
          existing.totalRevenue += item.total_price || 0;
          productSales.set(matchedProduct.id, existing);
        }
      });
    });

    return inventory.products
      .map(p => {
        const sales = productSales.get(p.id) || { totalSold: 0, totalRevenue: 0 };
        const margin = p.sale_price - p.purchase_price;
        const marginPercent = p.sale_price > 0 ? (margin / p.sale_price) * 100 : 0;
        const totalCost = sales.totalSold * p.purchase_price;
        const totalProfit = sales.totalRevenue - totalCost;

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name || 'Без категория',
          purchasePrice: p.purchase_price,
          salePrice: p.sale_price,
          margin,
          marginPercent,
          totalSold: sales.totalSold,
          totalRevenue: sales.totalRevenue,
          totalCost,
          totalProfit,
        };
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'profit': return b.totalProfit - a.totalProfit;
          case 'margin': return b.marginPercent - a.marginPercent;
          case 'revenue': return b.totalRevenue - a.totalRevenue;
          default: return 0;
        }
      });
  }, [inventory.products, orderData, sortBy]);

  // Category profitability
  const categoryProfitability = useMemo<CategoryProfitability[]>(() => {
    const categoryMap = new Map<string, CategoryProfitability>();
    
    productProfitability.forEach(p => {
      const existing = categoryMap.get(p.category) || {
        name: p.category,
        productCount: 0,
        avgMarginPercent: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
      };
      existing.productCount++;
      existing.totalRevenue += p.totalRevenue;
      existing.totalCost += p.totalCost;
      existing.totalProfit += p.totalProfit;
      categoryMap.set(p.category, existing);
    });

    return Array.from(categoryMap.values())
      .map(c => ({
        ...c,
        avgMarginPercent: c.totalRevenue > 0 ? ((c.totalRevenue - c.totalCost) / c.totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);
  }, [productProfitability]);

  // Supplier profitability
  const supplierProfitability = useMemo<SupplierProfitability[]>(() => {
    // Group products by supplier through batches
    return inventory.suppliers.map(s => {
      const supplierProducts = inventory.products.filter(p => 
        inventory.batches.some(b => b.supplier_id === s.id && b.product_id === p.id)
      );
      const avgPurchasePrice = supplierProducts.length > 0 
        ? supplierProducts.reduce((sum, p) => sum + p.purchase_price, 0) / supplierProducts.length
        : 0;
      const avgSalePrice = supplierProducts.length > 0
        ? supplierProducts.reduce((sum, p) => sum + p.sale_price, 0) / supplierProducts.length
        : 0;
      const avgMarginPercent = avgSalePrice > 0 ? ((avgSalePrice - avgPurchasePrice) / avgSalePrice) * 100 : 0;
      const totalValue = supplierProducts.reduce((sum, p) => sum + p.current_stock * p.purchase_price, 0);

      return {
        id: s.id,
        name: s.name,
        productCount: supplierProducts.length,
        avgPurchasePrice,
        avgMarginPercent,
        totalValue,
      };
    }).filter(s => s.productCount > 0)
      .sort((a, b) => b.avgMarginPercent - a.avgMarginPercent);
  }, [inventory]);

  // Summary
  const summary = useMemo(() => {
    const totalRevenue = productProfitability.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalCost = productProfitability.reduce((sum, p) => sum + p.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    return { totalRevenue, totalCost, totalProfit, avgMargin };
  }, [productProfitability]);

  // Chart data — top 10 by profit
  const chartData = useMemo(() => {
    return productProfitability
      .filter(p => p.totalSold > 0)
      .slice(0, 10)
      .map(p => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
        profit: Math.round(p.totalProfit * 100) / 100,
        revenue: Math.round(p.totalRevenue * 100) / 100,
      }));
  }, [productProfitability]);

  if (loading) {
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
              <Label className="text-xs">От</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">До</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">По печалба</SelectItem>
                <SelectItem value="margin">По марж %</SelectItem>
                <SelectItem value="revenue">По приход</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Euro className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Приход</p>
                <p className="text-xl font-bold">{summary.totalRevenue.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Себестойност</p>
                <p className="text-xl font-bold">{summary.totalCost.toFixed(2)} €</p>
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
                <p className="text-xs text-muted-foreground">Печалба</p>
                <p className={`text-xl font-bold ${summary.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summary.totalProfit.toFixed(2)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Percent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ср. марж</p>
                <p className="text-xl font-bold">{summary.avgMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Топ 10 продукта по печалба
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: isMobile ? 60 : 120 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={isMobile ? 60 : 120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} €`]}
                  />
                  <Bar dataKey="profit" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Печалба">
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: By Product / Category / Supplier */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            По продукт
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            По категория
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            По доставчик
          </TabsTrigger>
        </TabsList>

        {/* By Product */}
        <TabsContent value="products">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Продукт</TableHead>
                      <TableHead className="text-right">Покупна</TableHead>
                      <TableHead className="text-right">Продажна</TableHead>
                      <TableHead className="text-right">Марж %</TableHead>
                      <TableHead className="text-right">Продадени</TableHead>
                      <TableHead className="text-right">Приход</TableHead>
                      <TableHead className="text-right">Печалба</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productProfitability.slice(0, 50).map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{p.purchasePrice.toFixed(2)} €</TableCell>
                        <TableCell className="text-right">{p.salePrice.toFixed(2)} €</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={
                            p.marginPercent >= 30 ? 'bg-success/15 text-success border-success/30' :
                            p.marginPercent >= 15 ? 'bg-warning/15 text-warning border-warning/30' :
                            'bg-destructive/15 text-destructive border-destructive/30'
                          }>
                            {p.marginPercent.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{p.totalSold}</TableCell>
                        <TableCell className="text-right">{p.totalRevenue.toFixed(2)} €</TableCell>
                        <TableCell className={`text-right font-bold ${p.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {p.totalProfit.toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Category */}
        <TabsContent value="categories">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Категория</TableHead>
                    <TableHead className="text-right">Продукти</TableHead>
                    <TableHead className="text-right">Ср. марж %</TableHead>
                    <TableHead className="text-right">Приход</TableHead>
                    <TableHead className="text-right">Себестойност</TableHead>
                    <TableHead className="text-right">Печалба</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProfitability.map(c => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.productCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={
                          c.avgMarginPercent >= 30 ? 'bg-success/15 text-success border-success/30' :
                          c.avgMarginPercent >= 15 ? 'bg-warning/15 text-warning border-warning/30' :
                          'bg-destructive/15 text-destructive border-destructive/30'
                        }>
                          {c.avgMarginPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{c.totalRevenue.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{c.totalCost.toFixed(2)} €</TableCell>
                      <TableCell className={`text-right font-bold ${c.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {c.totalProfit.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Supplier */}
        <TabsContent value="suppliers">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Доставчик</TableHead>
                    <TableHead className="text-right">Продукти</TableHead>
                    <TableHead className="text-right">Ср. покупна</TableHead>
                    <TableHead className="text-right">Ср. марж %</TableHead>
                    <TableHead className="text-right">Стойност на наличност</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierProfitability.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{s.productCount}</TableCell>
                      <TableCell className="text-right">{s.avgPurchasePrice.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={
                          s.avgMarginPercent >= 30 ? 'bg-success/15 text-success border-success/30' :
                          s.avgMarginPercent >= 15 ? 'bg-warning/15 text-warning border-warning/30' :
                          'bg-destructive/15 text-destructive border-destructive/30'
                        }>
                          {s.avgMarginPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{s.totalValue.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
