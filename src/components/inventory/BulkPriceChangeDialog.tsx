import { useState, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Percent, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';

interface BulkPriceChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
}

type PriceField = 'purchase_price' | 'sale_price' | 'both';
type ChangeDirection = 'increase' | 'decrease';

export const BulkPriceChangeDialog = ({ open, onOpenChange, inventory }: BulkPriceChangeDialogProps) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceField, setPriceField] = useState<PriceField>('sale_price');
  const [direction, setDirection] = useState<ChangeDirection>('increase');
  const [percentage, setPercentage] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const filteredProducts = useMemo(() => {
    return inventory.products.filter(p => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'none') return !p.category_id;
      return p.category_id === selectedCategory;
    });
  }, [inventory.products, selectedCategory]);

  const previewData = useMemo(() => {
    return filteredProducts
      .filter(p => selectedProducts.has(p.id))
      .map(p => {
        const multiplier = direction === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);
        const oldPurchase = p.purchase_price;
        const oldSale = p.sale_price;
        const newPurchase = priceField === 'sale_price' ? oldPurchase : Math.round(oldPurchase * multiplier * 100) / 100;
        const newSale = priceField === 'purchase_price' ? oldSale : Math.round(oldSale * multiplier * 100) / 100;
        return { ...p, oldPurchase, oldSale, newPurchase, newSale };
      });
  }, [filteredProducts, selectedProducts, direction, percentage, priceField]);

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleProduct = (id: string) => {
    const next = new Set(selectedProducts);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedProducts(next);
  };

  const applyChanges = async () => {
    if (previewData.length === 0 || percentage <= 0) return;
    setIsApplying(true);

    let successCount = 0;
    for (const item of previewData) {
      const updates: Record<string, number> = {};
      if (priceField !== 'sale_price') updates.purchase_price = item.newPurchase;
      if (priceField !== 'purchase_price') updates.sale_price = item.newSale;

      const { error } = await supabase
        .from('inventory_products')
        .update(updates)
        .eq('id', item.id);

      if (!error) successCount++;
    }

    toast({
      title: 'Готово',
      description: `Цените на ${successCount} от ${previewData.length} артикула бяха обновени.`,
    });

    await inventory.refreshProducts();
    setIsApplying(false);
    setShowPreview(false);
    setSelectedProducts(new Set());
    setPercentage(0);
    onOpenChange(false);
  };

  const reset = () => {
    setSelectedCategory('all');
    setPriceField('sale_price');
    setDirection('increase');
    setPercentage(0);
    setSelectedProducts(new Set());
    setShowPreview(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Масова промяна на цени
          </DialogTitle>
          <DialogDescription>
            Променете цените на всички артикули в дадена категория с определен процент.
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            {/* Category select */}
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички категории</SelectItem>
                  <SelectItem value="none">Без категория</SelectItem>
                  {inventory.categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price field */}
            <div className="space-y-2">
              <Label>Ценово поле</Label>
              <Select value={priceField} onValueChange={(v) => setPriceField(v as PriceField)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale_price">Продажна цена</SelectItem>
                  <SelectItem value="purchase_price">Доставна цена</SelectItem>
                  <SelectItem value="both">И двете</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction & percentage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Посока</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as ChangeDirection)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-600" /> Увеличение</span>
                    </SelectItem>
                    <SelectItem value="decrease">
                      <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-600" /> Намаление</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Процент (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Product selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Артикули ({filteredProducts.length})</Label>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedProducts.size === filteredProducts.length ? 'Премахни всички' : 'Избери всички'}
                </Button>
              </div>
              <div className="max-h-[250px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead className="text-right">Доставна</TableHead>
                      <TableHead className="text-right">Продажна</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(p => (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => toggleProduct(p.id)}>
                        <TableCell>
                          <Checkbox checked={selectedProducts.has(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-orange-600">{p.purchase_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm text-green-600">{p.sale_price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          /* Preview */
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-md bg-warning/10 border border-warning/30">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <p className="text-sm">
                {direction === 'increase' ? 'Увеличение' : 'Намаление'} с <strong>{percentage}%</strong> за <strong>{previewData.length}</strong> артикула
              </p>
            </div>
            <div className="max-h-[350px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Артикул</TableHead>
                    {priceField !== 'sale_price' && <>
                      <TableHead className="text-right">Стара дост.</TableHead>
                      <TableHead className="text-right">Нова дост.</TableHead>
                    </>}
                    {priceField !== 'purchase_price' && <>
                      <TableHead className="text-right">Стара прод.</TableHead>
                      <TableHead className="text-right">Нова прод.</TableHead>
                    </>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </TableCell>
                      {priceField !== 'sale_price' && <>
                        <TableCell className="text-right text-sm text-muted-foreground line-through">{p.oldPurchase.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-orange-600">{p.newPurchase.toFixed(2)}</TableCell>
                      </>}
                      {priceField !== 'purchase_price' && <>
                        <TableCell className="text-right text-sm text-muted-foreground line-through">{p.oldSale.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600">{p.newSale.toFixed(2)}</TableCell>
                      </>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {showPreview ? (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)}>Назад</Button>
              <Button onClick={applyChanges} disabled={isApplying}>
                {isApplying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Приложи промените
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowPreview(true)}
              disabled={selectedProducts.size === 0 || percentage <= 0}
            >
              Преглед ({selectedProducts.size} артикула)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
