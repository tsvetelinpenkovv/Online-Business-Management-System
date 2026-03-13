import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ScanBarcode, Package, Plus, Minus, Check, AlertCircle, Camera, X, Video
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MovementType } from '@/types/inventory';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMovementType?: 'in' | 'out';
}

interface ScannedProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  current_stock: number;
  purchase_price: number;
  sale_price: number;
}

interface ScannedItem {
  product: ScannedProduct;
  quantity: number;
}

export const BarcodeScannerDialog: FC<BarcodeScannerDialogProps> = ({ 
  open, 
  onOpenChange, 
  defaultMovementType = 'in'
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out'>(defaultMovementType);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [lastScanned, setLastScanned] = useState<ScannedProduct | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState('');
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check camera & BarcodeDetector support
  useEffect(() => {
    const hasCamera = !!navigator.mediaDevices?.getUserMedia;
    const hasDetector = 'BarcodeDetector' in window;
    setCameraSupported(hasCamera && hasDetector);
  }, []);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setScannedItems([]);
      setLastScanned(null);
      setNotFound(false);
    } else {
      stopCamera();
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Start scanning with BarcodeDetector
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
      });

      let lastDetected = '';
      let lastDetectedTime = 0;

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            const now = Date.now();
            // Debounce: don't re-detect same code within 2 seconds
            if (code !== lastDetected || now - lastDetectedTime > 2000) {
              lastDetected = code;
              lastDetectedTime = now;
              await lookupAndAdd(code);
            }
          }
        } catch {}
      }, 300);
    } catch (err) {
      toast({ title: 'Грешка', description: 'Няма достъп до камерата', variant: 'destructive' });
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const lookupAndAdd = async (barcode: string) => {
    setSearching(true);
    setNotFound(false);

    const { data, error } = await supabase
      .from('inventory_products')
      .select('id, name, sku, barcode, current_stock, purchase_price, sale_price')
      .or(`barcode.eq.${barcode},sku.ilike.${barcode}`)
      .limit(1)
      .maybeSingle();

    setSearching(false);

    if (error || !data) {
      setNotFound(true);
      setLastScanned(null);
      toast({ 
        title: 'Не е намерен', 
        description: `Артикул с баркод/код "${barcode}" не съществува`,
        variant: 'destructive'
      });
      return;
    }

    const product: ScannedProduct = {
      id: data.id,
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      current_stock: data.current_stock ?? 0,
      purchase_price: data.purchase_price ?? 0,
      sale_price: data.sale_price ?? 0,
    };

    setLastScanned(product);
    
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

    // Play success beep
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const barcode = barcodeInput.trim();
    setBarcodeInput('');
    await lookupAndAdd(barcode);
    inputRef.current?.focus();
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

  const startEditQty = (productId: string, currentQty: number) => {
    setEditingQtyId(productId);
    setEditingQtyValue(String(currentQty));
  };

  const commitEditQty = (productId: string) => {
    const val = parseInt(editingQtyValue, 10);
    if (!isNaN(val) && val > 0) {
      setScannedItems(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity: val } : item
        )
      );
    } else if (val === 0 || editingQtyValue === '') {
      setScannedItems(prev => prev.filter(item => item.product.id !== productId));
    }
    setEditingQtyId(null);
  };

  const handleConfirm = async () => {
    if (scannedItems.length === 0) return;

    setProcessing(true);
    try {
      for (const item of scannedItems) {
        const price = movementType === 'in' 
          ? item.product.purchase_price 
          : item.product.sale_price;

        const stockBefore = item.product.current_stock;
        const stockAfter = movementType === 'in' 
          ? stockBefore + item.quantity 
          : stockBefore - item.quantity;

        await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product.id,
            movement_type: movementType as MovementType,
            quantity: item.quantity,
            unit_price: price,
            total_price: item.quantity * price,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reason: 'Сканиране на баркод',
          });
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

          {/* Camera View */}
          {cameraActive && (
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-48 object-cover"
                playsInline
                muted
              />
              {/* Scan guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-16 border-2 border-success/70 rounded-lg" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/50 hover:bg-background/80"
                onClick={stopCamera}
              >
                <X className="w-4 h-4" />
              </Button>
              {searching && (
                <div className="absolute bottom-2 left-2 right-2 bg-background/80 rounded px-2 py-1 text-center text-xs text-muted-foreground">
                  Търсене...
                </div>
              )}
            </div>
          )}

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
                    disabled={searching}
                  />
                </div>
                {cameraSupported && (
                  <Button
                    type="button"
                    variant={cameraActive ? 'default' : 'outline'}
                    size="icon"
                    onClick={toggleCamera}
                    title="Сканирай с камера"
                  >
                    {cameraActive ? <Video className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  </Button>
                )}
                <Button type="submit" size="icon" disabled={searching}>
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
                    <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product.sku} • Налични: {item.product.current_stock}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQuantity(item.product.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      {editingQtyId === item.product.id ? (
                        <Input
                          type="number"
                          value={editingQtyValue}
                          onChange={(e) => setEditingQtyValue(e.target.value)}
                          onBlur={() => commitEditQty(item.product.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEditQty(item.product.id); }}
                          className="w-16 h-7 text-center text-sm p-1"
                          min={0}
                          autoFocus
                        />
                      ) : (
                        <button
                          className="w-12 text-center font-medium cursor-pointer hover:bg-muted rounded px-1 py-0.5 text-sm"
                          onClick={() => startEditQty(item.product.id, item.quantity)}
                          title="Натиснете за ръчно въвеждане на количество"
                        >
                          {item.quantity}
                        </button>
                      )}
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
                <span className="text-lg font-bold">{totalValue.toFixed(2)} лв.</span>
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
