import { FC, useState, useMemo, useEffect } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { InventoryProduct } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';
type SortKey = 'name' | 'sku' | 'current_stock' | 'purchase_price' | 'sale_price' | 'category';
type SortDirection = 'asc' | 'desc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Pencil, Trash2, Package, 
  AlertTriangle, ArrowUpDown, MoreHorizontal, Barcode, Copy, Check, Layers, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductsTabProps {
  inventory: ReturnType<typeof useInventory>;
}

interface BundleComponent {
  id: string;
  component_product_id: string;
  component_quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    current_stock: number;
  } | null;
}

export const ProductsTab: FC<ProductsTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);
  const [bundleViewProduct, setBundleViewProduct] = useState<InventoryProduct | null>(null);
  const [bundleComponents, setBundleComponents] = useState<BundleComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    unit_id: '',
    purchase_price: 0,
    sale_price: 0,
    min_stock_level: 0,
    barcode: '',
    is_active: true,
    current_stock: 0,
  });
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = inventory.products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'bg');
          break;
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
        case 'current_stock':
          comparison = a.current_stock - b.current_stock;
          break;
        case 'purchase_price':
          comparison = a.purchase_price - b.purchase_price;
          break;
        case 'sale_price':
          comparison = a.sale_price - b.sale_price;
          break;
        case 'category':
          comparison = (a.category?.name || '').localeCompare(b.category?.name || '', 'bg');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [inventory.products, search, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ columnKey, children }: { columnKey: SortKey; children: React.ReactNode }) => (
    <TableHead 
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${columnKey === 'current_stock' || columnKey === 'purchase_price' || columnKey === 'sale_price' ? 'text-right' : ''}`}
      onClick={() => handleSort(columnKey)}
    >
      <div className={`flex items-center gap-1 ${columnKey === 'current_stock' || columnKey === 'purchase_price' || columnKey === 'sale_price' ? 'justify-end' : ''}`}>
        {children}
        <ArrowUpDown className={`w-3 h-3 flex-shrink-0 ${sortKey === columnKey ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  const openCreateDialog = () => {
    setEditProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      category_id: '',
      unit_id: '',
      purchase_price: 0,
      sale_price: 0,
      min_stock_level: 0,
      barcode: '',
      is_active: true,
      current_stock: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: InventoryProduct) => {
    setEditProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      unit_id: product.unit_id || '',
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      min_stock_level: product.min_stock_level,
      barcode: product.barcode || '',
      is_active: product.is_active,
      current_stock: product.current_stock,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editProduct) {
      await inventory.updateProduct(editProduct.id, {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        unit_id: formData.unit_id || null,
        purchase_price: formData.purchase_price,
        sale_price: formData.sale_price,
        min_stock_level: formData.min_stock_level,
        barcode: formData.barcode || null,
        is_active: formData.is_active,
        current_stock: formData.current_stock,
      });
    } else {
      // For new products, create with current_stock included
      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        unit_id: formData.unit_id || null,
        purchase_price: formData.purchase_price,
        sale_price: formData.sale_price,
        min_stock_level: formData.min_stock_level,
        barcode: formData.barcode || null,
        is_active: formData.is_active,
        woocommerce_id: null,
        is_bundle: false,
        external_bundle_type: null,
      };
      
      const result = await inventory.createProduct(productData);
      
      // If created successfully and we have initial stock, update it
      if (result && formData.current_stock > 0) {
        await inventory.updateProduct(result.id, { current_stock: formData.current_stock });
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await inventory.deleteProduct(deleteId);
      setDeleteId(null);
    }
  };

  const getStockStatus = (product: InventoryProduct) => {
    if (product.current_stock <= 0) {
      return <Badge variant="destructive">Изчерпан</Badge>;
    }
    if (product.current_stock <= product.min_stock_level) {
      return <Badge className="bg-warning text-warning-foreground">Ниска</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">В наличност</Badge>;
  };

  const margin = (product: InventoryProduct) => {
    if (product.purchase_price === 0) return 0;
    return ((product.sale_price - product.purchase_price) / product.purchase_price * 100).toFixed(1);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    toast.success(`${type} копиран!`);
  };

  const openBundleView = async (product: InventoryProduct) => {
    setBundleViewProduct(product);
    setLoadingComponents(true);
    
    try {
      const { data, error } = await supabase
        .from('product_bundles')
        .select(`
          id,
          component_product_id,
          component_quantity,
          component:inventory_products!product_bundles_component_product_id_fkey (
            id,
            name,
            sku,
            current_stock
          )
        `)
        .eq('parent_product_id', product.id);
      
      if (error) throw error;
      
      // Transform data to match our interface
      const components: BundleComponent[] = (data || []).map((item: any) => ({
        id: item.id,
        component_product_id: item.component_product_id,
        component_quantity: item.component_quantity,
        product: item.component
      }));
      
      setBundleComponents(components);
    } catch (err) {
      console.error('Error fetching bundle components:', err);
      toast.error('Грешка при зареждане на компонентите');
    } finally {
      setLoadingComponents(false);
    }
  };

  const getBundleTypeBadge = (product: InventoryProduct) => {
    if (!product.is_bundle) return null;
    
    const typeLabels: Record<string, string> = {
      'grouped': 'Групиран',
      'bundle': 'Комплект',
      'composite': 'Композитен',
      'pack': 'Пакет',
    };
    
    const label = typeLabels[product.external_bundle_type || ''] || 'Комплект';
    
    return (
      <Badge 
        variant="outline" 
        className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 gap-1"
      >
        <Layers className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Търси по име, код или баркод..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Нов артикул
        </Button>
      </div>

      {/* Products - Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredAndSortedProducts.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Няма намерени артикули</p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <button
                          onClick={() => copyToClipboard(product.sku, 'Код')}
                          className="p-0.5 hover:bg-muted rounded transition-colors"
                          title="Копирай код"
                        >
                          {copiedText === product.sku ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          )}
                        </button>
                        {getStockStatus(product)}
                        {getBundleTypeBadge(product)}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-medium truncate cursor-pointer">{product.name}</p>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[250px]">
                            <p>{product.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {product.barcode && (
                        <div className="flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{product.barcode}</span>
                          <button
                            onClick={() => copyToClipboard(product.barcode!, 'Баркод')}
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                            title="Копирай баркод"
                          >
                            {copiedText === product.barcode ? (
                              <Check className="w-3 h-3 text-success" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                        </div>
                      )}
                      {product.category?.name && (
                        <p className="text-xs text-muted-foreground mt-1">{product.category.name}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {product.is_bundle && (
                          <DropdownMenuItem onClick={() => openBundleView(product)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Виж компоненти
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Редактирай
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Изтрий
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
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
                      <p className="text-xs text-muted-foreground">Марж</p>
                      <p className="font-medium text-success">{margin(product)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Покупна</p>
                      <p className="font-medium text-success">{product.purchase_price.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Продажна</p>
                      <p className="font-medium text-success">{product.sale_price.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Products Table - Desktop */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader columnKey="sku">Код</SortableHeader>
                    <SortableHeader columnKey="name">Наименование</SortableHeader>
                    <SortableHeader columnKey="category">Категория</SortableHeader>
                    <SortableHeader columnKey="current_stock">Наличност</SortableHeader>
                    <SortableHeader columnKey="purchase_price">Покупна цена</SortableHeader>
                    <SortableHeader columnKey="sale_price">Продажна цена</SortableHeader>
                    <TableHead className="text-right">Марж</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Няма намерени артикули</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-sm">{product.sku}</span>
                            <button
                              onClick={() => copyToClipboard(product.sku, 'Код')}
                              className="p-0.5 hover:bg-muted rounded transition-colors"
                              title="Копирай код"
                            >
                              {copiedText === product.sku ? (
                                <Check className="w-3 h-3 text-success" />
                              ) : (
                                <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="font-medium max-w-[200px] truncate cursor-pointer">{product.name}</p>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[300px]">
                                    <p>{product.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {getBundleTypeBadge(product)}
                            </div>
                            {product.barcode && (
                              <div className="flex items-center gap-1">
                                <Barcode className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{product.barcode}</span>
                                <button
                                  onClick={() => copyToClipboard(product.barcode!, 'Баркод')}
                                  className="p-0.5 hover:bg-muted rounded transition-colors"
                                  title="Копирай баркод"
                                >
                                  {copiedText === product.barcode ? (
                                    <Check className="w-3 h-3 text-success" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
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
                        <TableCell className="text-right text-success font-medium">{product.purchase_price.toFixed(2)} €</TableCell>
                        <TableCell className="text-right text-success font-medium">{product.sale_price.toFixed(2)} €</TableCell>
                        <TableCell className="text-right text-success">{margin(product)}%</TableCell>
                        <TableCell>{getStockStatus(product)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {product.is_bundle && (
                                <DropdownMenuItem onClick={() => openBundleView(product)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Виж компоненти
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Редактирай
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(product.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Изтрий
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? 'Редактиране на артикул' : 'Нов артикул'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sku">Код (SKU) *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Напр. PROD-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Баркод</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="EAN/UPC код"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Наименование *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Име на продукта"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание на продукта"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Избери категория" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Мерна единица</Label>
              <Select
                value={formData.unit_id}
                onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Избери ед." />
                </SelectTrigger>
                <SelectContent>
                  {inventory.units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Покупна цена (€)</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Продажна цена (€)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_stock">Количество (бр.)</Label>
              <Input
                id="current_stock"
                type="number"
                step="1"
                min="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Минимална наличност</Label>
              <Input
                id="min_stock_level"
                type="number"
                step="1"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отказ
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.sku || !formData.name}>
              {editProduct ? 'Запази' : 'Създай'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие не може да бъде отменено. Артикулът ще бъде изтрит завинаги.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Bundle Components Dialog */}
      <Dialog open={bundleViewProduct !== null} onOpenChange={() => setBundleViewProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              Компоненти на комплект
            </DialogTitle>
          </DialogHeader>
          {bundleViewProduct && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{bundleViewProduct.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{bundleViewProduct.sku}</p>
                {bundleViewProduct.external_bundle_type && (
                  <Badge variant="outline" className="mt-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {bundleViewProduct.external_bundle_type}
                  </Badge>
                )}
              </div>
              
              {loadingComponents ? (
                <div className="flex items-center justify-center py-8">
                  <Package className="w-6 h-6 animate-pulse text-muted-foreground" />
                </div>
              ) : bundleComponents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Няма намерени компоненти</p>
                  <p className="text-xs mt-1">Синхронизирайте продуктите от e-commerce платформата</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Съдържа {bundleComponents.length} компонент{bundleComponents.length !== 1 ? 'а' : ''}:
                  </p>
                  <div className="border rounded-lg divide-y">
                    {bundleComponents.map((component) => (
                      <div key={component.id} className="flex items-center justify-between p-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{component.product?.name || 'Неизвестен продукт'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{component.product?.sku || '-'}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="secondary" className="font-mono">
                            x{component.component_quantity}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={
                              (component.product?.current_stock || 0) <= 0 
                                ? 'bg-destructive/15 text-destructive border-destructive/30' 
                                : 'bg-success/15 text-success border-success/30'
                            }
                          >
                            {component.product?.current_stock || 0} бр.
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleViewProduct(null)}>
              Затвори
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
