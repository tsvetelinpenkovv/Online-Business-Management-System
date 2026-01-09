import { useState, useMemo } from 'react';
import { format, subDays, differenceInDays, addDays } from 'date-fns';
import { bg } from 'date-fns/locale';
import { CalendarIcon, TrendingUp, Package, ShoppingCart, Download, Copy, Check, X, ChevronDown, FolderTree, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';

type ForecastSortKey = 'name' | 'category' | 'soldQuantity' | 'currentStock' | 'projectedSales' | 'neededQuantity';
type SortDirection = 'asc' | 'desc';

interface ForecastTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const ForecastTab = ({ inventory }: ForecastTabProps) => {
  const today = new Date();
  const defaultHistoryFrom = subDays(today, 30);
  const defaultHistoryTo = today;
  const defaultForecastDate = addDays(today, 30);
  
  const [historyDateFrom, setHistoryDateFrom] = useState<Date | null>(defaultHistoryFrom);
  const [historyDateTo, setHistoryDateTo] = useState<Date | null>(defaultHistoryTo);
  const [forecastDate, setForecastDate] = useState<Date | null>(defaultForecastDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<ForecastSortKey>('neededQuantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  const handleSort = (key: ForecastSortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ columnKey, children, align = 'left' }: { columnKey: ForecastSortKey; children: React.ReactNode; align?: 'left' | 'right' }) => (
    <TableHead 
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(columnKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === columnKey ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  const copyToClipboard = async (sku: string) => {
    await navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    toast({ title: 'Копирано', description: `SKU ${sku} е копиран` });
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const formatDateWithYear = (date: Date | null) => {
    if (!date) return "Избери дата";
    return format(date, "d MMM yyyy", { locale: bg }) + " г.";
  };

  // Calculate sales data for each product
  const forecastData = useMemo(() => {
    const effectiveHistoryFrom = historyDateFrom || defaultHistoryFrom;
    const effectiveHistoryTo = historyDateTo || defaultHistoryTo;
    const effectiveForecastDate = forecastDate || defaultForecastDate;
    
    const historyDays = differenceInDays(effectiveHistoryTo, effectiveHistoryFrom) || 1;
    const forecastDays = differenceInDays(effectiveForecastDate, today);

    const data = inventory.products
      .filter(product => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          (product.barcode && product.barcode.toLowerCase().includes(query))
        );
      })
      .map(product => {
        // Get "out" movements for this product within the history period
        const productMovements = inventory.movements.filter(m => {
          if (m.product_id !== product.id) return false;
          if (m.movement_type !== 'out') return false;
          const moveDate = new Date(m.created_at);
          return moveDate >= effectiveHistoryFrom && moveDate <= effectiveHistoryTo;
        });

        const soldQuantity = productMovements.reduce((sum, m) => sum + Number(m.quantity), 0);
        const dailySalesRate = soldQuantity / historyDays;
        const projectedSales = Math.ceil(dailySalesRate * forecastDays);
        const currentStock = Number(product.current_stock);
        const neededQuantity = Math.max(0, projectedSales - currentStock);

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || '-',
          soldQuantity: Math.round(soldQuantity * 100) / 100,
          currentStock,
          projectedSales,
          neededQuantity,
          dailySalesRate: Math.round(dailySalesRate * 100) / 100,
          daysUntilStockout: dailySalesRate > 0 ? Math.floor(currentStock / dailySalesRate) : Infinity,
        };
      });

    // Apply sorting
    return data.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'bg');
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category, 'bg');
          break;
        case 'soldQuantity':
          comparison = a.soldQuantity - b.soldQuantity;
          break;
        case 'currentStock':
          comparison = a.currentStock - b.currentStock;
          break;
        case 'projectedSales':
          comparison = a.projectedSales - b.projectedSales;
          break;
        case 'neededQuantity':
          comparison = a.neededQuantity - b.neededQuantity;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [inventory.products, inventory.movements, historyDateFrom, historyDateTo, forecastDate, searchQuery, sortKey, sortDirection]);

  // Summary stats
  const stats = useMemo(() => {
    const totalSold = forecastData.reduce((sum, p) => sum + p.soldQuantity, 0);
    const totalNeeded = forecastData.reduce((sum, p) => sum + p.neededQuantity, 0);
    const productsNeedingOrder = forecastData.filter(p => p.neededQuantity > 0).length;
    const criticalProducts = forecastData.filter(p => p.daysUntilStockout < 7 && p.daysUntilStockout !== Infinity).length;

    return { totalSold, totalNeeded, productsNeedingOrder, criticalProducts };
  }, [forecastData]);

  const exportToCSV = () => {
    const headers = ['Артикул', 'SKU', 'Категория', 'Продадени (период)', 'Налични', 'Прогнозни продажби', 'За поръчка'];
    const rows = forecastData.map(p => [
      p.name,
      p.sku,
      p.category,
      p.soldQuantity,
      p.currentStock,
      p.projectedSales,
      p.neededQuantity,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prognoza-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const historyDays = differenceInDays(historyDateTo || defaultHistoryTo, historyDateFrom || defaultHistoryFrom) || 1;
  const forecastDays = differenceInDays(forecastDate || defaultForecastDate, today);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Прогнозни продажби
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* History Period - From */}
            <div className="space-y-2">
              <Label className="text-sm">Минал период от</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">{formatDateWithYear(historyDateFrom)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {historyDateFrom && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistoryDateFrom(null);
                          }}
                          className="hover:bg-destructive/20 hover:text-destructive rounded p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={historyDateFrom || undefined}
                    onSelect={(date) => date && setHistoryDateFrom(date)}
                    disabled={(date) => date > (historyDateTo || today) || date > today}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* History Period - To */}
            <div className="space-y-2">
              <Label className="text-sm">Минал период до</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">{formatDateWithYear(historyDateTo)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {historyDateTo && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistoryDateTo(null);
                          }}
                          className="hover:bg-destructive/20 hover:text-destructive rounded p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={historyDateTo || undefined}
                    onSelect={(date) => date && setHistoryDateTo(date)}
                    disabled={(date) => date < (historyDateFrom || subDays(today, 365)) || date > today}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Forecast Until Date */}
            <div className="space-y-2">
              <Label className="text-sm">Наличност до дата</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">{formatDateWithYear(forecastDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {forecastDate && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForecastDate(null);
                          }}
                          className="hover:bg-destructive/20 hover:text-destructive rounded p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={forecastDate || undefined}
                    onSelect={(date) => date && setForecastDate(date)}
                    disabled={(date) => date <= today}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search + Clear All */}
            <div className="space-y-2">
              <Label className="text-sm">Търсене</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Име, SKU или баркод..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                {(historyDateFrom || historyDateTo || forecastDate) && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setHistoryDateFrom(null);
                      setHistoryDateTo(null);
                      setForecastDate(null);
                    }}
                    title="Изчисти всички дати"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Анализ на <strong>{historyDays}</strong> дни минал период → Прогноза за <strong>{forecastDays}</strong> дни напред
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Продадени (период)</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold mt-1">{Math.round(stats.totalSold)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">За поръчка</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold mt-1">{stats.totalNeeded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Артикули за поръчка</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold mt-1">{stats.productsNeedingOrder}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-red-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Критични (&lt;7 дни)</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold mt-1">{stats.criticalProducts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Експорт CSV
        </Button>
      </div>

      {/* Forecast Table - Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader columnKey="name">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Артикул
                  </SortableHeader>
                  <SortableHeader columnKey="category">
                    <FolderTree className="w-4 h-4 text-muted-foreground" />
                    Категория
                  </SortableHeader>
                  <SortableHeader columnKey="soldQuantity" align="right">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    Продадени ({historyDays} дни)
                  </SortableHeader>
                  <SortableHeader columnKey="currentStock" align="right">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Налични
                  </SortableHeader>
                  <SortableHeader columnKey="projectedSales" align="right">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    Прогноза ({forecastDays} дни)
                  </SortableHeader>
                  <SortableHeader columnKey="neededQuantity" align="right">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    За поръчка
                  </SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Няма намерени артикули
                    </TableCell>
                  </TableRow>
                ) : (
                  forecastData.map((item) => (
                    <TableRow key={item.id} className={item.neededQuantity > 0 ? 'bg-orange-50 dark:bg-orange-950/20' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <button
                            onClick={() => copyToClipboard(item.sku)}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                          >
                            {item.sku}
                            {copiedSku === item.sku ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                          {item.soldQuantity} бр.
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={item.currentStock <= 0 
                          ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' 
                          : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                        }>
                          {item.currentStock} бр.
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                          {item.projectedSales} бр.
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={item.neededQuantity > 0 
                          ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 font-bold' 
                          : 'bg-muted text-muted-foreground border-muted'
                        }>
                          {item.neededQuantity} бр.
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {forecastData.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Няма намерени артикули
            </CardContent>
          </Card>
        ) : (
          forecastData.map((item) => (
            <Card key={item.id} className={item.neededQuantity > 0 ? 'border-orange-300 dark:border-orange-700' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <button
                      onClick={() => copyToClipboard(item.sku)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      {item.sku}
                      {copiedSku === item.sku ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.category}</div>
                  </div>
                  {item.neededQuantity > 0 && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                      За поръчка
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Продадени</div>
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                      {item.soldQuantity} бр.
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Налични</div>
                    <Badge variant="outline" className={item.currentStock <= 0 
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' 
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                    }>
                      {item.currentStock} бр.
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">За поръчка</div>
                    <Badge variant="outline" className={item.neededQuantity > 0 
                      ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 font-bold' 
                      : 'bg-muted text-muted-foreground border-muted'
                    }>
                      {item.neededQuantity} бр.
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
