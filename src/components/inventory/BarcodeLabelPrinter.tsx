import { FC, useState, useRef } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { InventoryProduct } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Search, Tag, Barcode, Euro, Hash } from 'lucide-react';

interface BarcodeLabelPrinterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
  preSelectedProducts?: InventoryProduct[];
}

type LabelSize = 'small' | 'medium' | 'large';

interface LabelConfig {
  width: number;
  height: number;
  fontSize: number;
  barcodeHeight: number;
}

const LABEL_CONFIGS: Record<LabelSize, LabelConfig> = {
  small: { width: 50, height: 25, fontSize: 8, barcodeHeight: 15 },
  medium: { width: 70, height: 35, fontSize: 10, barcodeHeight: 20 },
  large: { width: 100, height: 50, fontSize: 12, barcodeHeight: 30 },
};

export const BarcodeLabelPrinter: FC<BarcodeLabelPrinterProps> = ({
  open,
  onOpenChange,
  inventory,
  preSelectedProducts = [],
}) => {
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(
    new Map(preSelectedProducts.map(p => [p.id, 1]))
  );
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showName, setShowName] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = inventory.products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.set(productId, 1);
    }
    setSelectedProducts(newSelected);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const newSelected = new Map(selectedProducts);
    if (quantity <= 0) {
      newSelected.delete(productId);
    } else {
      newSelected.set(productId, quantity);
    }
    setSelectedProducts(newSelected);
  };

  const totalLabels = Array.from(selectedProducts.values()).reduce((sum, qty) => sum + qty, 0);

  const generateBarcodeDataUrl = (code: string): string => {
    // Simple Code128 barcode representation using SVG
    // This is a simplified version - for production, use a proper barcode library
    const barWidth = 2;
    const height = LABEL_CONFIGS[labelSize].barcodeHeight;
    
    // Create a simple pattern (this is a visual representation, not a scannable barcode)
    // For real barcodes, integrate JsBarcode or similar library
    let pattern = '';
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      pattern += (charCode % 2 === 0 ? '1' : '0');
      pattern += (charCode % 3 === 0 ? '1' : '0');
      pattern += (charCode % 5 === 0 ? '1' : '0');
    }
    
    let x = 0;
    const bars: string[] = [];
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        bars.push(`<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black"/>`);
      }
      x += barWidth;
    }
    
    const svgWidth = x + 10;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${height + 5}">${bars.join('')}</svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const handlePrint = () => {
    const config = LABEL_CONFIGS[labelSize];
    
    const labels: string[] = [];
    
    selectedProducts.forEach((quantity, productId) => {
      const product = inventory.products.find(p => p.id === productId);
      if (!product) return;
      
      const barcodeCode = product.barcode || product.sku;
      
      for (let i = 0; i < quantity; i++) {
        labels.push(`
          <div class="label" style="
            width: ${config.width}mm;
            height: ${config.height}mm;
            border: 1px dashed #ccc;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            font-family: Arial, sans-serif;
            font-size: ${config.fontSize}pt;
            page-break-inside: avoid;
            box-sizing: border-box;
          ">
            ${showName ? `<div style="font-weight: bold; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; font-size: ${config.fontSize - 1}pt;">${product.name}</div>` : ''}
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1mm;">
              <img src="${generateBarcodeDataUrl(barcodeCode)}" style="max-width: 100%;" />
              <div style="font-family: monospace; font-size: ${config.fontSize - 2}pt;">${barcodeCode}</div>
            </div>
            <div style="display: flex; justify-content: space-between; width: 100%; font-size: ${config.fontSize - 1}pt;">
              ${showSku ? `<span>${product.sku}</span>` : '<span></span>'}
              ${showPrice ? `<span style="font-weight: bold;">${product.sale_price.toFixed(2)} €</span>` : ''}
            </div>
          </div>
        `);
      }
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Печат на етикети</title>
          <style>
            @page {
              size: auto;
              margin: 5mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .labels-container {
              display: flex;
              flex-wrap: wrap;
              gap: 2mm;
            }
            @media print {
              .labels-container {
                gap: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${labels.join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Печат на етикети с баркод
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Selection */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Търси продукт..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedProducts.has(product.id) ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <Checkbox checked={selectedProducts.has(product.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{product.sku}</span>
                        {product.barcode && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Barcode className="w-3 h-3" />
                              {product.barcode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-sm">{product.sale_price.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Settings and Preview */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Размер на етикета</Label>
                  <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Малък (50x25mm)</SelectItem>
                      <SelectItem value="medium">Среден (70x35mm)</SelectItem>
                      <SelectItem value="large">Голям (100x50mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Показване на:</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="showName"
                        checked={showName}
                        onCheckedChange={(c) => setShowName(!!c)}
                      />
                      <label htmlFor="showName" className="text-sm">Име</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="showSku"
                        checked={showSku}
                        onCheckedChange={(c) => setShowSku(!!c)}
                      />
                      <label htmlFor="showSku" className="text-sm">SKU</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="showPrice"
                        checked={showPrice}
                        onCheckedChange={(c) => setShowPrice(!!c)}
                      />
                      <label htmlFor="showPrice" className="text-sm">Цена</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Products with Quantities */}
            <Card>
              <CardContent className="pt-4">
                <Label className="mb-2 block">Избрани продукти ({selectedProducts.size})</Label>
                <ScrollArea className="h-[150px]">
                  {selectedProducts.size === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Изберете продукти за печат
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Array.from(selectedProducts.entries()).map(([productId, quantity]) => {
                        const product = inventory.products.find(p => p.id === productId);
                        if (!product) return null;
                        
                        return (
                          <div key={productId} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 truncate">{product.name}</span>
                            <Input
                              type="number"
                              min={1}
                              value={quantity}
                              onChange={(e) => updateQuantity(productId, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 text-center"
                            />
                            <span className="text-muted-foreground">бр.</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <Label className="mb-2 block">Преглед на етикет</Label>
                <div 
                  className="bg-white border rounded-lg p-2 flex flex-col items-center justify-center mx-auto"
                  style={{
                    width: `${LABEL_CONFIGS[labelSize].width}mm`,
                    height: `${LABEL_CONFIGS[labelSize].height}mm`,
                    fontSize: `${LABEL_CONFIGS[labelSize].fontSize}pt`,
                  }}
                >
                  {showName && <div className="font-bold text-center truncate w-full text-[0.8em]">Примерен продукт</div>}
                  <div className="flex flex-col items-center my-1">
                    <Barcode className="w-full h-4" />
                    <span className="font-mono text-[0.7em]">1234567890</span>
                  </div>
                  <div className="flex justify-between w-full text-[0.8em]">
                    {showSku && <span>SKU-001</span>}
                    {showPrice && <span className="font-bold">99.99 €</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Общо етикети за печат: <strong>{totalLabels}</strong>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отказ
            </Button>
            <Button onClick={handlePrint} disabled={selectedProducts.size === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Печат
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
