import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCouriers } from '@/hooks/useCouriers';
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
import { Input } from '@/components/ui/input';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: () => void;
}

export const BulkEditDialog: FC<BulkEditDialogProps> = ({ open, onOpenChange, selectedIds, onSuccess }) => {
  const { toast } = useToast();
  const { couriers } = useCouriers();
  const [saving, setSaving] = useState(false);
  const [field, setField] = useState<string>('');
  const [value, setValue] = useState('');

  const fields = [
    { key: 'courier_id', label: 'Курьер', type: 'courier' },
    { key: 'source', label: 'Източник', type: 'select', options: ['woocommerce', 'shopify', 'phone', 'email', 'facebook', 'instagram'] },
    { key: 'delivery_address', label: 'Адрес за доставка', type: 'text' },
    { key: 'comment', label: 'Коментар', type: 'text' },
    { key: 'payment_status', label: 'Статус на плащане', type: 'select', options: ['unpaid', 'paid', 'partial', 'refunded'] },
  ];

  const handleSave = async () => {
    if (!field || !value) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ [field]: value })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: 'Успех',
        description: `${selectedIds.length} поръчки бяха обновени`,
      });
      onSuccess();
      onOpenChange(false);
      setField('');
      setValue('');
    } catch (err: any) {
      toast({
        title: 'Грешка',
        description: err.message || 'Неуспешно масово редактиране',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedField = fields.find(f => f.key === field);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Масово редактиране ({selectedIds.length} поръчки)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Поле за промяна</Label>
            <Select value={field} onValueChange={(v) => { setField(v); setValue(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Избери поле..." />
              </SelectTrigger>
              <SelectContent>
                {fields.map(f => (
                  <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedField && (
            <div className="space-y-2">
              <Label>Нова стойност</Label>
              {selectedField.type === 'text' && (
                <Input value={value} onChange={e => setValue(e.target.value)} placeholder={`Въведи ${selectedField.label.toLowerCase()}...`} />
              )}
              {selectedField.type === 'select' && (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Избери..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedField.options?.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedField.type === 'courier' && (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Избери курьер..." />
                  </SelectTrigger>
                  <SelectContent>
                    {couriers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
          <Button onClick={handleSave} disabled={saving || !field || !value}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Приложи към {selectedIds.length} поръчки
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
