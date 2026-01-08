import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Package, Users, FolderTree, FileText, 
  BarChart3, History, RefreshCw, Warehouse, ScanBarcode,
  FileSpreadsheet, ShoppingCart
} from 'lucide-react';

import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';
import { ProductsTab } from '@/components/inventory/ProductsTab';
import { SuppliersTab } from '@/components/inventory/SuppliersTab';
import { CategoriesTab } from '@/components/inventory/CategoriesTab';
import { DocumentsTab } from '@/components/inventory/DocumentsTab';
import { MovementsTab } from '@/components/inventory/MovementsTab';
import { ReportsTab } from '@/components/inventory/ReportsTab';
import { BarcodeScannerDialog } from '@/components/inventory/BarcodeScannerDialog';
import { ImportExportDialog } from '@/components/inventory/ImportExportDialog';
import { WooCommerceSettings } from '@/components/inventory/WooCommerceSettings';

export default function Inventory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const inventory = useInventory();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || inventory.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Warehouse className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Зареждане на складова програма...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
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
                <Warehouse className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <h1 className="text-lg sm:text-xl font-bold truncate">Склад</h1>
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
                title="Опресни"
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
                Опресни
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Scrollable tabs for mobile */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="inline-flex w-max sm:w-auto sm:flex sm:flex-wrap h-auto gap-1 p-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Табло</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Артикули</span>
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Доставчици</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FolderTree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Категории</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Документи</span>
              </TabsTrigger>
              <TabsTrigger value="movements" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Движения</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Отчети</span>
              </TabsTrigger>
              <TabsTrigger value="woocommerce" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>WooCommerce</span>
              </TabsTrigger>
            </TabsList>
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

          <TabsContent value="woocommerce" className="mt-4 sm:mt-6">
            <WooCommerceSettings onSync={() => inventory.refresh()} />
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
    </div>
  );
}
