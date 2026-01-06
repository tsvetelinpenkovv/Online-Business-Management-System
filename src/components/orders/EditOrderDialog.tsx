import { FC, useEffect, useState } from 'react';
import { Order, ORDER_STATUSES, OrderStatus } from '@/types/order';
import { useCouriers } from '@/hooks/useCouriers';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface EditOrderDialogProps {
  order: Order | null;
  onClose: () => void;
  onSave: (order: Order) => void;
}

export const EditOrderDialog: FC<EditOrderDialogProps> = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Order>>({});
  const { couriers, getCourierByUrl } = useCouriers();

  useEffect(() => {
    if (order) {
      setFormData(order);
    }
  }, [order]);

  // Auto-detect courier when tracking URL changes
  useEffect(() => {
    if (formData.courier_tracking_url && !formData.courier_id) {
      const detectedCourier = getCourierByUrl(formData.courier_tracking_url);
      if (detectedCourier) {
        setFormData(prev => ({ ...prev, courier_id: detectedCourier.id }));
      }
    }
  }, [formData.courier_tracking_url, getCourierByUrl]);

  const handleSave = () => {
    if (order && formData) {
      onSave({ ...order, ...formData } as Order);
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
            <Label htmlFor="code">Код</Label>
            <Input
              id="code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

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
            <Label htmlFor="total_price">Цена (€)</Label>
            <Input
              id="total_price"
              type="number"
              step="0.01"
              value={formData.total_price || ''}
              onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_name">Продукт</Label>
            <Input
              id="product_name"
              value={formData.product_name || ''}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalog_number">Каталожен номер</Label>
            <Input
              id="catalog_number"
              value={formData.catalog_number || ''}
              onChange={(e) => setFormData({ ...formData, catalog_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Количество</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select
              value={formData.status}
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
            >
              <SelectTrigger>
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
              Ако въведете пълен URL, куриерът се разпознава автоматично. При номер - изберете ръчно.
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
