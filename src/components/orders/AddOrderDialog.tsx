import { FC, useState, useEffect } from 'react';
import { Order, ORDER_STATUSES, OrderStatus } from '@/types/order';
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
import { StatusBadge } from './StatusBadge';
import { supabase } from '@/integrations/supabase/client';

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrder: (order: Omit<Order, 'id' | 'created_at' | 'user_id'>) => Promise<Order | null>;
}

export const AddOrderDialog: FC<AddOrderDialogProps> = ({ open, onOpenChange, onCreateOrder }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    customer_email: '',
    phone: '',
    product_name: '',
    catalog_number: '',
    quantity: 1,
    total_price: 0,
    delivery_address: '',
    comment: '',
    status: 'Нова' as OrderStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(0);

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

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.phone || !formData.product_name) {
      return;
    }

    setIsSubmitting(true);
    try {
      const customerName = `${formData.first_name} ${formData.last_name}`.trim();
      const newCode = String(lastOrderId + 1);
      
      const order = await onCreateOrder({
        code: newCode,
        customer_name: customerName,
        customer_email: formData.customer_email || null,
        phone: formData.phone,
        product_name: formData.product_name,
        catalog_number: formData.catalog_number || null,
        quantity: formData.quantity,
        total_price: formData.total_price,
        delivery_address: formData.delivery_address || null,
        comment: formData.comment || null,
        status: formData.status,
        source: 'phone',
        is_correct: true,
        courier_tracking_url: null,
        courier_id: null,
      });

      if (order) {
        setFormData({
          first_name: '',
          last_name: '',
          customer_email: '',
          phone: '',
          product_name: '',
          catalog_number: '',
          quantity: 1,
          total_price: 0,
          delivery_address: '',
          comment: '',
          status: 'Нова',
        });
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product_name">Продукт *</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="Име на продукта"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog_number">Каталожен номер</Label>
            <Input
              id="catalog_number"
              value={formData.catalog_number}
              onChange={(e) => setFormData({ ...formData, catalog_number: e.target.value })}
              placeholder="SKU / Код на продукт"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Количество</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="total_price">Обща цена (€)</Label>
            <Input
              id="total_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.total_price}
              onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
            />
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
            disabled={isSubmitting || !formData.first_name || !formData.phone || !formData.product_name}
          >
            {isSubmitting ? 'Създаване...' : 'Създай поръчка'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};