import { FC, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Supplier } from '@/types/inventory';

interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_sku: string | null;
  supplier_price: number;
  lead_time_days: number | null;
  is_preferred: boolean;
  notes: string | null;
  supplier?: { name: string };
}

interface Props {
  productId: string;
  suppliers: Supplier[];
}

export const SupplierProductsTab: FC<Props> = ({ productId, suppliers }) => {
  const [items, setItems] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  // Form
  const [supplierId, setSupplierId] = useState('');
  const [supplierSku, setSupplierSku] = useState('');
  const [supplierPrice, setSupplierPrice] = useState('');
  const [leadTime, setLeadTime] = useState('');

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('supplier_products')
      .select('*, supplier:suppliers(name)')
      .eq('product_id', productId)
      .order('is_preferred', { ascending: false });
    if (data) setItems(data as unknown as SupplierProduct[]);
    setLoading(false);
  }, [productId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAdd = async () => {
    if (!supplierId || !supplierPrice) return;
    setAdding(true);
    const { error } = await supabase.from('supplier_products').insert({
      product_id: productId,
      supplier_id: supplierId,
      supplier_sku: supplierSku || null,
      supplier_price: Number(supplierPrice),
      lead_time_days: leadTime ? Number(leadTime) : null,
    });
    if (error) {
      toast({ title: 'Грешка', description: error.message.includes('duplicate') ? 'Този доставчик вече е добавен' : error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Успех', description: 'Доставчикът е добавен' });
      setSupplierId(''); setSupplierSku(''); setSupplierPrice(''); setLeadTime('');
      fetch();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('supplier_products').delete().eq('id', id);
    fetch();
  };

  const togglePreferred = async (id: string, current: boolean) => {
    // If setting to preferred, unset others first
    if (!current) {
      await supabase.from('supplier_products').update({ is_preferred: false }).eq('product_id', productId);
    }
    await supabase.from('supplier_products').update({ is_preferred: !current }).eq('id', id);
    fetch();
  };

  const availableSuppliers = suppliers.filter(s => s.is_active && !items.some(i => i.supplier_id === s.id));

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Доставчик</TableHead>
              <TableHead>SKU на доставчик</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead>Срок (дни)</TableHead>
              <TableHead>Предпочитан</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.supplier?.name || '—'}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">{item.supplier_sku || '—'}</TableCell>
                <TableCell className="text-right">{item.supplier_price.toFixed(2)} €</TableCell>
                <TableCell>{item.lead_time_days || '—'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => togglePreferred(item.id, item.is_preferred)}
                  >
                    <Star className={`w-4 h-4 ${item.is_preferred ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {availableSuppliers.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
          <p className="text-sm font-medium">Добави доставчик</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Доставчик" /></SelectTrigger>
              <SelectContent>
                {availableSuppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={supplierSku} onChange={e => setSupplierSku(e.target.value)} placeholder="SKU" />
            <Input type="number" value={supplierPrice} onChange={e => setSupplierPrice(e.target.value)} placeholder="Цена (€)" />
            <div className="flex gap-2">
              <Input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="Дни" className="w-20" />
              <Button onClick={handleAdd} disabled={adding || !supplierId} size="sm">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && availableSuppliers.length === 0 && (
        <p className="text-center text-muted-foreground py-4">Няма налични доставчици. Добавете доставчици от таб „Доставчици".</p>
      )}
    </div>
  );
};
