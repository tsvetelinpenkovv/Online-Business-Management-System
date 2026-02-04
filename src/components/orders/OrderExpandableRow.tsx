import { FC, useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, Boxes, AlertTriangle, ShoppingCart, Loader2, 
  Truck, User, Phone, MapPin, Euro, Barcode
} from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ProductStock {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  reserved_stock: number;
  min_stock_level: number | null;
}

interface OrderExpandableRowProps {
  order: Order;
  isExpanded: boolean;
  onReserveStock: (productSku: string, quantity: number, supplierId: string) => Promise<boolean>;
}

export const OrderExpandableRow: FC<OrderExpandableRowProps> = ({
  order,
  isExpanded,
  onReserveStock,
}) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productStock, setProductStock] = useState<ProductStock | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderingStock, setOrderingStock] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(order.quantity || 1);

  // Fetch suppliers and product stock when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch active suppliers
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('id, name, email, phone')
        .eq('is_active', true)
        .order('name');
      
      if (suppliersData) {
        setSuppliers(suppliersData);
      }

      // Fetch product stock by catalog number (SKU)
      if (order.catalog_number) {
        const skus = order.catalog_number.split(',').map(s => s.trim());
        const { data: productData } = await supabase
          .from('inventory_products')
          .select('id, name, sku, current_stock, reserved_stock, min_stock_level')
          .in('sku', skus)
          .maybeSingle();
        
        if (productData) {
          setProductStock(productData);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [isExpanded, order.catalog_number]);

  const availableStock = productStock 
    ? productStock.current_stock - productStock.reserved_stock 
    : 0;

  const needsReorder = productStock 
    ? availableStock < order.quantity 
    : true;

  const handleOrderFromSupplier = async () => {
    if (!selectedSupplier) {
      toast({
        title: 'Грешка',
        description: 'Моля изберете доставчик',
        variant: 'destructive',
      });
      return;
    }

    if (orderQuantity <= 0) {
      toast({
        title: 'Грешка',
        description: 'Количеството трябва да е по-голямо от 0',
        variant: 'destructive',
      });
      return;
    }

    setOrderingStock(true);

    try {
      // Create a supplier request (reservation) - this will add to reserved_stock
      const sku = order.catalog_number || order.product_name;
      const success = await onReserveStock(sku, orderQuantity, selectedSupplier);

      if (success) {
        const supplier = suppliers.find(s => s.id === selectedSupplier);
        toast({
          title: 'Заявка създадена',
          description: `Заявка за ${orderQuantity} бр. е изпратена към ${supplier?.name}. Количеството е добавено в резервация.`,
        });

        // Refresh product stock
        if (order.catalog_number) {
          const { data: updatedProduct } = await supabase
            .from('inventory_products')
            .select('id, name, sku, current_stock, reserved_stock, min_stock_level')
            .eq('sku', order.catalog_number)
            .maybeSingle();
          
          if (updatedProduct) {
            setProductStock(updatedProduct);
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно създаване на заявка',
        variant: 'destructive',
      });
    } finally {
      setOrderingStock(false);
    }
  };

  return (
    <Collapsible open={isExpanded}>
      <CollapsibleContent>
        <div className="bg-muted/30 border-t p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Зареждане...</span>
            </div>
          ) : (
            <>
              {/* Order Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Клиент
                  </h4>
                  <p className="text-sm">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.phone}
                  </p>
                  {order.delivery_address && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {order.delivery_address}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Продукт
                  </h4>
                  <p className="text-sm">{order.product_name.replace(/ \(x\d+\)$/i, '')}</p>
                  {order.catalog_number && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Barcode className="w-3 h-3" />
                      {order.catalog_number}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Количество: <span className="font-medium">{order.quantity} бр.</span>
                  </p>
                  <p className="text-sm font-medium text-success flex items-center gap-1">
                    <Euro className="w-3 h-3" />
                    {order.total_price.toFixed(2)} € (с ДДС)
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-muted-foreground" />
                    Складова наличност
                  </h4>
                  {productStock ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Налично:</span>
                        <Badge variant={productStock.current_stock > 0 ? 'default' : 'destructive'}>
                          {productStock.current_stock} бр.
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Резервирано:</span>
                        <Badge variant="secondary">{productStock.reserved_stock} бр.</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Свободно:</span>
                        <Badge variant={availableStock >= order.quantity ? 'default' : 'destructive'}>
                          {availableStock} бр.
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Продуктът не е намерен в склада</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier Order Section - only show if stock is insufficient */}
              {needsReorder && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart className="w-5 h-5 text-warning" />
                    <h4 className="font-medium text-warning">Поръчка от доставчик</h4>
                    <Badge variant="outline" className="text-warning border-warning">
                      Недостатъчна наличност
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Доставчик</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете доставчик" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              <div className="flex items-center gap-2">
                                <Truck className="w-3 h-3" />
                                {supplier.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Количество за поръчка</Label>
                      <Input
                        type="number"
                        min="1"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Недостиг</Label>
                      <div className="h-10 flex items-center">
                        <Badge variant="destructive" className="text-sm">
                          {availableStock < 0 ? Math.abs(availableStock) : order.quantity - availableStock} бр.
                        </Badge>
                      </div>
                    </div>

                    <Button 
                      onClick={handleOrderFromSupplier}
                      disabled={orderingStock || !selectedSupplier}
                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                      {orderingStock ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Изпращане...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Поръчай от доставчик
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    * При поръчка количеството се добавя към резервирания сток докато пристигне доставката.
                  </p>
                </div>
              )}

              {!needsReorder && productStock && (
                <div className="border-t pt-4 mt-4 flex items-center gap-2 text-success">
                  <Boxes className="w-5 h-5" />
                  <span className="font-medium">Наличността е достатъчна за изпълнение на поръчката</span>
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
