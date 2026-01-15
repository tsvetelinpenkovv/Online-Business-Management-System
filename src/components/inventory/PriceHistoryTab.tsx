import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, TrendingUp, TrendingDown, Minus, Calendar, Package, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface PriceHistory {
  id: string;
  product_id: string;
  field_changed: 'purchase_price' | 'sale_price';
  old_value: number | null;
  new_value: number | null;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

export const PriceHistoryTab = () => {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'purchase_price' | 'sale_price'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch price history
      const { data: historyData, error: historyError } = await supabase
        .from('price_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(500);

      if (historyError) throw historyError;

      const typedHistory = (historyData || []) as PriceHistory[];

      // Get unique product IDs
      const productIds = [...new Set(typedHistory.map(h => h.product_id))];

      // Fetch products
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('inventory_products')
          .select('id, sku, name')
          .in('id', productIds);

        if (productsError) throw productsError;

        const productsMap: Record<string, Product> = {};
        (productsData || []).forEach(p => {
          productsMap[p.id] = p;
        });
        setProducts(productsMap);
      }

      setHistory(typedHistory);
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    let result = [...history];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(h => h.field_changed === filterType);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(h => {
        const product = products[h.product_id];
        return (
          product?.sku.toLowerCase().includes(term) ||
          product?.name.toLowerCase().includes(term)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.changed_at).getTime();
      const dateB = new Date(b.changed_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [history, products, filterType, searchTerm, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayChanges = history.filter(h => new Date(h.changed_at) >= today).length;
    const weekChanges = history.filter(h => new Date(h.changed_at) >= weekAgo).length;
    const monthChanges = history.filter(h => new Date(h.changed_at) >= monthAgo).length;

    const purchasePriceChanges = history.filter(h => h.field_changed === 'purchase_price').length;
    const salePriceChanges = history.filter(h => h.field_changed === 'sale_price').length;

    return {
      todayChanges,
      weekChanges,
      monthChanges,
      purchasePriceChanges,
      salePriceChanges,
      total: history.length,
    };
  }, [history]);

  const getPriceChange = (oldValue: number | null, newValue: number | null) => {
    if (oldValue === null || newValue === null) return null;
    return newValue - oldValue;
  };

  const getPriceChangePercent = (oldValue: number | null, newValue: number | null) => {
    if (oldValue === null || newValue === null || oldValue === 0) return null;
    return ((newValue - oldValue) / oldValue) * 100;
  };

  const renderPriceChange = (oldValue: number | null, newValue: number | null) => {
    const change = getPriceChange(oldValue, newValue);
    const percent = getPriceChangePercent(oldValue, newValue);

    if (change === null) return <Minus className="w-4 h-4 text-muted-foreground" />;

    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingUp className="w-4 h-4" />
          <span>+{change.toFixed(2)} лв</span>
          {percent !== null && (
            <span className="text-xs text-muted-foreground">
              (+{percent.toFixed(1)}%)
            </span>
          )}
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingDown className="w-4 h-4" />
          <span>{change.toFixed(2)} лв</span>
          {percent !== null && (
            <span className="text-xs text-muted-foreground">
              ({percent.toFixed(1)}%)
            </span>
          )}
        </div>
      );
    }

    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.todayChanges}</div>
            <p className="text-xs text-muted-foreground">Днес</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.weekChanges}</div>
            <p className="text-xs text-muted-foreground">Тази седмица</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.monthChanges}</div>
            <p className="text-xs text-muted-foreground">Този месец</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.purchasePriceChanges}</div>
            <p className="text-xs text-muted-foreground">Доставни цени</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.salePriceChanges}</div>
            <p className="text-xs text-muted-foreground">Продажни цени</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Общо промени</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            История на цените
          </CardTitle>
          <CardDescription>
            Проследявайте всички промени на доставни и продажни цени
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Търси по SKU или име на продукт..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички промени</SelectItem>
                <SelectItem value="purchase_price">Доставни цени</SelectItem>
                <SelectItem value="sale_price">Продажни цени</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortOrder === 'desc' ? 'Най-нови' : 'Най-стари'}
            </Button>
          </div>

          {/* Table */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Няма намерени промени на цени</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Продукт</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead className="text-right">Стара цена</TableHead>
                    <TableHead className="text-right">Нова цена</TableHead>
                    <TableHead className="text-right">Промяна</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.slice(0, 100).map((item) => {
                    const product = products[item.product_id];
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(item.changed_at), 'dd.MM.yyyy', { locale: bg })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(item.changed_at), 'HH:mm', { locale: bg })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product?.name || 'Изтрит продукт'}</div>
                          <div className="text-xs text-muted-foreground">{product?.sku || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.field_changed === 'purchase_price' ? 'secondary' : 'default'}>
                            {item.field_changed === 'purchase_price' ? 'Доставна' : 'Продажна'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.old_value !== null ? `${item.old_value.toFixed(2)} лв` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.new_value !== null ? `${item.new_value.toFixed(2)} лв` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderPriceChange(item.old_value, item.new_value)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredHistory.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Показани са първите 100 от {filteredHistory.length} записа
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
