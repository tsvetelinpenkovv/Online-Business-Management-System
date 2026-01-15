import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
import { useEcommercePlatforms } from '@/hooks/useEcommercePlatforms';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Package, Users, FolderTree, FileText, 
  BarChart3, History, RefreshCw, Warehouse, ScanBarcode,
  FileSpreadsheet, ShoppingCart, ChevronLeft, ChevronRight, Loader2, TrendingUp, AlertTriangle, DollarSign
} from 'lucide-react';

import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';
import { ProductsTab } from '@/components/inventory/ProductsTab';
import { SuppliersTab } from '@/components/inventory/SuppliersTab';
import { CategoriesTab } from '@/components/inventory/CategoriesTab';
import { DocumentsTab } from '@/components/inventory/DocumentsTab';
import { MovementsTab } from '@/components/inventory/MovementsTab';
import { ReportsTab } from '@/components/inventory/ReportsTab';
import { ForecastTab } from '@/components/inventory/ForecastTab';
import { PriceHistoryTab } from '@/components/inventory/PriceHistoryTab';
import { BarcodeScannerDialog } from '@/components/inventory/BarcodeScannerDialog';
import { ImportExportDialog } from '@/components/inventory/ImportExportDialog';

export default function Inventory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const inventory = useInventory();
  const { logoUrl } = useCompanyLogo();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [inventoryPageTitle, setInventoryPageTitle] = useState<string>('Склад');
  const [footerText, setFooterText] = useState<string>('Разработен от');
  const [footerLinkText, setFooterLinkText] = useState<string>('Цветелин Пенков');
  const [footerLink, setFooterLink] = useState<string>('');
  const [footerWebsite, setFooterWebsite] = useState<string>('');
  const [hasShownLowStockAlert, setHasShownLowStockAlert] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('inventory_page_title, footer_text, footer_link_text, footer_link, footer_website')
        .limit(1)
        .maybeSingle();
      if (data?.inventory_page_title) {
        setInventoryPageTitle(data.inventory_page_title);
      }
      if (data?.footer_text) {
        setFooterText(data.footer_text);
      }
      if (data?.footer_link_text) {
        setFooterLinkText(data.footer_link_text);
      }
      if (data?.footer_link) {
        setFooterLink(data.footer_link);
      }
      if (data?.footer_website) {
        setFooterWebsite(data.footer_website);
      }
    };
    fetchSettings();
  }, []);

  const checkScrollPosition = () => {
    const container = tabsContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 10);
      setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current;
    if (container) {
      const scrollAmount = 150;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Calculate critical stock counts
  const criticalStockInfo = useMemo(() => {
    const lowStock = inventory.products.filter(
      p => p.current_stock <= p.min_stock_level && p.current_stock > 0
    );
    const outOfStock = inventory.products.filter(p => p.current_stock <= 0);
    return {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalCritical: lowStock.length + outOfStock.length,
    };
  }, [inventory.products]);

  // Show toast notification for low stock on first load
  useEffect(() => {
    if (!inventory.loading && !hasShownLowStockAlert && criticalStockInfo.totalCritical > 0) {
      setHasShownLowStockAlert(true);
      toast({
        title: '⚠️ Внимание: Ниска наличност',
        description: `${criticalStockInfo.outOfStockCount} изчерпани и ${criticalStockInfo.lowStockCount} с ниска наличност. Проверете таба "Прогнози".`,
        variant: 'destructive',
      });
    }
  }, [inventory.loading, hasShownLowStockAlert, criticalStockInfo, toast]);

  if (authLoading || inventory.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background animate-fade-in">
        <div className="relative">
          <Warehouse className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Зареждане на складова програма...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                title="Назад към поръчки"
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Фирмено лого" 
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                    loading="eager"
                  />
                ) : (
                  <Warehouse className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                )}
                <h1 className="text-lg sm:text-xl font-bold truncate">{inventoryPageTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile action buttons */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsScannerOpen(true)}
                className="sm:hidden"
                title="Сканиране на баркод"
              >
                <ScanBarcode className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsImportExportOpen(true)}
                className="sm:hidden"
                title="Импорт/Експорт"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => inventory.refresh()}
                className="sm:hidden"
                title="Обнови"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {/* Desktop action buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="hidden sm:flex"
                title="Сканиране на баркод"
              >
                <ScanBarcode className="w-4 h-4 mr-2" />
                Сканирай
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportExportOpen(true)}
                className="hidden sm:flex"
                title="Импорт/Експорт"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Импорт/Експорт
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => inventory.refresh()}
                className="hidden sm:flex"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Обнови
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Scrollable tabs with arrows (mobile) */}
          <div className="relative">
            {/* Mobile scroll gradients */}
            {showLeftArrow && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent sm:hidden" />
            )}
            {showRightArrow && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent sm:hidden" />
            )}

            {/* Mobile scroll buttons */}
            {showLeftArrow && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollTabs('left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border-border shadow-sm sm:hidden"
                aria-label="Превърти табовете наляво"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {showRightArrow && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollTabs('right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border-border shadow-sm sm:hidden"
                aria-label="Превърти табовете надясно"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            <div
              ref={tabsContainerRef}
              className="overflow-x-auto -mx-3 lg:mx-0 px-3 lg:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={checkScrollPosition}
            >
              <TabsList className="inline-flex w-max lg:w-auto lg:flex lg:flex-wrap h-auto gap-1 p-1.5 bg-muted dark:bg-muted/70 rounded-lg [&::-webkit-scrollbar]:hidden">
                <TabsTrigger value="dashboard" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Табло</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Артикули</span>
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Доставчици</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <FolderTree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Категории</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Документи</span>
                </TabsTrigger>
                <TabsTrigger value="movements" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Движения</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Отчети</span>
                </TabsTrigger>
                <TabsTrigger value="price-history" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Цени</span>
                </TabsTrigger>
                <TabsTrigger
                  value="forecast"
                  className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/60 data-[state=active]:bg-red-600 dark:data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:hover:bg-red-700 dark:data-[state=active]:hover:bg-red-700 data-[state=active]:shadow-sm"
                >
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Прогнози</span>
                  {criticalStockInfo.totalCritical > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold animate-pulse"
                    >
                      {criticalStockInfo.totalCritical}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="dashboard" className="mt-4 sm:mt-6">
            <InventoryDashboard inventory={inventory} />
          </TabsContent>

          <TabsContent value="products" className="mt-4 sm:mt-6">
            <ProductsTab inventory={inventory} />
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4 sm:mt-6">
            <SuppliersTab inventory={inventory} />
          </TabsContent>

          <TabsContent value="categories" className="mt-4 sm:mt-6">
            <CategoriesTab inventory={inventory} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4 sm:mt-6">
            <DocumentsTab inventory={inventory} />
          </TabsContent>

          <TabsContent value="movements" className="mt-4 sm:mt-6">
            <MovementsTab inventory={inventory} />
          </TabsContent>

          <TabsContent value="reports" className="mt-4 sm:mt-6">
            <ReportsTab inventory={inventory} />
          </TabsContent>

          <TabsContent value="price-history" className="mt-4 sm:mt-6">
            <PriceHistoryTab />
          </TabsContent>

          <TabsContent value="forecast" className="mt-4 sm:mt-6">
            <ForecastTab inventory={inventory} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        inventory={inventory}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={isImportExportOpen}
        onOpenChange={setIsImportExportOpen}
        inventory={inventory}
      />

      {/* Футер */}
      <footer className="mt-auto border-t bg-card py-4">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs text-muted-foreground">
          <span>
            {footerText}{' '}
            {footerLink && footerLinkText ? (
              <a 
                href={footerLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {footerLinkText}
              </a>
            ) : (
              <span className="font-medium">{footerLinkText}</span>
            )}
          </span>
          {footerWebsite && (
            <div className="mt-1">
              <a 
                href={footerWebsite.startsWith('http') ? footerWebsite : `https://${footerWebsite}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {footerWebsite}
              </a>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
