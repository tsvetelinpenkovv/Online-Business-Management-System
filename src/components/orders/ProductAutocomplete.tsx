import { forwardRef, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Package, Barcode, Loader2, AlertTriangle } from 'lucide-react';

interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  sale_price: number | null;
  current_stock: number;
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (product: InventoryProduct) => void;
  placeholder?: string;
  className?: string;
  requiredQuantity?: number; // For stock validation
  showStockWarning?: boolean;
}

export const ProductAutocomplete = forwardRef<HTMLDivElement, ProductAutocompleteProps>(({
  value,
  onChange,
  onSelect,
  placeholder = 'Име на продукта',
  className = '',
  requiredQuantity = 1,
  showStockWarning = true,
}, ref) => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch products when value changes - ONLY if user has interacted
  useEffect(() => {
    const searchProducts = async () => {
      // Only search if user has interacted with input
      if (!userInteracted || value.length < 2) {
        setProducts([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('inventory_products')
          .select('id, name, sku, sale_price, current_stock')
          .or(`name.ilike.%${value}%,sku.ilike.%${value}%`)
          .eq('is_active', true)
          .limit(10);

        if (!error && data) {
          setProducts(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [value, userInteracted]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: InventoryProduct) => {
    onChange(product.name);
    setSelectedProduct(product);
    onSelect?.(product);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setUserInteracted(false); // Reset after selection
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || products.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < products.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && products[selectedIndex]) {
          handleSelect(products[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Stock warning
  const showWarning = showStockWarning && selectedProduct && selectedProduct.current_stock < requiredQuantity;

  return (
    <div ref={ref || wrapperRef} className={`relative ${className}`}>
      <div ref={wrapperRef} className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setUserInteracted(true);
            onChange(e.target.value);
            setSelectedIndex(-1);
            setSelectedProduct(null);
          }}
          onFocus={() => {
            // Only show suggestions if user has already interacted
            if (userInteracted && products.length > 0) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pr-8 ${showWarning ? 'border-warning focus-visible:ring-warning' : ''}`}
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Stock warning message */}
      {showWarning && (
        <div className="flex items-center gap-1.5 mt-1 text-warning text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Недостатъчна наличност! Налични: {selectedProduct.current_stock} бр., нужни: {requiredQuantity} бр.
          </span>
        </div>
      )}

      {showSuggestions && products.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
          {products.map((product, index) => {
            const lowStock = product.current_stock < requiredQuantity;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  index === selectedIndex 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Barcode className="w-3 h-3" />
                      {product.sku}
                    </span>
                    {product.sale_price && (
                      <span className="text-success">{product.sale_price.toFixed(2)} €</span>
                    )}
                    <span className={`flex items-center gap-0.5 ${lowStock ? 'text-warning' : product.current_stock > 0 ? 'text-success' : 'text-destructive'}`}>
                      {lowStock && <AlertTriangle className="w-3 h-3" />}
                      {product.current_stock} бр.
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

ProductAutocomplete.displayName = 'ProductAutocomplete';
