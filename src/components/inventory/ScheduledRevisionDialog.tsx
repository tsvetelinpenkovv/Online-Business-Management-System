import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useInventory } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { CalendarIcon, ClipboardList, Loader2, Check, X, Package } from 'lucide-react';

interface ScheduledRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
}

type RevisionStep = 'setup' | 'count' | 'review';

export const ScheduledRevisionDialog = ({ open, onOpenChange, inventory }: ScheduledRevisionDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<RevisionStep>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [revisionDate, setRevisionDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countedStock, setCountedStock] = useState<Record<string, string>>({});

  const productsToRevise = useMemo(() => {
    return inventory.products.filter(p => {
      if (!p.is_active) return false;
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'none') return !p.category_id;
      return p.category_id === selectedCategory;
    });
  }, [inventory.products, selectedCategory]);

  const differences = useMemo(() => {
    return productsToRevise
      .map(p => {
        const counted = countedStock[p.id];
        if (counted === undefined || counted === '') return null;
        const countedNum = Number(counted);
        if (isNaN(countedNum)) return null;
        const diff = countedNum - p.current_stock;
        if (diff === 0) return null;
        return { product: p, counted: countedNum, difference: diff };
      })
      .filter(Boolean) as { product: typeof productsToRevise[0]; counted: number; difference: number }[];
  }, [productsToRevise, countedStock]);

  const handleSubmitRevision = async () => {
    if (differences.length === 0) {
      toast({ title: 'Няма разлики', description: 'Всички наличности съвпадат.' });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    const items = differences.map(d => ({
      productId: d.product.id,
      quantity: d.counted,
      unitPrice: d.product.purchase_price,
    }));

    const doc = await inventory.createStockDocument(
      'inventory',
      items,
      undefined,
      undefined,
      `Инвентаризация от ${format(revisionDate, 'd MMM yyyy', { locale: bg })}\n${notes}\n\nКорекции:\n${differences.map(d => `- ${d.product.name}: ${d.product.current_stock} → ${d.counted} (${d.difference > 0 ? '+' : ''}${d.difference})`).join('\n')}`
    );

    if (doc) {
      toast({
        title: 'Инвентаризация завършена',
        description: `Документ ${doc.document_number} е създаден с ${differences.length} корекции.`,
      });
    }

    setIsSubmitting(false);
    reset();
    onOpenChange(false);
  };

  const reset = () => {
    setStep('setup');
    setSelectedCategory('all');
    setRevisionDate(new Date());
    setNotes('');
    setCountedStock({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Инвентаризация
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Изберете категория и дата за ревизия.'}
            {step === 'count' && 'Въведете действителните наличности.'}
            {step === 'review' && 'Прегледайте разликите и потвърдете.'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-2">
          {['setup', 'count', 'review'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s ? 'bg-primary text-primary-foreground' : i < ['setup', 'count', 'review'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
              `}>
                {i < ['setup', 'count', 'review'].indexOf(step) ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички категории ({inventory.products.filter(p => p.is_active).length} артикула)</SelectItem>
                  <SelectItem value="none">Без категория</SelectItem>
                  {inventory.categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Дата на ревизия</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(revisionDate, 'd MMMM yyyy', { locale: bg })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={revisionDate} onSelect={(d) => d && setRevisionDate(d)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Бележки</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Допълнителни бележки..." rows={3} />
            </div>
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
              <Package className="w-4 h-4 inline mr-1" />
              Ще бъдат проверени <strong>{productsToRevise.length}</strong> артикула.
            </div>
          </div>
        )}

        {step === 'count' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">
              Въведете действителната наличност за всеки артикул. Празните полета ще бъдат игнорирани.
            </p>
            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Артикул</TableHead>
                    <TableHead className="text-right w-24">Системна</TableHead>
                    <TableHead className="text-right w-28">Действителна</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsToRevise.map(p => {
                    const val = countedStock[p.id] ?? '';
                    const diff = val !== '' && !isNaN(Number(val)) ? Number(val) - p.current_stock : 0;
                    return (
                      <TableRow key={p.id} className={diff !== 0 ? (diff > 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20') : ''}>
                        <TableCell>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{p.current_stock}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) => setCountedStock(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-24 text-right ml-auto"
                            placeholder="-"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            {differences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Всички наличности съвпадат!</p>
                <p className="text-sm">Няма нужда от корекции.</p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-md bg-warning/10 border border-warning/30 text-sm">
                  Открити <strong>{differences.length}</strong> разлики. Ще бъде създаден документ за инвентаризация.
                </div>
                <div className="max-h-[350px] overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Артикул</TableHead>
                        <TableHead className="text-right">Системна</TableHead>
                        <TableHead className="text-right">Действителна</TableHead>
                        <TableHead className="text-right">Разлика</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {differences.map(d => (
                        <TableRow key={d.product.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{d.product.name}</p>
                            <p className="text-xs text-muted-foreground">{d.product.sku}</p>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{d.product.current_stock}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{d.counted}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={d.difference > 0 ? 'default' : 'destructive'} className="font-mono">
                              {d.difference > 0 ? '+' : ''}{d.difference}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'setup' && (
            <Button onClick={() => setStep('count')} disabled={productsToRevise.length === 0}>
              Започни броене ({productsToRevise.length})
            </Button>
          )}
          {step === 'count' && (
            <>
              <Button variant="outline" onClick={() => setStep('setup')}>Назад</Button>
              <Button onClick={() => setStep('review')}>
                Преглед на разликите ({differences.length})
              </Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('count')}>Назад</Button>
              <Button onClick={handleSubmitRevision} disabled={isSubmitting || differences.length === 0}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Приложи корекциите
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
