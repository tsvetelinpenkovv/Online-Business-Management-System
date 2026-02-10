import { FC, useState, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { usePermissions } from '@/hooks/usePermissions';
import { Supplier } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Search, Pencil, Trash2, Users, Phone, Mail, MapPin, MoreHorizontal, ArrowUpDown, Building, User, Hash
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

type SupplierSortKey = 'name' | 'contact_person' | 'phone' | 'email' | 'eik' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface SuppliersTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const SuppliersTab: FC<SuppliersTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [sortKey, setSortKey] = useState<SupplierSortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    eik: '',
    vat_number: '',
    notes: '',
    is_active: true,
  });

  const handleSort = (key: SupplierSortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ columnKey, children }: { columnKey: SupplierSortKey; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === columnKey ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  const filteredAndSortedSuppliers = useMemo(() => {
    const filtered = inventory.suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'bg');
          break;
        case 'contact_person':
          comparison = (a.contact_person || '').localeCompare(b.contact_person || '', 'bg');
          break;
        case 'phone':
          comparison = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'eik':
          comparison = (a.eik || '').localeCompare(b.eik || '');
          break;
        case 'is_active':
          comparison = (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [inventory.suppliers, search, sortKey, sortDirection]);

  const filteredSuppliers = inventory.suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      eik: '',
      vat_number: '',
      notes: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      eik: supplier.eik || '',
      vat_number: supplier.vat_number || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editSupplier) {
      await inventory.updateSupplier(editSupplier.id, formData);
    } else {
      await inventory.createSupplier(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await inventory.deleteSupplier(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Търси доставчик..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Нов доставчик
        </Button>
      </div>

      {/* Suppliers - Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredAndSortedSuppliers.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Няма намерени доставчици</p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedSuppliers.map((supplier) => (
              <Card key={supplier.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{supplier.name}</p>
                        {supplier.is_active ? (
                          <Badge className="bg-success text-success-foreground shrink-0">Активен</Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">Неактивен</Badge>
                        )}
                      </div>
                      {supplier.contact_person && (
                        <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Редактирай
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(supplier.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Изтрий
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2 mt-3 pt-3 border-t">
                    {supplier.phone && (
                      <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {supplier.phone}
                      </a>
                    )}
                    {supplier.email && (
                      <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {supplier.email}
                      </a>
                    )}
                    {supplier.address && (
                      <p className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        {supplier.address}
                      </p>
                    )}
                    {supplier.eik && (
                      <p className="text-xs text-muted-foreground">
                        ЕИК: <span className="font-mono">{supplier.eik}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Suppliers Table - Desktop */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader columnKey="name">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      Наименование
                    </SortableHeader>
                    <SortableHeader columnKey="contact_person">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Контактно лице
                    </SortableHeader>
                    <SortableHeader columnKey="phone">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Телефон
                    </SortableHeader>
                    <SortableHeader columnKey="email">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Имейл
                    </SortableHeader>
                    <SortableHeader columnKey="eik">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      ЕИК
                    </SortableHeader>
                    <SortableHeader columnKey="is_active">Статус</SortableHeader>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Няма намерени доставчици</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {supplier.address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{supplier.contact_person || '-'}</TableCell>
                        <TableCell>
                          {supplier.phone && (
                            <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 text-sm hover:text-primary">
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.email && (
                            <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 text-sm hover:text-primary">
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{supplier.eik || '-'}</TableCell>
                        <TableCell>
                          {supplier.is_active ? (
                            <Badge className="bg-success text-success-foreground">Активен</Badge>
                          ) : (
                            <Badge variant="secondary">Неактивен</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Редактирай
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(supplier.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Изтрий
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editSupplier ? 'Редактиране на доставчик' : 'Нов доставчик'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Наименование *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Име на фирмата"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Контактно лице</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Име на контакт"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+359..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eik">ЕИК</Label>
              <Input
                id="eik"
                value={formData.eik}
                onChange={(e) => setFormData({ ...formData, eik: e.target.value })}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_number">ДДС номер</Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                placeholder="BG123456789"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Адрес</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Пълен адрес"
                rows={2}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Бележки</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Допълнителни бележки"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Активен доставчик</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отказ
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editSupplier ? 'Запази' : 'Създай'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие не може да бъде отменено. Доставчикът ще бъде изтрит завинаги.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
