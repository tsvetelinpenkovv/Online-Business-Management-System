import { FC, useState, useEffect, useRef } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ScanBarcode, Package, Plus, Minus, Check, AlertCircle, Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InventoryProduct, MovementType } from '@/types/inventory';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
  defaultMovementType?: 'in' | 'out';
}

interface ScannedItem {
  product: InventoryProduct;
  quantity: number;
}

export const BarcodeScannerDialog: FC<BarcodeScannerDialogProps> = ({ 
  open, 
  onOpenChange, 
  inventory,
  defaultMovementType = 'in'
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out'>(defaultMovementType);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [lastScanned, setLastScanned] = useState<InventoryProduct | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setScannedItems([]);
      setLastScanned(null);
      setNotFound(false);
    }
  }, [open]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const barcode = barcodeInput.trim();
    setBarcodeInput('');
    setNotFound(false);

    // Find product by barcode or SKU
    const product = inventory.products.find(
      p => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
    );

    if (!product) {
      setNotFound(true);
      setLastScanned(null);
      toast({ 
        title: 'Не е намерен', 
        description: `Артикул с баркод/код "${barcode}" не съществува`,
        variant: 'destructive'
      });
      return;
    }

    setLastScanned(product);
    
    // Add to scanned items or increment quantity
    setScannedItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Play success sound (if available)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setScannedItems(prev => 
      prev.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setScannedItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleConfirm = async () => {
    if (scannedItems.length === 0) return;

    setProcessing(true);
    try {
      // Create movements for all scanned items
      for (const item of scannedItems) {
        const price = movementType === 'in' 
          ? item.product.purchase_price 
          : item.product.sale_price;

        await inventory.createStockMovement(
          item.product.id,
          movementType as MovementType,
          item.quantity,
          price,
          `Сканиране на баркод`
        );
      }

      toast({ 
        title: 'Успех', 
        description: `${movementType === 'in' ? 'Приход' : 'Разход'} на ${scannedItems.length} артикула записан` 
      });
      onOpenChange(false);
    } catch (err) {
      toast({ 
        title: 'Грешка', 
        description: 'Неуспешно записване на движенията',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalItems = scannedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = scannedItems.reduce((sum, item) => {
    const price = movementType === 'in' 
      ? item.product.purchase_price 
      : item.product.sale_price;
    return sum + (item.quantity * price);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5" />
            Сканиране на баркод
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Movement Type Selector */}
          <div className="flex gap-2">
            <Button
              variant={movementType === 'in' ? 'default' : 'outline'}
              className={movementType === 'in' ? 'bg-success hover:bg-success/90 flex-1' : 'flex-1'}
              onClick={() => setMovementType('in')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Приход
            </Button>
            <Button
              variant={movementType === 'out' ? 'default' : 'outline'}
              className={movementType === 'out' ? 'bg-destructive hover:bg-destructive/90 flex-1' : 'flex-1'}
              onClick={() => setMovementType('out')}
            >
              <Minus className="w-4 h-4 mr-2" />
              Разход
            </Button>
          </div>

          {/* Barcode Input */}
          <form onSubmit={handleBarcodeSubmit}>
            <div className="space-y-2">
              <Label htmlFor="barcode">Сканирайте или въведете баркод/код</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    id="barcode"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Баркод или SKU..."
                    className="pl-10"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <Button type="submit" size="icon">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Last Scanned Feedback */}
          {lastScanned && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-3">
              <Check className="w-5 h-5 text-success" />
              <div className="flex-1">
                <p className="font-medium text-sm">{lastScanned.name}</p>
                <p className="text-xs text-muted-foreground">{lastScanned.sku}</p>
              </div>
              <Badge className="bg-success text-success-foreground">+1</Badge>
            </div>
          )}

          {notFound && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm">Артикулът не е намерен в базата данни</p>
            </div>
          )}

          {/* Scanned Items List */}
          {scannedItems.length > 0 && (
            <div className="space-y-2">
              <Label>Сканирани артикули ({totalItems})</Label>
              <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                {scannedItems.map((item) => (
                  <div key={item.product.id} className="p-3 flex items-center gap-3">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQuantity(item.product.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQuantity(item.product.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Обща стойност:</span>
                <span className="text-lg font-bold">{totalValue.toFixed(2)} €</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={scannedItems.length === 0 || processing}
            className={movementType === 'in' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
          >
            {processing ? 'Обработка...' : `Запиши ${movementType === 'in' ? 'приход' : 'разход'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
