import { FC, useState, useEffect, useCallback } from 'react';
import { Order, ORDER_STATUSES, OrderStatus, OrderSource } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProductAutocomplete } from './ProductAutocomplete';
import { Plus, Trash2 } from 'lucide-react';
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
import { StatusBadge } from './StatusBadge';
import { SourceIcon } from '@/components/icons/SourceIcon';
import { supabase } from '@/integrations/supabase/client';
import { useEcommercePlatforms } from '@/hooks/useEcommercePlatforms';
import { getFlagByCountryCode } from './StoreFilterTabs';
import { Store } from '@/hooks/useStores';

interface ProductItem {
  product_name: string;
  catalog_number: string;
  quantity: number;
  price: number;
}

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrder: (order: Omit<Order, 'id' | 'created_at' | 'user_id'> & { store_id?: string | null }) => Promise<Order | null>;
  selectedStoreId?: string | null;
  stores?: Store[];
}

export const AddOrderDialog: FC<AddOrderDialogProps> = ({ open, onOpenChange, onCreateOrder, selectedStoreId, stores = [] }) => {
  const { platforms } = useEcommercePlatforms();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    customer_email: '',
    phone: '',
    delivery_address: '',
    comment: '',
    status: 'Нова' as OrderStatus,
    source: 'phone' as OrderSource,
  });
  const [products, setProducts] = useState<ProductItem[]>([
    { product_name: '', catalog_number: '', quantity: 1, price: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(0);
  const [autoFillApplied, setAutoFillApplied] = useState(false);
  const enabledStores = stores.filter(s => s.is_enabled);
  const [manualStoreId, setManualStoreId] = useState<string | null>(null);

  // Determine effective store_id: if a specific tab is selected use it, otherwise use manual selection
  const effectiveStoreId = selectedStoreId || manualStoreId;

  useEffect(() => {
    if (open) {
      // Fetch the last order ID when dialog opens
      const fetchLastOrderId = async () => {
        const { data } = await supabase
          .from('orders')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setLastOrderId(data.id);
        }
      };
      fetchLastOrderId();
    }
  }, [open]);

  // Auto-fill from CRM when phone changes
  const checkAutoFill = useCallback(async (phone: string) => {
    if (phone.length < 7 || autoFillApplied) return;
    try {
      const { data } = await supabase
        .from('customers')
        .select('name, email, address, city')
        .eq('phone', phone)
        .maybeSingle();
      if (data) {
        const nameParts = data.name?.split(' ') || [];
        setFormData(prev => ({
          ...prev,
          first_name: prev.first_name || nameParts[0] || '',
          last_name: prev.last_name || nameParts.slice(1).join(' ') || '',
          customer_email: prev.customer_email || data.email || '',
          delivery_address: prev.delivery_address || [data.address, data.city].filter(Boolean).join(', ') || '',
        }));
        setAutoFillApplied(true);
      }
    } catch (e) { /* ignore */ }
  }, [autoFillApplied]);

  const addProduct = () => {
    setProducts([...products, { product_name: '', catalog_number: '', quantity: 1, price: 0 }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, updates: Partial<ProductItem>) => {
    setProducts(prev => {
      const newProducts = [...prev];
      newProducts[index] = { ...newProducts[index], ...updates };
      return newProducts;
    });
  };

  const updateProductField = (index: number, field: keyof ProductItem, value: string | number) => {
    setProducts(prev => {
      const newProducts = [...prev];
      newProducts[index] = { ...newProducts[index], [field]: value };
      return newProducts;
    });
  };

  const calculateTotalPrice = () => {
    return products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.phone || !products[0]?.product_name) {
      return;
    }

    setIsSubmitting(true);
    try {
      const customerName = `${formData.first_name} ${formData.last_name}`.trim();
      const newCode = String(lastOrderId + 1);
      
      // Combine products into a single string if multiple
      const productName = products.map(p => 
        p.quantity > 1 ? `${p.product_name} (x${p.quantity})` : p.product_name
      ).filter(n => n).join(', ');
      
      const catalogNumber = products.map(p => p.catalog_number).filter(c => c).join(', ');
      const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
      
      const selectedStore = stores.find(s => s.id === effectiveStoreId);
      
      const order = await onCreateOrder({
        code: newCode,
        customer_name: customerName,
        customer_email: formData.customer_email || null,
        phone: formData.phone,
        product_name: productName,
        catalog_number: catalogNumber || null,
        quantity: totalQuantity,
        total_price: calculateTotalPrice(),
        delivery_address: formData.delivery_address || null,
        comment: formData.comment || null,
        status: formData.status,
        source: formData.source,
        is_correct: null,
        courier_tracking_url: null,
        courier_id: null,
        store_id: effectiveStoreId || null,
      });

      if (order) {
        setFormData({
          first_name: '',
          last_name: '',
          customer_email: '',
          phone: '',
          delivery_address: '',
          comment: '',
          status: 'Нова',
          source: 'phone',
        });
        setProducts([{ product_name: '', catalog_number: '', quantity: 1, price: 0 }]);
        setAutoFillApplied(false);
        setManualStoreId(null);
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Нова поръчка</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as OrderStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <StatusBadge status={status} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Източник</Label>
            <Select
              value={formData.source || 'phone'}
              onValueChange={(value) => setFormData({ ...formData, source: value as OrderSource })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <SourceIcon source="phone" className="w-4 h-4" />
                    <span>Телефон</span>
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center gap-2">
                    <SourceIcon source="google" className="w-4 h-4" />
                    <span>Google</span>
                  </div>
                </SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center gap-2">
                    <SourceIcon source="facebook" className="w-4 h-4" />
                    <span>Facebook</span>
                  </div>
                </SelectItem>
                {platforms.filter(p => p.is_enabled).map((platform) => (
                  <SelectItem key={platform.name} value={platform.name}>
                    <div className="flex items-center gap-2">
                      <SourceIcon source={platform.name} className="w-4 h-4" />
                      <span>{platform.display_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Store selector - only show when on "All" tab and multi-store is enabled */}
          {!selectedStoreId && enabledStores.length > 0 && (
            <div className="space-y-2">
              <Label>Магазин</Label>
              <Select
                value={manualStoreId || ''}
                onValueChange={(val) => setManualStoreId(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Избери магазин..." />
                </SelectTrigger>
                <SelectContent>
                  {enabledStores.map((store) => {
                    const FlagComponent = getFlagByCountryCode(store.country_code);
                    return (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center gap-2">
                          {FlagComponent ? (
                            <FlagComponent className="w-5 h-3.5 flex-shrink-0 rounded-[1px]" />
                          ) : (
                            <span>{store.flag_emoji}</span>
                          )}
                          <span>{store.name} ({store.country_name})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="first_name">Име *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Име на клиента"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Фамилия</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Фамилия на клиента"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                checkAutoFill(e.target.value);
              }}
              placeholder="+359..."
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer_email">Имейл</Label>
            <Input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          {/* Products Section */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Продукти *</Label>
              <Button type="button" variant="default" size="sm" onClick={addProduct}>
                <Plus className="w-4 h-4 mr-1" />
                Добави продукт
              </Button>
            </div>
            
            {products.map((product, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30">
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <Label className="text-xs text-muted-foreground">Продукт</Label>
                  <ProductAutocomplete
                    value={product.product_name}
                    onChange={(val) => updateProductField(index, 'product_name', val)}
                    onSelect={(p) => {
                      // Update all product fields at once to prevent state issues
                      updateProduct(index, {
                        product_name: p.name,
                        catalog_number: p.sku,
                        price: p.sale_price || product.price,
                      });
                    }}
                    placeholder="Търси продукт..."
                    requiredQuantity={product.quantity}
                    showStockWarning={true}
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Каталожен №</Label>
                  <Input
                    value={product.catalog_number}
                    onChange={(e) => updateProductField(index, 'catalog_number', e.target.value)}
                    placeholder="SKU"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">К-во</Label>
                  <Input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => updateProductField(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Цена ({stores.find(s => s.id === effectiveStoreId)?.currency_symbol || '€'}) <span className="text-[10px] opacity-70">с ДДС</span></Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => updateProductField(index, 'price', parseFloat(e.target.value) || 0)}
                    className="text-success"
                  />
                </div>
                {products.length > 1 && (
                  <div className="col-span-12 sm:col-span-1 flex justify-end sm:justify-center">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeProduct(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="delivery_address">Адрес за доставка</Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Пълен адрес за доставка"
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comment">Коментар</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Бележки към поръчката"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !formData.first_name || !formData.phone || !products[0]?.product_name}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? 'Създаване...' : 'Създай поръчка'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};