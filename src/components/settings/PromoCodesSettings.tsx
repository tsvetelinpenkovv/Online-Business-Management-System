import { FC, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, Percent, DollarSign, Copy, Check, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  description: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  min_order_amount: number | null;
  used_count: number;
  created_at: string;
}

export const PromoCodesSettings: FC = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState('percentage');
  const [formValue, setFormValue] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formMinAmount, setFormMinAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCodes(data as PromoCode[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const resetForm = () => {
    setFormCode('');
    setFormType('percentage');
    setFormValue('');
    setFormDescription('');
    setFormActive(true);
    setFormValidFrom('');
    setFormValidUntil('');
    setFormMaxUses('');
    setFormMinAmount('');
    setEditingCode(null);
  };

  const openEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormCode(code.code);
    setFormType(code.discount_type);
    setFormValue(String(code.discount_value));
    setFormDescription(code.description || '');
    setFormActive(code.is_active);
    setFormValidFrom(code.valid_from ? code.valid_from.split('T')[0] : '');
    setFormValidUntil(code.valid_until ? code.valid_until.split('T')[0] : '');
    setFormMaxUses(code.max_uses ? String(code.max_uses) : '');
    setFormMinAmount(code.min_order_amount ? String(code.min_order_amount) : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formCode || !formValue) {
      toast({ title: 'Грешка', description: 'Кодът и стойността са задължителни', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      code: formCode.toUpperCase().trim(),
      discount_type: formType,
      discount_value: Number(formValue),
      description: formDescription || null,
      is_active: formActive,
      valid_from: formValidFrom || null,
      valid_until: formValidUntil || null,
      max_uses: formMaxUses ? Number(formMaxUses) : null,
      min_order_amount: formMinAmount ? Number(formMinAmount) : null,
    };

    let error;
    if (editingCode) {
      ({ error } = await supabase.from('promo_codes').update(payload).eq('id', editingCode.id));
    } else {
      ({ error } = await supabase.from('promo_codes').insert(payload));
    }

    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Успех', description: editingCode ? 'Промокодът е обновен' : 'Промокодът е създаден' });
      resetForm();
      setDialogOpen(false);
      fetchCodes();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Успех', description: 'Промокодът е изтрит' });
      fetchCodes();
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('promo_codes').update({ is_active: active }).eq('id', id);
    fetchCodes();
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5" />Промокодове</CardTitle>
              <CardDescription>Управление на промоционални кодове за отстъпки</CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />Нов код
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма създадени промокодове</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Отстъпка</TableHead>
                  <TableHead>Валидност</TableHead>
                  <TableHead>Употреби</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map(code => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">{code.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(code.code, code.id)}>
                          {copiedId === code.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                      {code.description && <p className="text-xs text-muted-foreground mt-0.5">{code.description}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {code.discount_type === 'percentage' ? (
                          <><Percent className="w-3 h-3 mr-1" />{code.discount_value}%</>
                        ) : (
                          <><DollarSign className="w-3 h-3 mr-1" />{code.discount_value} €</>
                        )}
                      </Badge>
                      {code.min_order_amount && (
                        <p className="text-xs text-muted-foreground mt-0.5">Мин. поръчка: {code.min_order_amount} €</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {code.valid_from && <div>От: {format(new Date(code.valid_from), 'dd.MM.yyyy')}</div>}
                      {code.valid_until && <div>До: {format(new Date(code.valid_until), 'dd.MM.yyyy')}</div>}
                      {!code.valid_from && !code.valid_until && '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{code.used_count}</span>
                      {code.max_uses && <span className="text-xs text-muted-foreground">/{code.max_uses}</span>}
                    </TableCell>
                    <TableCell>
                      <Switch checked={code.is_active} onCheckedChange={(v) => handleToggle(code.id, v)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(code)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(code.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Редактиране на промокод' : 'Нов промокод'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Код *</Label>
                <Input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="ЛЯТО2024" className="font-mono uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Тип отстъпка</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Процент (%)</SelectItem>
                    <SelectItem value="fixed">Фиксирана сума (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Стойност *</Label>
                <Input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} placeholder={formType === 'percentage' ? '10' : '5.00'} />
              </div>
              <div className="space-y-2">
                <Label>Мин. поръчка (€)</Label>
                <Input type="number" value={formMinAmount} onChange={e => setFormMinAmount(e.target.value)} placeholder="Без минимум" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Лятна промоция" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Валиден от</Label>
                <Input type="date" value={formValidFrom} onChange={e => setFormValidFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Валиден до</Label>
                <Input type="date" value={formValidUntil} onChange={e => setFormValidUntil(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Макс. употреби</Label>
                <Input type="number" value={formMaxUses} onChange={e => setFormMaxUses(e.target.value)} placeholder="Без лимит" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
                <Label>Активен</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Отказ</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingCode ? 'Запази' : 'Създай'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
