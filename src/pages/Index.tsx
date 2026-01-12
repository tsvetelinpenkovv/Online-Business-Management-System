import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useToast } from '@/hooks/use-toast';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrderStatistics } from '@/components/orders/OrderStatistics';
import { Button } from '@/components/ui/button';
import { Package, Settings, LogOut, Loader2, RefreshCw, Printer, Trash2, Tags, Download, FileSpreadsheet, FileText, ExternalLink, Clock, FileBox, Plus, Phone, ChevronLeft, ChevronRight, Receipt, MessageCircle, ShieldAlert, Boxes } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ORDER_STATUSES, OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { printOrderReceipts } from '@/components/orders/OrderReceipt';
import { AddOrderDialog } from '@/components/orders/AddOrderDialog';
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
  const { orders, loading: ordersLoading, createOrder, deleteOrder, deleteOrders, updateOrder, updateOrdersStatus, refetch } = useOrders();
  const { logoUrl } = useCompanyLogo();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAddOrderDialog, setShowAddOrderDialog] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<AutoRefreshInterval>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 100;
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [nekorektenEnabled, setNekorektenEnabled] = useState(true);
  const [companySettings, setCompanySettings] = useState<{
    company_name: string | null;
    registered_address: string | null;
    correspondence_address: string | null;
    eik: string | null;
    vat_number: string | null;
    phone: string | null;
    email: string | null;
    manager_name: string | null;
    orders_page_title: string | null;
    inventory_page_title: string | null;
    footer_text: string | null;
    footer_link_text: string | null;
    footer_link: string | null;
    footer_website: string | null;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch company settings and nekorekten enabled status
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const { data } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (data) {
          setWebsiteUrl(data.website_url);
          setCompanySettings({
            company_name: data.company_name,
            registered_address: data.registered_address,
            correspondence_address: data.correspondence_address,
            eik: data.eik,
            vat_number: data.vat_number,
            phone: data.phone,
            email: data.email,
            manager_name: data.manager_name,
            orders_page_title: data.orders_page_title,
            inventory_page_title: data.inventory_page_title,
            footer_text: data.footer_text,
            footer_link_text: data.footer_link_text,
            footer_link: data.footer_link,
            footer_website: data.footer_website,
          });
        }
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    };

    const fetchNekorektenEnabled = async () => {
      try {
        const { data } = await supabase
          .from('api_settings')
          .select('setting_value')
          .eq('setting_key', 'nekorekten_enabled')
          .maybeSingle();
        
        setNekorektenEnabled(data?.setting_value === 'true');
      } catch (error) {
        console.error('Error fetching nekorekten enabled:', error);
      }
    };

    fetchCompanySettings();
    fetchNekorektenEnabled();
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
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.catalog_number && order.catalog_number.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;

      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchesDateTo = !dateTo || orderDate <= dateTo;

      return matchesSearch && matchesStatus && matchesSource && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchTerm, statusFilter, sourceFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, dateFrom, dateTo]);

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

  const handleBulkPrintReceipts = () => {
    const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id));
    
    if (selectedOrdersData.length === 0) {
      alert('Няма избрани поръчки');
      return;
    }

    printOrderReceipts(selectedOrdersData, companySettings, logoUrl);
  };

  const handleBulkPrintInvoices = async () => {
    const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id));
    
    if (selectedOrdersData.length === 0) {
      alert('Няма избрани поръчки');
      return;
    }

    // Fetch invoices for selected orders
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .in('order_id', selectedOrders);

    if (!invoices || invoices.length === 0) {
      alert('Няма фактури за избраните поръчки');
      return;
    }

    // Open each invoice in print mode (simplified - opens invoice dialog for first one)
    // For full implementation, you'd generate PDFs for all invoices
    toast({
      title: 'Печат на фактури',
      description: `Намерени ${invoices.length} фактури за печат`,
    });
  };

  const handleBulkPrintWaybills = () => {
    const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id));
    const ordersWithTracking = selectedOrdersData.filter(o => o.courier_tracking_url);
    
    if (ordersWithTracking.length === 0) {
      alert('Няма избрани поръчки с товарителници');
      return;
    }

    ordersWithTracking.forEach(order => {
      if (order.courier_tracking_url) {
        window.open(order.courier_tracking_url.startsWith('http') ? order.courier_tracking_url : `https://${order.courier_tracking_url}`, '_blank');
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

  if (authLoading || ordersLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background animate-fade-in">
        <div className="relative">
          <Package className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Зареждане на поръчки...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full flex flex-col animate-fade-in">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {logoUrl ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 relative">
                <img 
                  src={logoUrl} 
                  alt="Фирмено лого" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold truncate">{companySettings?.orders_page_title || 'Управление на поръчки'}</h1>
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
                  <Button variant="outline" size="sm" className="px-2">
                    <Tags className="w-3 h-3" />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2">
                    <Printer className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBulkPrintReceipts} className="cursor-pointer">
                    <Printer className="w-4 h-4 mr-2" />
                    {selectedOrders.length === 1 ? 'Печат на поръчка' : 'Печат на поръчки'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintWaybills} className="cursor-pointer">
                    <FileBox className="w-4 h-4 mr-2" />
                    {selectedOrders.length === 1 ? 'Печат на товарителница' : 'Печат на товарителници'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintInvoices} className="cursor-pointer">
                    <Receipt className="w-4 h-4 mr-2" />
                    Печат на фактури
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

          {/* Tablet/Desktop actions - bulk actions (md and up) */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {selectedOrders.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Tags className="w-4 h-4" />
                      <span className="hidden lg:inline">Смени статус</span>
                      <span className="lg:hidden">({selectedOrders.length})</span>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBulkPrintReceipts} className="cursor-pointer">
                      <Printer className="w-4 h-4 mr-2" />
                      Печат на поръчки
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkPrintWaybills} className="cursor-pointer">
                      <FileBox className="w-4 h-4 mr-2" />
                      Печат на товарителници
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={() => setShowBulkDeleteDialog(true)} 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Desktop actions - bulk actions and new order button (only on large screens) */}
          <div className="hidden lg:flex items-center gap-2">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Printer className="w-4 h-4" />
                      Печат ({selectedOrders.length})
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBulkPrintReceipts} className="cursor-pointer">
                    <Printer className="w-4 h-4 mr-2" />
                    {selectedOrders.length === 1 ? 'Печат на поръчка' : 'Печат на поръчки'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintWaybills} className="cursor-pointer">
                    <FileBox className="w-4 h-4 mr-2" />
                    {selectedOrders.length === 1 ? 'Печат на товарителница' : 'Печат на товарителници'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintInvoices} className="cursor-pointer">
                    <Receipt className="w-4 h-4 mr-2" />
                    Печат на фактури
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={() => setShowBulkDeleteDialog(true)} 
                  variant="outline" 
                  className="gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-white hover:border-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Изтрий ({selectedOrders.length})
                </Button>
              </>
            )}
          </div>

          {/* Tablet and Desktop common actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button onClick={() => setShowAddOrderDialog(true)} className="hidden lg:flex gap-2">
              <Plus className="w-4 h-4" />
              Нова поръчка
            </Button>
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
                <Button variant="outline" size="icon" title="Обнови">
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
            <Button variant="outline" size="icon" onClick={() => navigate('/messages')} title="Съобщения">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/inventory')} title="Склад">
              <Boxes className="w-4 h-4" />
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')} title="Настройки">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Изход">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu (show up to md breakpoint) */}
          <div className="flex md:hidden items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title="Обнови">
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
            <div className="h-8 w-8 flex items-center justify-center">
              <ThemeToggle />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title="Още">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/messages')} className="cursor-pointer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Съобщения
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/inventory')} className="cursor-pointer">
                  <Boxes className="w-4 h-4 mr-2" />
                  Склад
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Изход
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          nekorektenEnabled={nekorektenEnabled}
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
          <div className="w-full space-y-4">
            <div className="overflow-x-auto">
              <OrdersTable
                orders={paginatedOrders}
                onDelete={deleteOrder}
                onUpdate={updateOrder}
                selectedOrders={selectedOrders}
                onSelectionChange={setSelectedOrders}
                nekorektenEnabled={nekorektenEnabled}
              />
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[36px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-muted-foreground ml-2">
                  Страница {currentPage} от {totalPages} ({filteredOrders.length} поръчки)
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Футер */}
      <footer className="mt-auto border-t bg-card py-4">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs text-muted-foreground">
          <span>
            {companySettings?.footer_text || 'Разработен от'}{' '}
            {companySettings?.footer_link && companySettings?.footer_link_text ? (
              <a 
                href={companySettings.footer_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {companySettings.footer_link_text}
              </a>
            ) : (
              <span className="font-medium">{companySettings?.footer_link_text || 'Цветелин Пенков'}</span>
            )}
          </span>
          {companySettings?.footer_website && (
            <div className="mt-1">
              <a 
                href={companySettings.footer_website.startsWith('http') ? companySettings.footer_website : `https://${companySettings.footer_website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {companySettings.footer_website}
              </a>
            </div>
          )}
        </div>
      </footer>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Изтриване на {selectedOrders.length === 1 ? 'поръчка' : `${selectedOrders.length} поръчки`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Сигурен ли си, че искаш да изтриеш {selectedOrders.length === 1 ? 'поръчката' : 'поръчките'}? Това действие не може да бъде отменено.
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

      <AddOrderDialog 
        open={showAddOrderDialog} 
        onOpenChange={setShowAddOrderDialog}
        onCreateOrder={createOrder}
      />

      {/* Mobile/Tablet FAB for new order */}
      <Button 
        onClick={() => setShowAddOrderDialog(true)} 
        size="icon" 
        className="lg:hidden fixed bottom-6 right-4 h-12 w-12 rounded-full shadow-lg z-20"
        title="Нова поръчка"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default Index;
