import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrderStatistics } from '@/components/orders/OrderStatistics';
import { Button } from '@/components/ui/button';
import { Package, Settings, LogOut, Loader2, RefreshCw, Printer, Trash2, Tags, Download, FileSpreadsheet, FileText, ExternalLink, Clock } from 'lucide-react';
import { ORDER_STATUSES, OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type AutoRefreshInterval = 0 | 60000 | 120000 | 300000 | 600000;

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { orders, loading: ordersLoading, deleteOrder, deleteOrders, updateOrder, updateOrdersStatus, refetch } = useOrders();
  const { logoUrl } = useCompanyLogo();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<AutoRefreshInterval>(0);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch website URL from company settings
  useEffect(() => {
    const fetchWebsiteUrl = async () => {
      try {
        const { data } = await supabase
          .from('company_settings')
          .select('website_url')
          .limit(1)
          .single();
        if (data?.website_url) {
          setWebsiteUrl(data.website_url);
        }
      } catch (error) {
        console.error('Error fetching website URL:', error);
      }
    };
    fetchWebsiteUrl();
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefreshInterval === 0) return;
    
    const interval = setInterval(() => {
      refetch();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetch]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm) ||
        order.id.toString().includes(searchTerm) ||
        order.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;

      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchesDateTo = !dateTo || orderDate <= dateTo;

      return matchesSearch && matchesStatus && matchesSource && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchTerm, statusFilter, sourceFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleBulkPrint = () => {
    const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id));
    const ordersWithTracking = selectedOrdersData.filter(o => o.courier_tracking_url);
    
    if (ordersWithTracking.length === 0) {
      alert('Няма избрани поръчки с товарителници');
      return;
    }

    // Open each tracking URL in a new tab for printing
    ordersWithTracking.forEach(order => {
      if (order.courier_tracking_url) {
        window.open(order.courier_tracking_url, '_blank');
      }
    });
  };

  const handleBulkDelete = async () => {
    await deleteOrders(selectedOrders);
    setSelectedOrders([]);
    setShowBulkDeleteDialog(false);
  };

  const handleBulkStatusChange = async (status: OrderStatus) => {
    await updateOrdersStatus(selectedOrders, status);
    setSelectedOrders([]);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Дата', 'Клиент', 'Телефон', 'Имейл', 'Продукт', 'Кат.№', 'Количество', 'Цена', 'Статус', 'Адрес', 'Коментар', 'Източник'];
    const rows = filteredOrders.map(order => [
      order.id,
      new Date(order.created_at).toLocaleDateString('bg-BG'),
      order.customer_name,
      order.phone,
      order.customer_email || '',
      order.product_name,
      order.catalog_number || '',
      order.quantity,
      order.total_price.toFixed(2),
      order.status,
      order.delivery_address || '',
      order.comment || '',
      order.source || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<orders>\n';
    
    filteredOrders.forEach(order => {
      xml += '  <order>\n';
      xml += `    <id>${order.id}</id>\n`;
      xml += `    <date>${new Date(order.created_at).toISOString()}</date>\n`;
      xml += `    <customer_name><![CDATA[${order.customer_name}]]></customer_name>\n`;
      xml += `    <phone>${order.phone}</phone>\n`;
      xml += `    <email>${order.customer_email || ''}</email>\n`;
      xml += `    <product_name><![CDATA[${order.product_name}]]></product_name>\n`;
      xml += `    <catalog_number>${order.catalog_number || ''}</catalog_number>\n`;
      xml += `    <quantity>${order.quantity}</quantity>\n`;
      xml += `    <total_price>${order.total_price.toFixed(2)}</total_price>\n`;
      xml += `    <status>${order.status}</status>\n`;
      xml += `    <delivery_address><![CDATA[${order.delivery_address || ''}]]></delivery_address>\n`;
      xml += `    <comment><![CDATA[${order.comment || ''}]]></comment>\n`;
      xml += `    <source>${order.source || ''}</source>\n`;
      xml += '  </order>\n';
    });
    
    xml += '</orders>';

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Фирмено лого" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold truncate">Управление на поръчки</h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>{filteredOrders.length} поръчки</span>
                {websiteUrl && (
                  <>
                    <span>•</span>
                    <a 
                      href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{websiteUrl.replace(/^https?:\/\//, '')}</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile bulk actions */}
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-1 sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-xs px-2">
                    <Tags className="w-3 h-3" />
                    <span className="sr-only sm:not-sr-only">Статус</span>
                    ({selectedOrders.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto p-1">
                  {ORDER_STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleBulkStatusChange(status)}
                      className="p-1.5 rounded-md cursor-pointer hover:bg-muted/50"
                    >
                      <StatusBadge status={status} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleBulkPrint} variant="outline" size="sm" className="px-2">
                <Printer className="w-3 h-3" />
              </Button>
              <Button 
                onClick={() => setShowBulkDeleteDialog(true)} 
                variant="outline" 
                size="sm"
                className="px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            {selectedOrders.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Tags className="w-4 h-4" />
                      Смени статус ({selectedOrders.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto p-1">
                    {ORDER_STATUSES.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleBulkStatusChange(status)}
                        className="p-1.5 rounded-md cursor-pointer hover:bg-muted/50"
                      >
                        <StatusBadge status={status} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handleBulkPrint} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Печат ({selectedOrders.length})
                </Button>
                <Button 
                  onClick={() => setShowBulkDeleteDialog(true)} 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Изтрий ({selectedOrders.length})
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Експорт
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Експорт в CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToXML} className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Експорт в XML
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Обнови" className={autoRefreshInterval > 0 ? 'border-primary' : ''}>
                  <RefreshCw className={`w-4 h-4 ${autoRefreshInterval > 0 ? 'animate-spin' : ''}`} style={autoRefreshInterval > 0 ? { animationDuration: '3s' } : undefined} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => refetch()} className="cursor-pointer">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обнови сега
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(0)} 
                  className={`cursor-pointer ${autoRefreshInterval === 0 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Без автоматично
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(60000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 60000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  На всяка 1 минута
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(120000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 120000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  На всеки 2 минути
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(300000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 300000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  На всеки 5 минути
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(600000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 600000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  На всеки 10 минути
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')} title="Настройки">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Изход">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="flex sm:hidden items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className={`h-8 w-8 ${autoRefreshInterval > 0 ? 'border-primary' : ''}`} title="Обнови">
                  <RefreshCw className={`w-4 h-4 ${autoRefreshInterval > 0 ? 'animate-spin' : ''}`} style={autoRefreshInterval > 0 ? { animationDuration: '3s' } : undefined} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => refetch()} className="cursor-pointer">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обнови сега
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(0)} 
                  className={`cursor-pointer ${autoRefreshInterval === 0 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Без автоматично
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(60000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 60000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  1 мин
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(120000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 120000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  2 мин
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(300000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 300000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  5 мин
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAutoRefreshInterval(600000)} 
                  className={`cursor-pointer ${autoRefreshInterval === 600000 ? 'bg-muted' : ''}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  10 мин
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate('/settings')} title="Настройки">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut} title="Изход">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-2 sm:px-4 py-4 sm:py-6 space-y-4">
        <OrderFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearFilters={clearFilters}
          onToggleStatistics={() => setShowStatistics(!showStatistics)}
          showStatistics={showStatistics}
        />

        {/* Statistics Dashboard */}
        {showStatistics && (
          <OrderStatistics orders={orders} />
        )}

        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Няма намерени поръчки</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <OrdersTable
              orders={filteredOrders}
              onDelete={deleteOrder}
              onUpdate={updateOrder}
              selectedOrders={selectedOrders}
              onSelectionChange={setSelectedOrders}
            />
          </div>
        )}
      </main>

      <footer className="w-full px-3 sm:px-6 py-3 sm:py-4 border-t bg-card mt-auto">
        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          Разработен от{' '}
          <a
            href="https://www.linkedin.com/in/tsvetelinpenkov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Цветелин Пенков
          </a>
        </p>
      </footer>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на {selectedOrders.length} поръчки</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете избраните поръчки? Това действие не може да бъде отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
