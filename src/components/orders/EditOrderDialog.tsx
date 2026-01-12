import { FC, useEffect, useState } from 'react';
import { Order, ORDER_STATUSES, OrderStatus } from '@/types/order';
import { useCouriers } from '@/hooks/useCouriers';
import { StatusBadge } from './StatusBadge';
import { ProductAutocomplete } from './ProductAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface ProductItem {
  product_name: string;
  catalog_number: string;
  quantity: number;
  price: number;
}

interface EditOrderDialogProps {
  order: Order | null;
  onClose: () => void;
  onSave: (order: Order) => void;
}

// Helper to parse products from order data
const parseProducts = (order: Order): ProductItem[] => {
  // If product_name contains commas, it might be multiple products
  const names = order.product_name.split(', ');
  const codes = (order.catalog_number || '').split(', ');
  
  if (names.length === 1) {
    return [{
      product_name: order.product_name.replace(/ \(x\d+\)$/, ''),
      catalog_number: order.catalog_number || '',
      quantity: order.quantity,
      price: order.total_price
    }];
  }
  
  // Multiple products
  return names.map((name, index) => {
    const qtyMatch = name.match(/\(x(\d+)\)$/);
    const cleanName = name.replace(/ \(x\d+\)$/, '');
    return {
      product_name: cleanName,
      catalog_number: codes[index] || '',
      quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1,
      price: 0 // Price per item unknown, will be calculated
    };
  });
};

export const EditOrderDialog: FC<EditOrderDialogProps> = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Order>>({});
  const [products, setProducts] = useState<ProductItem[]>([]);
  const { couriers, getCourierByUrl } = useCouriers();
  const [courierLocked, setCourierLocked] = useState(false);

  useEffect(() => {
    if (!order) return;

    setFormData(order);
    setProducts(parseProducts(order));
    // Let the second effect handle courier detection/locking.
    setCourierLocked(false);
  }, [order?.id]);

  // Auto-detect courier when tracking URL changes and lock if detected
  useEffect(() => {
    const url = formData.courier_tracking_url;

    if (!url) {
      setCourierLocked(false);
      return;
    }

    const detectedCourier = getCourierByUrl(url);

    if (!detectedCourier) {
      setCourierLocked(false);
      return;
    }

    setCourierLocked(true);
    setFormData((prev) => {
      // Avoid infinite loops: only update if the courier actually changed.
      if (prev.courier_id === detectedCourier.id) return prev;
      return { ...prev, courier_id: detectedCourier.id };
    });
  }, [formData.courier_tracking_url, getCourierByUrl]);

  const addProduct = () => {
    setProducts([...products, { product_name: '', catalog_number: '', quantity: 1, price: 0 }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof ProductItem, value: string | number) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const calculateTotalPrice = () => {
    return products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const handleSave = () => {
    if (order && formData) {
      // Combine products into order fields
      const productName = products.map(p => 
        p.quantity > 1 ? `${p.product_name} (x${p.quantity})` : p.product_name
      ).filter(n => n).join(', ');
      
      const catalogNumber = products.map(p => p.catalog_number).filter(c => c).join(', ');
      const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
      const totalPrice = calculateTotalPrice() || formData.total_price || 0;

      onSave({ 
        ...order, 
        ...formData,
        product_name: productName,
        catalog_number: catalogNumber || null,
        quantity: totalQuantity,
        total_price: totalPrice
      } as Order);
      onClose();
    }
  };

  return (
    <Dialog open={order !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактиране на поръчка #{order?.id}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Клиент</Label>
            <Input
              id="customer_name"
              value={formData.customer_name || ''}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email">Имейл</Label>
            <Input
              id="customer_email"
              type="email"
              value={formData.customer_email || ''}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              placeholder="client@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select
              value={formData.status || 'Нова'}
              onValueChange={(value) => setFormData({ ...formData, status: value as OrderStatus })}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Избери статус" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="cursor-pointer">
                    <StatusBadge status={status} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Section */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Продукти</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProduct}>
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
                    onChange={(val) => {
                      const newProducts = [...products];
                      newProducts[index] = { ...newProducts[index], product_name: val };
                      setProducts(newProducts);
                    }}
                    onSelect={(p) => {
                      const newProducts = [...products];
                      newProducts[index] = { 
                        ...newProducts[index], 
                        product_name: p.name,
                        catalog_number: p.sku,
                        price: p.sale_price || newProducts[index].price
                      };
                      setProducts(newProducts);
                    }}
                    placeholder="Търси продукт..."
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Каталожен №</Label>
                  <Input
                    value={product.catalog_number}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index] = { ...newProducts[index], catalog_number: e.target.value };
                      setProducts(newProducts);
                    }}
                    placeholder="SKU"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">К-во</Label>
                  <Input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index] = { ...newProducts[index], quantity: parseInt(e.target.value) || 1 };
                      setProducts(newProducts);
                    }}
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Цена (€) <span className="text-[10px] opacity-70">с ДДС</span></Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index] = { ...newProducts[index], price: parseFloat(e.target.value) || 0 };
                      setProducts(newProducts);
                    }}
                  />
                </div>
                <div className="col-span-12 sm:col-span-1 flex justify-end sm:justify-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeProduct(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="delivery_address">Адрес за доставка</Label>
            <Input
              id="delivery_address"
              value={formData.delivery_address || ''}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="courier_tracking_url">Товарителница (номер или линк)</Label>
            <Input
              id="courier_tracking_url"
              value={formData.courier_tracking_url || ''}
              onChange={(e) => setFormData({ ...formData, courier_tracking_url: e.target.value })}
              placeholder="Поставете линк или номер на товарителница"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="courier_id">Куриер</Label>
            <Select
              value={formData.courier_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, courier_id: value === 'none' ? null : value })}
              disabled={courierLocked}
            >
              <SelectTrigger className={courierLocked ? 'opacity-60 cursor-not-allowed' : ''}>
                <SelectValue placeholder="Избери куриер" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Без куриер —</SelectItem>
                {couriers.map((courier) => (
                  <SelectItem key={courier.id} value={courier.id}>
                    {courier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {courierLocked 
                ? 'Куриерът е заключен, защото е разпознат от линка. Премахнете линка, за да отключите.'
                : 'Ако въведете пълен URL, куриерът се разпознава автоматично и се заключва.'}
            </p>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="comment">Коментар</Label>
            <Textarea
              id="comment"
              value={formData.comment || ''}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отказ
          </Button>
          <Button onClick={handleSave}>
            Запази
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
