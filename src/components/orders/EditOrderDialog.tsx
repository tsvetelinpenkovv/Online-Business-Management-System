import { FC, useEffect, useState } from 'react';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

  useEffect(() => {
    if (order) {
      setFormData(order);
    }
  }, [order]);

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
              onValueChange={(value) => setFormData({ ...formData, status: value as Order['status'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Избери статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Нова">Нова</SelectItem>
                <SelectItem value="Изпратена">Изпратена</SelectItem>
                <SelectItem value="Доставена">Доставена</SelectItem>
                <SelectItem value="Отказана">Отказана</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Източник</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value as Order['source'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Избери източник" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="woocommerce">WooCommerce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Switch
              id="is_correct"
              checked={formData.is_correct ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, is_correct: checked })}
            />
            <Label htmlFor="is_correct">Коректен клиент</Label>
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
            <Label htmlFor="courier_tracking_url">Товарителница (URL)</Label>
            <Input
              id="courier_tracking_url"
              value={formData.courier_tracking_url || ''}
              onChange={(e) => setFormData({ ...formData, courier_tracking_url: e.target.value })}
              placeholder="https://www.econt.com/services/track-shipment.html?shipmentNumber=..."
            />
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
