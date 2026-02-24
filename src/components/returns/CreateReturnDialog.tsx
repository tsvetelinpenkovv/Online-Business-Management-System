import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useReturns, RETURN_REASONS, ITEM_CONDITIONS, ReturnItem } from '@/hooks/useReturns';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemForm {
  product_name: string;
  catalog_number: string;
  quantity: number;
  unit_price: number;
  reason: string;
  condition: string;
  restock: boolean;
}

const emptyItem: ItemForm = {
  product_name: '',
  catalog_number: '',
  quantity: 1,
  unit_price: 0,
  reason: '',
  condition: 'good',
  restock: true,
};

export const CreateReturnDialog = ({ open, onOpenChange }: Props) => {
  const { createReturn } = useReturns();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    reason: 'defect' as keyof typeof RETURN_REASONS,
    reason_details: '',
    return_type: 'full' as 'full' | 'partial',
    refund_amount: 0,
    refund_method: 'bank_transfer',
  });

  const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }]);

  const handleSubmit = async () => {
    if (!form.customer_name) return;
    setSaving(true);

    const totalFromItems = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    await createReturn(
      {
        order_id: form.order_id ? parseInt(form.order_id) : null,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        status: 'requested',
        reason: form.reason,
        reason_details: form.reason_details || null,
        return_type: form.return_type,
        refund_amount: form.refund_amount || totalFromItems,
        refund_method: form.refund_method,
        credit_note_id: null,
        stock_restored: false,
        created_by: user?.id || null,
      },
      items.filter(i => i.product_name).map(i => ({
        product_name: i.product_name,
        catalog_number: i.catalog_number || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.quantity * i.unit_price,
        reason: i.reason || null,
        condition: i.condition,
        restock: i.restock,
      }))
    );

    setSaving(false);
    onOpenChange(false);
    // Reset
    setForm({ order_id: '', customer_name: '', customer_phone: '', reason: 'defect', reason_details: '', return_type: 'full', refund_amount: 0, refund_method: 'bank_transfer' });
    setItems([{ ...emptyItem }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Нова заявка за връщане</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Поръчка №</Label>
              <Input placeholder="Напр. 1234" value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))} />
            </div>
            <div>
              <Label>Тип връщане</Label>
              <Select value={form.return_type} onValueChange={v => setForm(f => ({ ...f, return_type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Пълно</SelectItem>
                  <SelectItem value="partial">Частично</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Клиент *</Label>
              <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Причина</Label>
              <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RETURN_REASONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Метод за възстановяване</Label>
              <Select value={form.refund_method} onValueChange={v => setForm(f => ({ ...f, refund_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличен</SelectItem>
                  <SelectItem value="card">Карта</SelectItem>
                  <SelectItem value="bank_transfer">Банков превод</SelectItem>
                  <SelectItem value="store_credit">Кредит в магазина</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Допълнителни детайли</Label>
            <Textarea value={form.reason_details} onChange={e => setForm(f => ({ ...f, reason_details: e.target.value }))} rows={2} />
          </div>

          <div>
            <Label>Сума за възстановяване</Label>
            <Input type="number" step="0.01" value={form.refund_amount} onChange={e => setForm(f => ({ ...f, refund_amount: parseFloat(e.target.value) || 0 }))} />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Артикули</Label>
              <Button variant="outline" size="sm" onClick={() => setItems(i => [...i, { ...emptyItem }])}>
                <Plus className="w-3 h-3 mr-1" />Добави
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-[1fr_100px_80px_80px_auto] gap-2 items-end">
                    <div>
                      <Label className="text-xs">Продукт</Label>
                      <Input value={item.product_name} onChange={e => { const ni = [...items]; ni[idx].product_name = e.target.value; setItems(ni); }} placeholder="Име на продукта" />
                    </div>
                    <div>
                      <Label className="text-xs">Кат. №</Label>
                      <Input value={item.catalog_number} onChange={e => { const ni = [...items]; ni[idx].catalog_number = e.target.value; setItems(ni); }} />
                    </div>
                    <div>
                      <Label className="text-xs">К-во</Label>
                      <Input type="number" min={1} value={item.quantity} onChange={e => { const ni = [...items]; ni[idx].quantity = parseInt(e.target.value) || 1; setItems(ni); }} />
                    </div>
                    <div>
                      <Label className="text-xs">Цена</Label>
                      <Input type="number" step="0.01" value={item.unit_price} onChange={e => { const ni = [...items]; ni[idx].unit_price = parseFloat(e.target.value) || 0; setItems(ni); }} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => items.length > 1 && setItems(items.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={item.condition} onValueChange={v => { const ni = [...items]; ni[idx].condition = v; setItems(ni); }}>
                      <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ITEM_CONDITIONS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox checked={item.restock} onCheckedChange={v => { const ni = [...items]; ni[idx].restock = !!v; setItems(ni); }} />
                      Върни в склада
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.customer_name}>
              {saving ? 'Създаване...' : 'Създай заявка'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
