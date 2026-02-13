import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { usePermissions } from '@/hooks/usePermissions';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useToast } from '@/hooks/use-toast';
import { useInterfaceTexts } from '@/hooks/useInterfaceTexts';
import { useDebounce } from '@/hooks/useDebounce';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { ColumnVisibilityToggle, getDefaultVisibleColumns, saveVisibleColumns, COLUMNS_CONFIG, type ColumnKey } from '@/components/orders/ColumnVisibilityToggle';
import { StoreFilterTabs } from '@/components/orders/StoreFilterTabs';
import { useStores } from '@/hooks/useStores';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrderStatistics } from '@/components/orders/OrderStatistics';
import { Button } from '@/components/ui/button';
import { Package, Settings, LogOut, Loader2, RefreshCw, Printer, Trash2, Tags, Download, FileSpreadsheet, FileText, ExternalLink, Clock, FileBox, Plus, ChevronLeft, ChevronRight, Receipt, Eye, EyeOff, Columns3, Users, Euro, BarChart3 } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { QuickCacheClear } from '@/components/settings/QuickCacheClear';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ORDER_STATUSES, OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { printOrderReceipts } from '@/components/orders/OrderReceipt';
import { AddOrderDialog } from '@/components/orders/AddOrderDialog';
import { BulkShipmentDialog } from '@/components/orders/BulkShipmentDialog';
import { buildPath } from '@/components/SecretPathGuard';
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
  const { canView, canCreate, canEdit, canDelete } = usePermissions();
  const { orders, loading: ordersLoading, createOrder, deleteOrder, deleteOrders, updateOrder, updateOrdersStatus, refetch } = useOrders();
  // Realtime notifications for new orders
  useRealtimeOrders({
    onNewOrder: refetch,
    onOrderUpdated: refetch,
    onOrderDeleted: refetch,
  });
  const { logoUrl } = useCompanyLogo();
  const { toast } = useToast();
  const { getText } = useInterfaceTexts();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkShipmentDialog, setShowBulkShipmentDialog] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAddOrderDialog, setShowAddOrderDialog] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<AutoRefreshInterval>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 100;
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [nekorektenEnabled, setNekorektenEnabled] = useState(true);
  const [connectixEnabled, setConnectixEnabled] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(getDefaultVisibleColumns);
  const { stores, multiStoreEnabled } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
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
      navigate(buildPath('/auth'));
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

    const fetchConnectixEnabled = async () => {
      try {
        const { data } = await supabase
          .from('api_settings')
          .select('setting_value')
          .eq('setting_key', 'connectix_config')
          .maybeSingle();
        
        if (data?.setting_value) {
          try {
            const config = JSON.parse(data.setting_value);
            setConnectixEnabled(config.is_enabled === true);
          } catch {
            setConnectixEnabled(false);
          }
        }
      } catch (error) {
        console.error('Error fetching connectix enabled:', error);
      }
    };

    fetchCompanySettings();
    fetchNekorektenEnabled();
    fetchConnectixEnabled();
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefreshInterval === 0) return;
    
    const interval = setInterval(() => {
      refetch();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetch]);

  // Helper function to normalize phone number for search comparison
  const normalizePhoneForSearch = (phone: string): string => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Convert +359 to 0 for comparison, or vice versa
    if (cleaned.startsWith('+359')) {
      return '0' + cleaned.slice(4);
    }
    if (cleaned.startsWith('00359')) {
      return '0' + cleaned.slice(5);
    }
    if (cleaned.startsWith('359')) {
      return '0' + cleaned.slice(3);
    }
    return cleaned;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Normalize search term for phone comparison
      const normalizedSearch = normalizePhoneForSearch(debouncedSearchTerm);
      const normalizedPhone = normalizePhoneForSearch(order.phone);
      
      const matchesSearch = debouncedSearchTerm === '' || 
        order.customer_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        order.phone.includes(debouncedSearchTerm) ||
        normalizedPhone.includes(normalizedSearch) ||
        order.id.toString().includes(debouncedSearchTerm) ||
        order.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (order.catalog_number && order.catalog_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;

      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchesDateTo = !dateTo || orderDate <= dateTo;

      // Store filter
      const matchesStore = !selectedStoreId || (order as any).store_id === selectedStoreId;

      return matchesSearch && matchesStatus && matchesSource && matchesDateFrom && matchesDateTo && matchesStore;
    });
  }, [orders, debouncedSearchTerm, statusFilter, sourceFilter, dateFrom, dateTo, selectedStoreId]);

  // Order count by store
  const orderCountByStore = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      const storeId = (order as any).store_id;
      if (storeId) {
        counts[storeId] = (counts[storeId] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, sourceFilter, dateFrom, dateTo, selectedStoreId]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(buildPath('/auth'));
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
          <p className="text-sm text-muted-foreground">{getText('orders_loading_text')}</p>
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
              <h1 className="text-base sm:text-xl font-semibold truncate">{companySettings?.orders_page_title || getText('orders_page_title')}</h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>{filteredOrders.length} {getText('orders_header_subtitle')}</span>
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
              {canEdit('orders') && (
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
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2">
                    <Printer className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBulkPrintReceipts} className="cursor-pointer">
                    <Printer className="w-4 h-4 mr-2" />
                    {getText('orders_print_receipts_label')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintWaybills} className="cursor-pointer">
                    <FileBox className="w-4 h-4 mr-2" />
                    {getText('orders_print_waybills_label')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintInvoices} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    {getText('orders_print_invoices_label')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowBulkShipmentDialog(true)} className="cursor-pointer">
                    <FileBox className="w-4 h-4 mr-2" />
                    Създай товарителници
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {canDelete('orders') && (
                <Button 
                  onClick={() => setShowBulkDeleteDialog(true)} 
                  variant="outline" 
                  size="sm"
                  className="px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {/* Tablet/Desktop actions - bulk actions (md and up) */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {selectedOrders.length > 0 && (
              <>
                {canEdit('orders') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Tags className="w-4 h-4" />
                        <span className="hidden lg:inline">{getText('orders_change_status_label')}</span>
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
                )}
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
                      {getText('orders_print_waybills_label')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkPrintInvoices} className="cursor-pointer">
                      <Receipt className="w-4 h-4 mr-2" />
                      {getText('orders_print_invoices_label')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {canDelete('orders') && (
                  <Button 
                    onClick={() => setShowBulkDeleteDialog(true)} 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Desktop actions - bulk actions and new order button (only on large screens) */}
          <div className="hidden lg:flex items-center gap-2">
            {selectedOrders.length > 0 && (
              <>
                {canEdit('orders') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Tags className="w-4 h-4" />
                        {getText('orders_change_status_label')} ({selectedOrders.length})
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
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Printer className="w-4 h-4" />
                      {getText('orders_print_action')} ({selectedOrders.length})
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBulkPrintReceipts} className="cursor-pointer">
                    <Printer className="w-4 h-4 mr-2" />
                    {getText('orders_print_receipts_label')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintWaybills} className="cursor-pointer">
                    <FileBox className="w-4 h-4 mr-2" />
                    {getText('orders_print_waybills_label')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkPrintInvoices} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    {getText('orders_print_invoices_label')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
                {canDelete('orders') && (
                  <Button 
                    onClick={() => setShowBulkDeleteDialog(true)} 
                    variant="outline" 
                    className="gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-white hover:border-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Изтрий ({selectedOrders.length})
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Desktop actions - navigation buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            {canCreate('orders') && (
              <Button onClick={() => setShowAddOrderDialog(true)} className="hidden lg:flex gap-2">
                <Plus className="w-4 h-4" />
                {getText('orders_add_button_label')}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="w-4 h-4" />
                  <span className="hidden lg:inline">{getText('orders_export_csv_label').split(' ')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  {getText('orders_export_csv_label')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToXML} className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {getText('orders_export_xml_label')}
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
                <DropdownMenuItem 
                  onClick={() => { refetch(); toast({ title: 'Обновено', description: 'Данните са обновени успешно' }); }} 
                  className="cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обнови сега
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {([0, 60000, 120000, 300000, 600000] as AutoRefreshInterval[]).map((interval) => {
                  const labels: Record<number, string> = { 0: 'Без автоматично', 60000: '1 минута', 120000: '2 минути', 300000: '5 минути', 600000: '10 минути' };
                  return (
                    <DropdownMenuItem 
                      key={interval}
                      onClick={() => { setAutoRefreshInterval(interval); toast({ title: 'Авто-обновяване', description: interval === 0 ? 'Изключено' : `На всеки ${labels[interval]}` }); }} 
                      className={`cursor-pointer ${autoRefreshInterval === interval ? 'bg-muted' : ''}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {labels[interval]}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            <QuickCacheClear />
            {/* Navigation group */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Навигация">
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(buildPath('/crm'))} className="cursor-pointer">
                  <Users className="w-4 h-4 mr-2" />
                  CRM - Клиенти
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(buildPath('/finance'))} className="cursor-pointer">
                  <Euro className="w-4 h-4 mr-2" />
                  Финанси
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(buildPath('/analytics'))} className="cursor-pointer">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Аналитика
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationCenter />
            <Button variant="outline" size="icon" onClick={() => navigate(buildPath('/settings'))} title={getText('orders_settings_button_label')} className={!canView('settings') ? 'hidden' : ''}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title={getText('orders_logout_button_label')}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu (show up to md breakpoint) - compact uniform buttons */}
          <div className="flex md:hidden items-center gap-1">
            <NotificationCenter className="h-8 w-8" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title={getText('orders_refresh_label')}>
                  <RefreshCw className={`w-4 h-4 ${autoRefreshInterval > 0 ? 'animate-spin' : ''}`} style={autoRefreshInterval > 0 ? { animationDuration: '3s' } : undefined} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => { refetch(); toast({ title: 'Обновено', description: 'Данните са обновени успешно' }); }} 
                  className="cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обнови сега
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {([0, 60000, 120000, 300000, 600000] as AutoRefreshInterval[]).map((interval) => {
                  const labels: Record<number, string> = { 0: 'Без авто', 60000: '1 мин', 120000: '2 мин', 300000: '5 мин', 600000: '10 мин' };
                  return (
                    <DropdownMenuItem 
                      key={interval}
                      onClick={() => { setAutoRefreshInterval(interval); toast({ title: 'Авто-обновяване', description: interval === 0 ? 'Изключено' : labels[interval] }); }} 
                      className={`cursor-pointer ${autoRefreshInterval === interval ? 'bg-muted' : ''}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {labels[interval]}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title="Меню">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate(buildPath('/crm'))} className="cursor-pointer">
                  <Users className="w-4 h-4 mr-2" />
                  CRM - Клиенти
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(buildPath('/finance'))} className="cursor-pointer">
                  <Euro className="w-4 h-4 mr-2" />
                  Финанси
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(buildPath('/analytics'))} className="cursor-pointer">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Аналитика
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="p-0">
                  <QuickCacheClear size="sm" />
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <ThemeToggle variant="menu" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(buildPath('/settings'))} className={`cursor-pointer ${!canView('settings') ? 'hidden' : ''}`}>
                  <Settings className="w-4 h-4 mr-2" />
                  {getText('orders_settings_button_label')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Column visibility */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Columns3 className="w-4 h-4" />
                    Колони
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                    {COLUMNS_CONFIG.filter(col => col.key !== 'correct' || nekorektenEnabled).map((column) => (
                      <button
                        key={column.key}
                        type="button"
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newColumns = new Set(visibleColumns);
                          if (newColumns.has(column.key)) {
                            newColumns.delete(column.key);
                          } else {
                            newColumns.add(column.key);
                          }
                          setVisibleColumns(newColumns);
                          saveVisibleColumns(newColumns);
                        }}
                      >
                        {visibleColumns.has(column.key) ? (
                          <Eye className="w-3 h-3 text-success flex-shrink-0" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate">{column.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {getText('orders_logout_button_label')}
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
          connectixEnabled={connectixEnabled}
        />

        {/* Multi-store filter tabs - moved to be visually part of the table */}

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
            <p>{getText('orders_no_orders_text')}</p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Column visibility toggle - hidden on mobile */}
            <div className="hidden md:flex justify-end">
              <ColumnVisibilityToggle
                visibleColumns={visibleColumns}
                onToggle={(column) => {
                  const newColumns = new Set(visibleColumns);
                  if (newColumns.has(column)) {
                    newColumns.delete(column);
                  } else {
                    newColumns.add(column);
                  }
                  setVisibleColumns(newColumns);
                  saveVisibleColumns(newColumns);
                }}
                nekorektenEnabled={nekorektenEnabled}
              />
            </div>
            <div className="w-full">
              {multiStoreEnabled && stores.filter(s => s.is_enabled).length > 0 && (
                <StoreFilterTabs
                  stores={stores}
                  selectedStoreId={selectedStoreId}
                  onSelectStore={setSelectedStoreId}
                  orderCountByStore={orderCountByStore}
                  totalOrders={orders.length}
                />
              )}
              <OrdersTable
                orders={paginatedOrders}
                onDelete={deleteOrder}
                onUpdate={updateOrder}
                selectedOrders={selectedOrders}
                onSelectionChange={setSelectedOrders}
                nekorektenEnabled={nekorektenEnabled}
                visibleColumns={visibleColumns}
                canEditOrders={canEdit('orders')}
                canDeleteOrders={canDelete('orders')}
                canCreateInvoices={canCreate('invoices')}
                noTopRadius={multiStoreEnabled && stores.filter(s => s.is_enabled).length > 0}
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
                  {getText('common_page_label')} {currentPage} {getText('common_of_label')} {totalPages} ({filteredOrders.length} {getText('orders_header_subtitle')})
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
              {getText('common_confirm_delete_title')} ({selectedOrders.length})
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getText('common_confirm_delete_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{getText('common_cancel_button')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {getText('common_delete_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddOrderDialog 
        open={showAddOrderDialog} 
        onOpenChange={setShowAddOrderDialog}
        onCreateOrder={createOrder}
      />

      <BulkShipmentDialog
        orders={orders.filter(o => selectedOrders.includes(o.id))}
        open={showBulkShipmentDialog}
        onOpenChange={setShowBulkShipmentDialog}
        onComplete={() => {
          refetch();
          setSelectedOrders([]);
        }}
      />

      {/* Mobile/Tablet FAB for new order */}
      {canCreate('orders') && (
        <Button 
          onClick={() => setShowAddOrderDialog(true)} 
          size="icon" 
          className="lg:hidden fixed bottom-6 right-4 h-12 w-12 rounded-full shadow-lg z-20"
          title={getText('orders_add_button_label')}
        >
          <Plus className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default Index;
