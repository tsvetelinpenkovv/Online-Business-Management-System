import { FC, useMemo } from 'react';
import { Package, Layers, Barcode } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
// - "Product A (2 бр.) + Product B (3 бр.)"
// - "Product A x2, Product B x3"
// - "Product A | Product B | Product C"
// - "Product A; Product B; Product C"
const parseProducts = (productName: string, totalQuantity: number, catalogNumber?: string | null): ProductItem[] => {
  // Try to detect if there are multiple products
  const separators = [' + ', ' | ', '; ', ', '];
  
  for (const sep of separators) {
    if (productName.includes(sep)) {
      const parts = productName.split(sep).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts.map((part, index) => {
          // Try to extract quantity from patterns like "(2 бр.)" or "x2"
          const qtyMatch = part.match(/\((\d+)\s*(?:бр\.?|pcs?|x)\)/i) || part.match(/x(\d+)$/i);
          const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
          const name = part.replace(/\s*\((\d+)\s*(?:бр\.?|pcs?|x)\)/gi, '').replace(/\s*x\d+$/i, '').trim();
          
          return {
            name,
            quantity: qty,
            catalogNumber: index === 0 ? (catalogNumber || undefined) : undefined
          };
        });
      }
    }
  }
  
  // Single product
  return [{
    name: productName,
    quantity: totalQuantity,
    catalogNumber: catalogNumber || undefined
  }];
};

export const QuantityPopover: FC<QuantityPopoverProps> = ({ 
  productName, 
  quantity, 
  catalogNumber 
}) => {
  const products = useMemo(() => parseProducts(productName, quantity, catalogNumber), [productName, quantity, catalogNumber]);
  const hasMultipleProducts = products.length > 1;
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  
  const badge = (
    <span 
      className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-110 ${
        quantity > 1 || hasMultipleProducts
          ? 'bg-destructive/15 text-destructive hover:bg-destructive/25' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
      title={hasMultipleProducts ? `${products.length} различни продукта` : `Количество: ${quantity} бр.`}
    >
      {hasMultipleProducts ? `${products.length}×` : quantity}
    </span>
  );

  // If single product with quantity 1, no need for popover
  if (!hasMultipleProducts && quantity === 1) {
    return badge;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {badge}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="center">
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">
              {hasMultipleProducts 
                ? `${products.length} продукта (${totalItems} бр.)` 
                : `Количество: ${quantity} бр.`
              }
            </span>
          </div>
        </div>
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {products.map((product, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 p-2 rounded-md ${
                index % 2 === 0 ? 'bg-muted/20' : ''
              }`}
            >
              <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight break-words">
                  {product.name}
                </p>
                {product.catalogNumber && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Barcode className="w-3 h-3" />
                    {product.catalogNumber}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                product.quantity > 1 
                  ? 'bg-destructive/15 text-destructive' 
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
