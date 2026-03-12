import { FC, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/hooks/useInventory';
import { 
  Hash, Plus, Search, Package, Filter, Trash2, Edit, 
  CheckCircle, XCircle, ShoppingCart, RotateCcw, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface SerialNumber {
  id: string;
  product_id: string;
  serial_number: string;
  status: string;
  batch_id: string | null;
  order_id: number | null;
  warehouse_id: string | null;
  notes: string | null;
  received_at: string;
  sold_at: string | null;
  created_at: string;
  product?: { name: string; sku: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  available: { label: 'Наличен', color: 'bg-success/15 text-success border-success/30', icon: CheckCircle },
  sold: { label: 'Продаден', color: 'bg-info/15 text-info border-info/30', icon: ShoppingCart },
  reserved: { label: 'Резервиран', color: 'bg-warning/15 text-warning border-warning/30', icon: Package },
  returned: { label: 'Върнат', color: 'bg-purple/15 text-purple border-purple/30', icon: RotateCcw },
  defective: { label: 'Дефектен', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};

interface SerialNumbersTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const SerialNumbersTab: FC<SerialNumbersTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [newProductId, setNewProductId] = useState('');
  const [newSerials, setNewSerials] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const trackedProducts = useMemo(() => 
    inventory.products.filter(p => (p as any).track_serial_numbers),
    [inventory.products]
  );

  const fetchSerialNumbers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('serial_numbers')
      .select('*, product:inventory_products(name, sku)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на серийни номера', variant: 'destructive' });
    } else {
      setSerialNumbers((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSerialNumbers(); }, []);

  const filtered = useMemo(() => {
    return serialNumbers.filter(sn => {
      if (statusFilter !== 'all' && sn.status !== statusFilter) return false;
      if (productFilter !== 'all' && sn.product_id !== productFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return sn.serial_number.toLowerCase().includes(q) ||
          sn.product?.name?.toLowerCase().includes(q) ||
          sn.product?.sku?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [serialNumbers, search, statusFilter, productFilter]);

  const stats = useMemo(() => ({
    total: serialNumbers.length,
    available: serialNumbers.filter(s => s.status === 'available').length,
    sold: serialNumbers.filter(s => s.status === 'sold').length,
    defective: serialNumbers.filter(s => s.status === 'defective').length,
  }), [serialNumbers]);

  const handleAdd = async () => {
    if (!newProductId || !newSerials.trim()) return;
    setSaving(true);

    const serials = newSerials.split('\n').map(s => s.trim()).filter(Boolean);
    const records = serials.map(sn => ({
      product_id: newProductId,
      serial_number: sn,
      notes: newNotes || null,
    }));

    const { error } = await supabase.from('serial_numbers').insert(records);
    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Успех', description: `${serials.length} серийни номера добавени` });
      setIsAddOpen(false);
      setNewSerials('');
      setNewNotes('');
      fetchSerialNumbers();
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'sold') updates.sold_at = new Date().toISOString();
    if (newStatus === 'available') updates.sold_at = null;

    const { error } = await supabase.from('serial_numbers').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      fetchSerialNumbers();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('serial_numbers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      fetchSerialNumbers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общо</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Налични</p>
                <p className="text-2xl font-bold text-success">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Продадени</p>
                <p className="text-2xl font-bold text-info">{stats.sold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дефектни</p>
                <p className="text-2xl font-bold text-destructive">{stats.defective}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Търси по сериен номер, продукт..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички статуси</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Продукт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички продукти</SelectItem>
                {inventory.products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добави
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map(sn => {
            const cfg = STATUS_CONFIG[sn.status] || STATUS_CONFIG.available;
            return (
              <Card key={sn.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono font-bold">{sn.serial_number}</p>
                      <p className="text-sm text-muted-foreground">{sn.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{sn.product?.sku}</p>
                    </div>
                    <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(sn.received_at), 'dd.MM.yyyy', { locale: bg })}
                    </span>
                    <div className="flex gap-1">
                      <Select value={sn.status} onValueChange={(v) => handleStatusChange(sn.id, v)}>
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                            <SelectItem key={key} value={key}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(sn.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сериен номер</TableHead>
                  <TableHead>Продукт</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Поръчка</TableHead>
                  <TableHead>Получен</TableHead>
                  <TableHead>Бележки</TableHead>
                  <TableHead className="w-[140px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Няма намерени серийни номера
                    </TableCell>
                  </TableRow>
                ) : filtered.map(sn => {
                  const cfg = STATUS_CONFIG[sn.status] || STATUS_CONFIG.available;
                  return (
                    <TableRow key={sn.id}>
                      <TableCell className="font-mono font-bold">{sn.serial_number}</TableCell>
                      <TableCell>{sn.product?.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{sn.product?.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell>{sn.order_id ? `#${sn.order_id}` : '—'}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(sn.received_at), 'dd.MM.yyyy', { locale: bg })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {sn.notes || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Select value={sn.status} onValueChange={(v) => handleStatusChange(sn.id, v)}>
                            <SelectTrigger className="h-7 w-[110px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                                <SelectItem key={key} value={key}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(sn.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Добави серийни номера
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Продукт</Label>
              <Select value={newProductId} onValueChange={setNewProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете продукт..." />
                </SelectTrigger>
                <SelectContent>
                  {inventory.products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Серийни номера (по един на ред)</Label>
              <Textarea
                value={newSerials}
                onChange={(e) => setNewSerials(e.target.value)}
                placeholder={"SN-001\nSN-002\nSN-003"}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                {newSerials.split('\n').filter(s => s.trim()).length} серийни номера
              </p>
            </div>
            <div className="space-y-2">
              <Label>Бележки (незадължително)</Label>
              <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Партида, доставчик..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Отказ</Button>
            <Button onClick={handleAdd} disabled={!newProductId || !newSerials.trim() || saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Добави
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
