import { useState, useMemo } from 'react';
import { format, subDays, differenceInDays, addDays } from 'date-fns';
import { bg } from 'date-fns/locale';
import { CalendarIcon, TrendingUp, Package, ShoppingCart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInventory } from '@/hooks/useInventory';

interface ForecastTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const ForecastTab = ({ inventory }: ForecastTabProps) => {
  const today = new Date();
  const [historyDateFrom, setHistoryDateFrom] = useState<Date>(subDays(today, 30));
  const [historyDateTo, setHistoryDateTo] = useState<Date>(today);
  const [forecastDate, setForecastDate] = useState<Date>(addDays(today, 30));
  const [searchQuery, setSearchQuery] = useState('');

  const formatDateWithYear = (date: Date) => {
    return format(date, "d MMM yyyy", { locale: bg }) + " г.";
  };

  // Calculate sales data for each product
  const forecastData = useMemo(() => {
    const historyDays = differenceInDays(historyDateTo, historyDateFrom) || 1;
    const forecastDays = differenceInDays(forecastDate, today);

    return inventory.products
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
          return moveDate >= historyDateFrom && moveDate <= historyDateTo;
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
      })
      .sort((a, b) => b.neededQuantity - a.neededQuantity);
  }, [inventory.products, inventory.movements, historyDateFrom, historyDateTo, forecastDate, searchQuery]);

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

  const historyDays = differenceInDays(historyDateTo, historyDateFrom) || 1;
  const forecastDays = differenceInDays(forecastDate, today);

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
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateWithYear(historyDateFrom)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={historyDateFrom}
                    onSelect={(date) => date && setHistoryDateFrom(date)}
                    disabled={(date) => date > historyDateTo || date > today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* History Period - To */}
            <div className="space-y-2">
              <Label className="text-sm">Минал период до</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateWithYear(historyDateTo)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={historyDateTo}
                    onSelect={(date) => date && setHistoryDateTo(date)}
                    disabled={(date) => date < historyDateFrom || date > today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Forecast Until Date */}
            <div className="space-y-2">
              <Label className="text-sm">Наличност до дата</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateWithYear(forecastDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={forecastDate}
                    onSelect={(date) => date && setForecastDate(date)}
                    disabled={(date) => date <= today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm">Търсене</Label>
              <Input
                placeholder="Име, SKU или баркод..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  <TableHead>Артикул</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Продадени ({historyDays} дни)</TableHead>
                  <TableHead className="text-right">Налични</TableHead>
                  <TableHead className="text-right">Прогноза ({forecastDays} дни)</TableHead>
                  <TableHead className="text-right">За поръчка</TableHead>
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
                          <div className="text-xs text-muted-foreground">{item.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{item.soldQuantity}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.currentStock <= 0 ? 'text-red-500 font-medium' : ''}>
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{item.projectedSales}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.neededQuantity > 0 ? 'text-orange-600 dark:text-orange-400 font-bold' : ''}>
                          {item.neededQuantity}
                        </span>
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
                    <div className="text-xs text-muted-foreground">{item.sku} • {item.category}</div>
                  </div>
                  {item.neededQuantity > 0 && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                      За поръчка
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Продадени</div>
                    <div className="font-medium">{item.soldQuantity}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Налични</div>
                    <div className={`font-medium ${item.currentStock <= 0 ? 'text-red-500' : ''}`}>
                      {item.currentStock}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">За поръчка</div>
                    <div className={`font-medium ${item.neededQuantity > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                      {item.neededQuantity}
                    </div>
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
