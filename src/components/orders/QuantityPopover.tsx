import { FC, useMemo, useState } from 'react';
import { Package, Barcode, Copy, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductItem {
  name: string;
  quantity: number;
  catalogNumber?: string;
}

interface QuantityPopoverProps {
  productName: string;
  quantity: number;
  catalogNumber?: string | null;
}

// Parse product name to extract multiple products
// Supports formats like:
// - "Product A (x2), Product B (x3)"
// - "Product A (2 бр.) + Product B (3 бр.)"
// - "Product A | Product B | Product C"
const parseProducts = (productName: string, totalQuantity: number, catalogNumber?: string | null): ProductItem[] => {
  // Try to detect if there are multiple products by comma first
  const separators = [', ', ' + ', ' | ', '; '];
  
  for (const sep of separators) {
    if (productName.includes(sep)) {
      const parts = productName.split(sep).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        // Parse catalog numbers if they exist
        const codes = (catalogNumber || '').split(', ').map(c => c.trim());
        
        return parts.map((part, index) => {
          // Try to extract quantity from patterns like "(x2)" or "(2 бр.)"
          const qtyMatch = part.match(/\(x(\d+)\)$/i) || part.match(/\((\d+)\s*(?:бр\.?|pcs?)\)/i);
          const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
          const name = part.replace(/\s*\(x\d+\)$/i, '').replace(/\s*\((\d+)\s*(?:бр\.?|pcs?)\)/gi, '').trim();
          
          return {
            name,
            quantity: qty,
            catalogNumber: codes[index] || undefined
          };
        });
      }
    }
  }
  
  // Single product
  return [{
    name: productName.replace(/\s*\(x\d+\)$/i, '').trim(),
    quantity: totalQuantity,
    catalogNumber: catalogNumber || undefined
  }];
};

export const QuantityPopover: FC<QuantityPopoverProps> = ({ 
  productName, 
  quantity, 
  catalogNumber 
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const products = useMemo(() => parseProducts(productName, quantity, catalogNumber), [productName, quantity, catalogNumber]);
  const hasMultipleProducts = products.length > 1;
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  
  const handleCopyAll = async () => {
    const text = products.map(p => {
      let line = `${p.name} - ${p.quantity} бр.`;
      if (p.catalogNumber) {
        line += ` (${p.catalogNumber})`;
      }
      return line;
    }).join('\n');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Копирано в клипборда');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySku = async (sku: string) => {
    await navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    toast.success('Каталожен номер копиран');
    setTimeout(() => setCopiedSku(null), 2000);
  };
  
  // Red for single product qty > 1, amber for multiple products (2x, 3x, etc.)
  const getBadgeClasses = () => {
    if (hasMultipleProducts) {
      // Multiple products: amber/yellow for 2x, 3x, etc.
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    } else if (quantity > 1) {
      // Single product with qty > 1: red
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-muted text-muted-foreground';
  };

  const badge = (
    <span 
      className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-semibold cursor-pointer ${getBadgeClasses()}`}
      title={hasMultipleProducts ? `${products.length} различни продукта` : `Количество: ${quantity} бр.`}
    >
      {hasMultipleProducts ? `${products.length}×` : quantity}
    </span>
  );

  // Always show popover - even for single product with quantity 1
  return (
    <Popover>
      <PopoverTrigger asChild>
        {badge}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="center" sideOffset={8} showArrow>
        <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
          <span className="font-medium text-sm">
            {hasMultipleProducts ? 'Детайли на продуктите' : totalItems > 1 ? 'Детайли на продуктите' : 'Детайли на продукта'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            onClick={handleCopyAll}
            title="Копирай всички продукти"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
        <div className="p-2 max-h-[300px] overflow-y-auto select-text">
          {products.map((product, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 p-2 rounded-md ${
                index % 2 === 0 ? 'bg-muted/20' : ''
              }`}
            >
              <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight break-words cursor-text">
                  {product.name}
                </p>
                {product.catalogNumber && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Barcode className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground select-all cursor-text">{product.catalogNumber}</span>
                    <button
                      onClick={() => handleCopySku(product.catalogNumber!)}
                      className="p-0.5 hover:bg-muted rounded transition-colors"
                      title="Копирай каталожен номер"
                    >
                      {copiedSku === product.catalogNumber ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              <span className={`inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                product.quantity > 1 
                  ? hasMultipleProducts 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {product.quantity} бр.
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
