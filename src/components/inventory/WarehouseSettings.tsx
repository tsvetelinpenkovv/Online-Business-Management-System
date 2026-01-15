import { FC, useState } from 'react';
import { useWarehouses } from '@/hooks/useWarehouses';
import { Warehouse } from '@/types/warehouse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Warehouse as WarehouseIcon, Plus, Pencil, Trash2, MapPin, Phone, Star } from 'lucide-react';

export const WarehouseSettings: FC = () => {
  const { 
    warehouses, 
    multiWarehouseEnabled, 
    loading, 
    toggleMultiWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useWarehouses();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    is_default: false,
    is_active: true,
  });

  const openCreateDialog = () => {
    setEditWarehouse(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      phone: '',
      is_default: warehouses.length === 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setEditWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      city: warehouse.city || '',
      phone: warehouse.phone || '',
      is_default: warehouse.is_default,
      is_active: warehouse.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      name: formData.name,
      code: formData.code,
      address: formData.address || null,
      city: formData.city || null,
      phone: formData.phone || null,
      is_default: formData.is_default,
      is_active: formData.is_active,
    };

    if (editWarehouse) {
      await updateWarehouse(editWarehouse.id, data);
    } else {
      await createWarehouse(data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteWarehouse(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Зареждане...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Toggle for multi-warehouse mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5" />
            Многоскладов режим
          </CardTitle>
          <CardDescription>
            Активирайте тази опция, ако имате повече от един физически склад или локация. 
            Ако работите само с един склад, оставете деактивирано.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="multi-warehouse">Активиране на многоскладов режим</Label>
              <p className="text-sm text-muted-foreground">
                {multiWarehouseEnabled 
                  ? 'Наличностите се следят по отделни складове' 
                  : 'Използва се един общ склад за всички продукти'}
              </p>
            </div>
            <Switch
              id="multi-warehouse"
              checked={multiWarehouseEnabled}
              onCheckedChange={toggleMultiWarehouse}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warehouses list - only show if enabled */}
      {multiWarehouseEnabled && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Складове</CardTitle>
              <CardDescription>Управление на физическите локации</CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Добави склад
            </Button>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <WarehouseIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Няма добавени складове</p>
                <p className="text-sm">Добавете първия си склад</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Име</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Град</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{warehouse.name}</span>
                          {warehouse.is_default && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="w-3 h-3" />
                              Основен
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                          {warehouse.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {warehouse.city && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {warehouse.city}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {warehouse.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {warehouse.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                          {warehouse.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(warehouse)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(warehouse.id)}
                          disabled={warehouse.is_default}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editWarehouse ? 'Редактиране на склад' : 'Нов склад'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Име *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Склад София"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Код *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SOF"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Град</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="София"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="бул. България 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+359 888 123 456"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">Основен склад</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Активен</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отказ
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.code}>
              {editWarehouse ? 'Запази' : 'Създай'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на склад</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете този склад? 
              Всички наличности в него ще бъдат премахнати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
