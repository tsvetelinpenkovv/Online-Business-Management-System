import { FC, useState, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { SortableHeader } from '@/components/ui/sortable-header';
import { 
  Package, TrendingUp, Warehouse, Download, FileSpreadsheet,
  ArrowDownToLine, ArrowUpFromLine, Copy, Check, Barcode, FolderTree, Boxes, Euro, History
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';
import { MOVEMENT_TYPE_LABELS } from '@/types/inventory';
import { useIsMobile } from '@/hooks/use-mobile';

type StockSortKey = 'sku' | 'name' | 'category' | 'current_stock' | 'min_stock_level' | 'purchase_price' | 'value';
type MovementReportSortKey = 'created_at' | 'movement_type' | 'product' | 'quantity' | 'total_price';

interface ReportsTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const ReportsTab: FC<ReportsTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockSortKey, setStockSortKey] = useState<StockSortKey>('name');
  const [stockSortDirection, setStockSortDirection] = useState<'asc' | 'desc'>('asc');
  const [movementSortKey, setMovementSortKey] = useState<MovementReportSortKey>('created_at');
  const [movementSortDirection, setMovementSortDirection] = useState<'asc' | 'desc'>('desc');

  const stats = inventory.getInventoryStats();

  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSku(text);
    setTimeout(() => setCopiedSku(null), 2000);
    toast.success('Код копиран!');
  };

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

  // Filter products by category with sorting
  const filteredProducts = useMemo(() => {
    const filtered = categoryFilter === 'all' 
      ? inventory.products 
      : inventory.products.filter(p => p.category_id === categoryFilter);
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (stockSortKey) {
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
        case 'current_stock':
          comparison = a.current_stock - b.current_stock;
          break;
        case 'min_stock_level':
          comparison = a.min_stock_level - b.min_stock_level;
          break;
        case 'purchase_price':
          comparison = a.purchase_price - b.purchase_price;
          break;
        case 'value':
          comparison = (a.current_stock * a.purchase_price) - (b.current_stock * b.purchase_price);
          break;
      }
      return stockSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [inventory.products, categoryFilter, stockSortKey, stockSortDirection]);

  const handleStockSort = (key: StockSortKey) => {
    if (stockSortKey === key) {
      setStockSortDirection(stockSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setStockSortKey(key);
      setStockSortDirection('asc');
    }
  };

  const handleMovementSort = (key: MovementReportSortKey) => {
    if (movementSortKey === key) {
      setMovementSortDirection(movementSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setMovementSortKey(key);
      setMovementSortDirection('asc');
    }
  };

  const sortedMovements = useMemo(() => {
    return [...filteredMovements].sort((a, b) => {
      let comparison = 0;
      switch (movementSortKey) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'movement_type':
          comparison = a.movement_type.localeCompare(b.movement_type);
          break;
        case 'product':
          comparison = (a.product?.name || '').localeCompare(b.product?.name || '');
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'total_price':
          comparison = a.total_price - b.total_price;
          break;
      }
      return movementSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredMovements, movementSortKey, movementSortDirection]);

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
                    <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {product.sku}
                          </span>
                          <button
                            onClick={() => copyToClipboard(product.sku)}
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                            title="Копирай код"
                          >
                            {copiedSku === product.sku ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                        </div>
                        <p className="font-medium mt-1 truncate">{product.name}</p>
                        {product.category?.name && (
                          <p className="text-xs text-muted-foreground">{product.category.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Наличност</p>
                        <Badge 
                          variant="secondary" 
                          className={`mt-0.5 pointer-events-none ${
                            product.current_stock <= 0 
                              ? 'bg-destructive/15 text-destructive' 
                              : product.current_stock <= product.min_stock_level 
                                ? 'bg-warning/15 text-warning' 
                                : 'bg-info/15 text-info'
                          }`}
                        >
                          {product.current_stock} {product.unit?.abbreviation || 'бр.'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Мин.</p>
                        <Badge variant="outline" className="mt-0.5 pointer-events-none">
                          {product.min_stock_level} бр.
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Покупна</p>
                        <p className="text-sm text-success">{product.purchase_price.toFixed(2)} €</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Стойност</p>
                        <p className="font-medium text-success">{(product.current_stock * product.purchase_price).toFixed(2)} €</p>
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
                        <SortableHeader columnKey="sku" sortKey={stockSortKey} sortDirection={stockSortDirection} onSort={handleStockSort}>
                          <Barcode className="w-4 h-4 text-muted-foreground" />
                          Код
                        </SortableHeader>
                        <SortableHeader columnKey="name" sortKey={stockSortKey} sortDirection={stockSortDirection} onSort={handleStockSort}>
                          <Package className="w-4 h-4 text-muted-foreground" />
                          Наименование
                        </SortableHeader>
                        <SortableHeader columnKey="category" sortKey={stockSortKey} sortDirection={stockSortDirection} onSort={handleStockSort}>
                          <FolderTree className="w-4 h-4 text-muted-foreground" />
                          Категория
                        </SortableHeader>
                        <SortableHeader columnKey="current_stock" sortKey={stockSortKey} sortDirection={stockSortDirection} onSort={handleStockSort} align="right">
                          <Boxes className="w-4 h-4 text-muted-foreground" />
                          Наличност
                        </SortableHeader>
                        <SortableHeader columnKey="min_stock_level" sortKey={stockSortKey} sortDirection={stockSortDirection} onSort={handleStockSort} align="right">
                          Мин. наличност
                        </SortableHeader>
                        <SortableHeader columnKey="purchase_price" sortKey={stockSortKey} sortDirection={stockSortDirection} onSort={handleStockSort} align="right">
                          <Euro className="w-4 h-4 text-muted-foreground" />
                          Покупна цена
                        </SortableHeader>
                        <SortableHeader columnKey="value" sortKey={stockSortKey} sortDirection={stockSortDirection} onSort={handleStockSort} align="right">
                          Стойност
                        </SortableHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id} className={product.current_stock <= product.min_stock_level ? 'bg-warning/10' : ''}>
                          <TableCell className="font-mono">
                            <div className="flex items-center gap-1">
                              <span>{product.sku}</span>
                              <button
                                onClick={() => copyToClipboard(product.sku)}
                                className="p-0.5 hover:bg-muted rounded transition-colors"
                                title="Копирай код"
                              >
                                {copiedSku === product.sku ? (
                                  <Check className="w-3.5 h-3.5 text-success" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant="secondary" 
                              className={`pointer-events-none ${
                                product.current_stock <= 0 
                                  ? 'bg-destructive/15 text-destructive' 
                                  : product.current_stock <= product.min_stock_level 
                                    ? 'bg-warning/15 text-warning' 
                                    : 'bg-info/15 text-info'
                              }`}
                            >
                              {product.current_stock} {product.unit?.abbreviation || 'бр.'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="pointer-events-none">
                              {product.min_stock_level} бр.
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-success">{product.purchase_price.toFixed(2)} €</TableCell>
                          <TableCell className="text-right font-medium text-success">
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

        <TabsContent value="movements" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">От дата</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">До дата</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => exportToCSV('movements')} className="w-full sm:w-auto sm:self-end">
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
                        <SortableHeader columnKey="created_at" sortKey={movementSortKey} sortDirection={movementSortDirection} onSort={handleMovementSort}>
                          <History className="w-4 h-4 text-muted-foreground" />
                          Дата
                        </SortableHeader>
                        <SortableHeader columnKey="movement_type" sortKey={movementSortKey} sortDirection={movementSortDirection} onSort={handleMovementSort}>
                          Тип
                        </SortableHeader>
                        <SortableHeader columnKey="product" sortKey={movementSortKey} sortDirection={movementSortDirection} onSort={handleMovementSort}>
                          <Package className="w-4 h-4 text-muted-foreground" />
                          Артикул
                        </SortableHeader>
                        <SortableHeader columnKey="quantity" sortKey={movementSortKey} sortDirection={movementSortDirection} onSort={handleMovementSort} align="right">
                          Количество
                        </SortableHeader>
                        <SortableHeader columnKey="total_price" sortKey={movementSortKey} sortDirection={movementSortDirection} onSort={handleMovementSort} align="right">
                          <Euro className="w-4 h-4 text-muted-foreground" />
                          Сума
                        </SortableHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMovements.slice(0, 50).map((m) => (
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
