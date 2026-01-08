import { FC, useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { InventoryCategory } from '@/types/inventory';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  Plus, Search, Pencil, Trash2, FolderTree, MoreHorizontal, Package
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoriesTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const CategoriesTab: FC<CategoriesTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<InventoryCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  const filteredCategories = inventory.categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = inventory.categories.find(c => c.id === parentId);
    return parent?.name || '-';
  };

  const getProductCount = (categoryId: string) => {
    return inventory.products.filter(p => p.category_id === categoryId).length;
  };

  const openCreateDialog = () => {
    setEditCategory(null);
    setFormData({
      name: '',
      description: '',
      parent_id: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: InventoryCategory) => {
    setEditCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editCategory) {
      await inventory.updateCategory(editCategory.id, {
        ...formData,
        parent_id: formData.parent_id || null,
      });
    } else {
      await inventory.createCategory({
        ...formData,
        parent_id: formData.parent_id || null,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await inventory.deleteCategory(deleteId);
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
            placeholder="Търси категория..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Нова категория
        </Button>
      </div>

      {/* Categories - Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredCategories.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <FolderTree className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Няма намерени категории</p>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderTree className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="font-medium truncate">{category.name}</p>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Редактирай
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(category.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Изтрий
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
                    {getParentName(category.parent_id) !== '-' && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>Родител:</span>
                        <Badge variant="outline">{getParentName(category.parent_id)}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{getProductCount(category.id)}</span>
                      <span className="text-muted-foreground">артикула</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Categories Table - Desktop */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Наименование</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Родителска категория</TableHead>
                    <TableHead className="text-right">Артикули</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <FolderTree className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Няма намерени категории</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>{getParentName(category.parent_id)}</TableCell>
                        <TableCell className="text-right">{getProductCount(category.id)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Редактирай
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(category.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editCategory ? 'Редактиране на категория' : 'Нова категория'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Наименование *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Име на категорията"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание на категорията"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Родителска категория</Label>
              <Select
                value={formData.parent_id}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Няма (основна категория)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Няма (основна категория)</SelectItem>
                  {inventory.categories
                    .filter(c => c.id !== editCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отказ
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editCategory ? 'Запази' : 'Създай'}
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
              Това действие не може да бъде отменено. Категорията ще бъде изтрита.
              Артикулите в тази категория ще останат без категория.
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
