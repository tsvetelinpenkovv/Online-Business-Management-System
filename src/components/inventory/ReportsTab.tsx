import { FC, useState, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, TrendingUp, Warehouse, Download, FileSpreadsheet,
  ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';
import { MOVEMENT_TYPE_LABELS } from '@/types/inventory';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReportsTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const ReportsTab: FC<ReportsTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState('all');

  const stats = inventory.getInventoryStats();

  // Filter movements by date
  const filteredMovements = useMemo(() => {
    return inventory.movements.filter(m => {
      const movementDate = parseISO(m.created_at);
      return isWithinInterval(movementDate, {
        start: parseISO(dateFrom),
        end: parseISO(dateTo + 'T23:59:59'),
      });
    });
  }, [inventory.movements, dateFrom, dateTo]);

  // Calculate movement stats
  const movementStats = useMemo(() => {
    const inMovements = filteredMovements.filter(m => m.movement_type === 'in' || m.movement_type === 'return');
    const outMovements = filteredMovements.filter(m => m.movement_type === 'out');

    return {
      totalIn: inMovements.reduce((sum, m) => sum + m.quantity, 0),
      totalOut: outMovements.reduce((sum, m) => sum + m.quantity, 0),
      valueIn: inMovements.reduce((sum, m) => sum + m.total_price, 0),
      valueOut: outMovements.reduce((sum, m) => sum + m.total_price, 0),
    };
  }, [filteredMovements]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return inventory.products;
    return inventory.products.filter(p => p.category_id === categoryFilter);
  }, [inventory.products, categoryFilter]);

  // Export to CSV
  const exportToCSV = (type: 'stock' | 'movements') => {
    let csv = '';
    let filename = '';

    if (type === 'stock') {
      csv = 'Код,Наименование,Категория,Наличност,Мерна ед.,Покупна цена,Продажна цена,Стойност\n';
      filteredProducts.forEach(p => {
        csv += `"${p.sku}","${p.name}","${p.category?.name || ''}",${p.current_stock},"${p.unit?.abbreviation || 'бр.'}",${p.purchase_price},${p.sale_price},${(p.current_stock * p.purchase_price).toFixed(2)}\n`;
      });
      filename = `наличности_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else {
      csv = 'Дата,Тип,Артикул,Код,Количество,Преди,След,Ед. цена,Сума\n';
      filteredMovements.forEach(m => {
        csv += `"${format(new Date(m.created_at), 'dd.MM.yyyy HH:mm')}","${MOVEMENT_TYPE_LABELS[m.movement_type]}","${m.product?.name || ''}","${m.product?.sku || ''}",${m.quantity},${m.stock_before},${m.stock_after},${m.unit_price},${m.total_price}\n`;
      });
      filename = `движения_${dateFrom}_${dateTo}.csv`;
    }

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Наличности
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Движения
          </TabsTrigger>
          <TabsTrigger value="value" className="flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            Стойност
          </TabsTrigger>
        </TabsList>

        {/* Stock Report */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Всички категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички категории</SelectItem>
                {inventory.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportToCSV('stock')}>
              <Download className="w-4 h-4 mr-2" />
              Експорт CSV
            </Button>
          </div>

          {/* Stock Report - Mobile Cards */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className={product.current_stock <= product.min_stock_level ? 'border-warning' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <p className="font-medium mt-1 truncate">{product.name}</p>
                        {product.category?.name && (
                          <p className="text-xs text-muted-foreground">{product.category.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Наличност</p>
                        <p className={`font-medium ${product.current_stock <= product.min_stock_level ? 'text-warning' : ''}`}>
                          {product.current_stock} {product.unit?.abbreviation || 'бр.'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Мин.</p>
                        <p className="text-sm text-muted-foreground">{product.min_stock_level}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Покупна</p>
                        <p className="text-sm">{product.purchase_price.toFixed(2)} €</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Стойност</p>
                        <p className="font-medium">{(product.current_stock * product.purchase_price).toFixed(2)} €</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">ОБЩО</span>
                    <span className="font-bold text-lg">
                      {filteredProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0).toFixed(2)} €
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Код</TableHead>
                        <TableHead>Наименование</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead className="text-right">Наличност</TableHead>
                        <TableHead className="text-right">Мин. наличност</TableHead>
                        <TableHead className="text-right">Покупна цена</TableHead>
                        <TableHead className="text-right">Стойност</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id} className={product.current_stock <= product.min_stock_level ? 'bg-warning/10' : ''}>
                          <TableCell className="font-mono">{product.sku}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {product.current_stock} {product.unit?.abbreviation || 'бр.'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {product.min_stock_level}
                          </TableCell>
                          <TableCell className="text-right">{product.purchase_price.toFixed(2)} €</TableCell>
                          <TableCell className="text-right font-medium">
                            {(product.current_stock * product.purchase_price).toFixed(2)} €
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={6}>ОБЩО</TableCell>
                        <TableCell className="text-right">
                          {filteredProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0).toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Movements Report */}
        <TabsContent value="movements" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 items-end">
              <div className="space-y-1">
                <Label>От дата</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>До дата</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => exportToCSV('movements')}>
              <Download className="w-4 h-4 mr-2" />
              Експорт CSV
            </Button>
          </div>

          {/* Movement Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Приход (бр.)</p>
                    <p className="text-2xl font-bold text-success">{movementStats.totalIn}</p>
                  </div>
                  <ArrowDownToLine className="w-8 h-8 text-success opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Приход (€)</p>
                    <p className="text-2xl font-bold text-success">{movementStats.valueIn.toFixed(2)}</p>
                  </div>
                  <ArrowDownToLine className="w-8 h-8 text-success opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Разход (бр.)</p>
                    <p className="text-2xl font-bold text-destructive">{movementStats.totalOut}</p>
                  </div>
                  <ArrowUpFromLine className="w-8 h-8 text-destructive opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Разход (€)</p>
                    <p className="text-2xl font-bold text-destructive">{movementStats.valueOut.toFixed(2)}</p>
                  </div>
                  <ArrowUpFromLine className="w-8 h-8 text-destructive opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movements Report - Mobile Cards */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredMovements.slice(0, 50).map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(m.created_at), 'dd.MM.yyyy HH:mm', { locale: bg })}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{MOVEMENT_TYPE_LABELS[m.movement_type]}</span>
                    </div>
                    <p className="font-medium truncate">{m.product?.name}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <span className={`font-medium ${m.movement_type === 'in' || m.movement_type === 'return' ? 'text-success' : 'text-destructive'}`}>
                        {m.movement_type === 'in' || m.movement_type === 'return' ? '+' : '-'}{m.quantity}
                      </span>
                      <span className="font-medium">{m.total_price.toFixed(2)} €</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Артикул</TableHead>
                        <TableHead className="text-right">Количество</TableHead>
                        <TableHead className="text-right">Сума</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.slice(0, 50).map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm">
                            {format(new Date(m.created_at), 'dd.MM.yyyy HH:mm', { locale: bg })}
                          </TableCell>
                          <TableCell>{MOVEMENT_TYPE_LABELS[m.movement_type]}</TableCell>
                          <TableCell>{m.product?.name}</TableCell>
                          <TableCell className="text-right">
                            <span className={m.movement_type === 'in' || m.movement_type === 'return' ? 'text-success' : 'text-destructive'}>
                              {m.movement_type === 'in' || m.movement_type === 'return' ? '+' : '-'}{m.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{m.total_price.toFixed(2)} €</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Value Report */}
        <TabsContent value="value" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Стойност по покупни цени</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalStockValue.toFixed(2)} €</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Общата стойност на склада изчислена по покупни цени
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Стойност по продажни цени</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalSaleValue.toFixed(2)} €</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Потенциална стойност при продажба на всички наличности
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Потенциална печалба</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success">{stats.potentialProfit.toFixed(2)} €</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Разлика между продажна и покупна стойност
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Value by Category - Mobile Cards */}
          {isMobile ? (
            <div className="space-y-3">
              <p className="font-medium text-sm text-muted-foreground">Стойност по категории</p>
              {inventory.categories.map((cat) => {
                const catProducts = inventory.products.filter(p => p.category_id === cat.id);
                const purchaseValue = catProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
                const saleValue = catProducts.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0);
                const profit = saleValue - purchaseValue;

                return (
                  <Card key={cat.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{cat.name}</p>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{catProducts.length} арт.</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Покупна</p>
                          <p className="font-medium">{purchaseValue.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Продажна</p>
                          <p className="font-medium">{saleValue.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Печалба</p>
                          <p className="font-medium text-success">{profit.toFixed(2)} €</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Uncategorized products */}
              {(() => {
                const uncatProducts = inventory.products.filter(p => !p.category_id);
                if (uncatProducts.length === 0) return null;
                const purchaseValue = uncatProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
                const saleValue = uncatProducts.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0);
                const profit = saleValue - purchaseValue;

                return (
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-muted-foreground">Без категория</p>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{uncatProducts.length} арт.</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Покупна</p>
                          <p className="font-medium">{purchaseValue.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Продажна</p>
                          <p className="font-medium">{saleValue.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Печалба</p>
                          <p className="font-medium text-success">{profit.toFixed(2)} €</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Стойност по категории</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Категория</TableHead>
                        <TableHead className="text-right">Артикули</TableHead>
                        <TableHead className="text-right">Покупна стойност</TableHead>
                        <TableHead className="text-right">Продажна стойност</TableHead>
                        <TableHead className="text-right">Печалба</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.categories.map((cat) => {
                        const catProducts = inventory.products.filter(p => p.category_id === cat.id);
                        const purchaseValue = catProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
                        const saleValue = catProducts.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0);
                        const profit = saleValue - purchaseValue;

                        return (
                          <TableRow key={cat.id}>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            <TableCell className="text-right">{catProducts.length}</TableCell>
                            <TableCell className="text-right">{purchaseValue.toFixed(2)} €</TableCell>
                            <TableCell className="text-right">{saleValue.toFixed(2)} €</TableCell>
                            <TableCell className="text-right text-success">{profit.toFixed(2)} €</TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Uncategorized products */}
                      {(() => {
                        const uncatProducts = inventory.products.filter(p => !p.category_id);
                        if (uncatProducts.length === 0) return null;
                        const purchaseValue = uncatProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
                        const saleValue = uncatProducts.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0);
                        const profit = saleValue - purchaseValue;

                        return (
                          <TableRow>
                            <TableCell className="font-medium text-muted-foreground">Без категория</TableCell>
                            <TableCell className="text-right">{uncatProducts.length}</TableCell>
                            <TableCell className="text-right">{purchaseValue.toFixed(2)} €</TableCell>
                            <TableCell className="text-right">{saleValue.toFixed(2)} €</TableCell>
                            <TableCell className="text-right text-success">{profit.toFixed(2)} €</TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
