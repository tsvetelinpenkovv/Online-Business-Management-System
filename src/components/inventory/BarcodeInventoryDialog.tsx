import { FC, useState, useEffect, useRef, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ScanBarcode, Package, Check, AlertCircle, X, Download,
  ClipboardCheck, ArrowUpDown, CheckCircle, XCircle, Minus as MinusIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InventoryProduct } from '@/types/inventory';
import { useIsMobile } from '@/hooks/use-mobile';

interface BarcodeInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
}

interface ScannedEntry {
  product: InventoryProduct;
  scannedQty: number;
  systemQty: number;
  difference: number;
}

export const BarcodeInventoryDialog: FC<BarcodeInventoryDialogProps> = ({ open, onOpenChange, inventory }) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [entries, setEntries] = useState<Map<string, ScannedEntry>>(new Map());
  const [notFoundList, setNotFoundList] = useState<string[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setEntries(new Map());
      setNotFoundList([]);
      setTotalScans(0);
    }
  }, [open]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const barcode = barcodeInput.trim();
    setBarcodeInput('');
    setTotalScans(prev => prev + 1);

    const product = inventory.products.find(
      p => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
    );

    if (!product) {
      setNotFoundList(prev => [...new Set([...prev, barcode])]);
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
      return;
    }

    setEntries(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(product.id);
      if (existing) {
        const newQty = existing.scannedQty + 1;
        newMap.set(product.id, {
          ...existing,
          scannedQty: newQty,
          difference: newQty - existing.systemQty,
        });
      } else {
        newMap.set(product.id, {
          product,
          scannedQty: 1,
          systemQty: product.current_stock,
          difference: 1 - product.current_stock,
        });
      }
      return newMap;
    });
  };

  const updateScannedQty = (productId: string, qty: number) => {
    setEntries(prev => {
      const newMap = new Map(prev);
      const entry = newMap.get(productId);
      if (entry) {
        const newQty = Math.max(0, qty);
        newMap.set(productId, {
          ...entry,
          scannedQty: newQty,
          difference: newQty - entry.systemQty,
        });
      }
      return newMap;
    });
  };

  const entriesArray = useMemo(() => Array.from(entries.values()), [entries]);
  
  const summary = useMemo(() => {
    const matched = entriesArray.filter(e => e.difference === 0).length;
    const surplus = entriesArray.filter(e => e.difference > 0).length;
    const deficit = entriesArray.filter(e => e.difference < 0).length;
    return { matched, surplus, deficit, total: entriesArray.length };
  }, [entriesArray]);

  const matchPercent = summary.total > 0 ? (summary.matched / summary.total) * 100 : 0;

  const handleApplyAdjustments = async () => {
    const adjustments = entriesArray.filter(e => e.difference !== 0);
    if (adjustments.length === 0) {
      toast({ title: 'Няма разлики', description: 'Всички наличности съвпадат' });
      return;
    }

    try {
      for (const entry of adjustments) {
        await inventory.createStockMovement(
          entry.product.id,
          'adjustment',
          Math.abs(entry.difference),
          entry.product.purchase_price,
          `Корекция от баркод инвентаризация: ${entry.difference > 0 ? '+' : ''}${entry.difference}`
        );
      }
      toast({ title: 'Успех', description: `${adjustments.length} корекции приложени` });
      onOpenChange(false);
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно прилагане на корекции', variant: 'destructive' });
    }
  };

  const exportResults = () => {
    let csv = 'Код,Продукт,Сканирано,Системно,Разлика,Статус\n';
    entriesArray.forEach(e => {
      const status = e.difference === 0 ? 'Съвпада' : e.difference > 0 ? 'Излишък' : 'Липса';
      csv += `"${e.product.sku}","${e.product.name}",${e.scannedQty},${e.systemQty},${e.difference},"${status}"\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `инвентаризация_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Баркод инвентаризация — Сканиране и сравнение
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner Input */}
          <form onSubmit={handleScan}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Сканирайте баркод или въведете SKU..."
                  className="pl-10"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <Button type="submit">
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Сканирания</p>
                <p className="text-xl font-bold">{totalScans}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Артикули</p>
                <p className="text-xl font-bold">{summary.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Съвпадат</p>
                <p className="text-xl font-bold text-success">{summary.matched}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Излишък</p>
                <p className="text-xl font-bold text-info">{summary.surplus}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Липса</p>
                <p className="text-xl font-bold text-destructive">{summary.deficit}</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          {summary.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Точност на наличностите</span>
                <span className="font-medium">{matchPercent.toFixed(0)}%</span>
              </div>
              <Progress value={matchPercent} className="h-2" />
            </div>
          )}

          {/* Not Found */}
          {notFoundList.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Ненамерени баркодове ({notFoundList.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {notFoundList.map(code => (
                  <Badge key={code} variant="outline" className="bg-destructive/5 text-destructive text-xs">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {entriesArray.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Продукт</TableHead>
                    <TableHead className="text-right w-[100px]">Сканирано</TableHead>
                    <TableHead className="text-right w-[100px]">Системно</TableHead>
                    <TableHead className="text-right w-[100px]">Разлика</TableHead>
                    <TableHead className="w-[80px]">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesArray.map(entry => (
                    <TableRow key={entry.product.id} className={
                      entry.difference !== 0 
                        ? entry.difference > 0 ? 'bg-info/5' : 'bg-destructive/5'
                        : 'bg-success/5'
                    }>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{entry.product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{entry.product.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={entry.scannedQty}
                          onChange={(e) => updateScannedQty(entry.product.id, parseInt(e.target.value) || 0)}
                          className="w-20 h-7 text-right ml-auto"
                          min={0}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">{entry.systemQty}</TableCell>
                      <TableCell className={`text-right font-bold ${
                        entry.difference > 0 ? 'text-info' : entry.difference < 0 ? 'text-destructive' : 'text-success'
                      }`}>
                        {entry.difference > 0 ? '+' : ''}{entry.difference}
                      </TableCell>
                      <TableCell>
                        {entry.difference === 0 ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : entry.difference > 0 ? (
                          <ArrowUpDown className="w-5 h-5 text-info" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={exportResults} disabled={entriesArray.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Експорт CSV
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Затвори
          </Button>
          <Button 
            onClick={handleApplyAdjustments} 
            disabled={summary.surplus + summary.deficit === 0}
            className="bg-primary"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Приложи корекции ({summary.surplus + summary.deficit})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
