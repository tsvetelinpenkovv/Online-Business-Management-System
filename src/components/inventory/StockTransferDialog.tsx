 import { FC, useState, useEffect } from 'react';
 import { useWarehouses } from '@/hooks/useWarehouses';
 import { useInventory } from '@/hooks/useInventory';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription,
 } from '@/components/ui/dialog';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { useToast } from '@/hooks/use-toast';
 import { ArrowRight, Package, Warehouse, AlertTriangle } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 
 interface StockTransferDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess?: () => void;
 }
 
 interface TransferItem {
   productId: string;
   productName: string;
   sku: string;
   quantity: number;
   availableStock: number;
 }
 
 export const StockTransferDialog: FC<StockTransferDialogProps> = ({
   open,
   onOpenChange,
   onSuccess,
 }) => {
   const { warehouses, multiWarehouseEnabled } = useWarehouses();
   const { products, refreshProducts } = useInventory();
   const { toast } = useToast();
 
   const [fromWarehouse, setFromWarehouse] = useState<string>('');
   const [toWarehouse, setToWarehouse] = useState<string>('');
   const [selectedProduct, setSelectedProduct] = useState<string>('');
   const [quantity, setQuantity] = useState<number>(1);
   const [notes, setNotes] = useState<string>('');
   const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const activeWarehouses = warehouses.filter(w => w.is_active);
 
   const selectedProductData = products.find(p => p.id === selectedProduct);
   const maxQuantity = selectedProductData?.current_stock || 0;
 
   const addItemToTransfer = () => {
     if (!selectedProduct || quantity <= 0) return;
 
     const product = products.find(p => p.id === selectedProduct);
     if (!product) return;
 
     // Check if already added
     const existingIndex = transferItems.findIndex(i => i.productId === selectedProduct);
     if (existingIndex >= 0) {
       // Update quantity
       const newItems = [...transferItems];
       newItems[existingIndex].quantity += quantity;
       setTransferItems(newItems);
     } else {
       setTransferItems([
         ...transferItems,
         {
           productId: product.id,
           productName: product.name,
           sku: product.sku,
           quantity,
           availableStock: product.current_stock,
         },
       ]);
     }
 
     setSelectedProduct('');
     setQuantity(1);
   };
 
   const removeItem = (productId: string) => {
     setTransferItems(transferItems.filter(i => i.productId !== productId));
   };
 
   const handleSubmit = async () => {
     if (!fromWarehouse || !toWarehouse || transferItems.length === 0) {
       toast({
         title: 'Грешка',
         description: 'Моля, попълнете всички задължителни полета',
         variant: 'destructive',
       });
       return;
     }
 
     if (fromWarehouse === toWarehouse) {
       toast({
         title: 'Грешка',
         description: 'Изберете различни складове за трансфер',
         variant: 'destructive',
       });
       return;
     }
 
     setIsSubmitting(true);
 
     try {
       const fromWarehouseName = warehouses.find(w => w.id === fromWarehouse)?.name || '';
       const toWarehouseName = warehouses.find(w => w.id === toWarehouse)?.name || '';
 
       // Create transfer movements for each item
       for (const item of transferItems) {
         // Get current stock
         const product = products.find(p => p.id === item.productId);
         if (!product) continue;
 
         const stockBefore = product.current_stock;
 
         // Create OUT movement from source warehouse
         await supabase.from('stock_movements').insert({
           product_id: item.productId,
           movement_type: 'transfer',
           quantity: item.quantity,
           stock_before: stockBefore,
           stock_after: stockBefore, // Stock stays same for transfer
           warehouse_id: fromWarehouse,
           reason: `Трансфер към ${toWarehouseName}${notes ? ': ' + notes : ''}`,
         });
 
         // Create IN movement to destination warehouse
         await supabase.from('stock_movements').insert({
           product_id: item.productId,
           movement_type: 'transfer',
           quantity: item.quantity,
           stock_before: stockBefore,
           stock_after: stockBefore, // Stock stays same for transfer
           warehouse_id: toWarehouse,
           reason: `Трансфер от ${fromWarehouseName}${notes ? ': ' + notes : ''}`,
         });
 
         // Update stock_by_warehouse if exists
         // Decrease from source
         const { data: sourceStock } = await supabase
           .from('stock_by_warehouse')
           .select('*')
           .eq('product_id', item.productId)
           .eq('warehouse_id', fromWarehouse)
           .maybeSingle();
 
         if (sourceStock) {
           await supabase
             .from('stock_by_warehouse')
             .update({ current_stock: sourceStock.current_stock - item.quantity })
             .eq('id', sourceStock.id);
         }
 
         // Increase in destination
         const { data: destStock } = await supabase
           .from('stock_by_warehouse')
           .select('*')
           .eq('product_id', item.productId)
           .eq('warehouse_id', toWarehouse)
           .maybeSingle();
 
         if (destStock) {
           await supabase
             .from('stock_by_warehouse')
             .update({ current_stock: destStock.current_stock + item.quantity })
             .eq('id', destStock.id);
         } else {
           // Create new stock entry
           await supabase.from('stock_by_warehouse').insert({
             product_id: item.productId,
             warehouse_id: toWarehouse,
             current_stock: item.quantity,
           });
         }
       }
 
       toast({
         title: 'Успех',
         description: `Трансферирани ${transferItems.length} артикула от ${fromWarehouseName} към ${toWarehouseName}`,
       });
 
       // Reset form
       setFromWarehouse('');
       setToWarehouse('');
       setTransferItems([]);
       setNotes('');
       onOpenChange(false);
       onSuccess?.();
       refreshProducts();
     } catch (error) {
       console.error('Transfer error:', error);
       toast({
         title: 'Грешка',
         description: 'Неуспешен трансфер на стоки',
         variant: 'destructive',
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   if (!multiWarehouseEnabled) {
     return (
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Трансфер на стоки</DialogTitle>
           </DialogHeader>
           <div className="flex flex-col items-center justify-center py-8 text-center">
             <AlertTriangle className="w-12 h-12 text-warning mb-4" />
             <p className="text-muted-foreground">
               Трансферът на стоки е достъпен само при активиран многоскладов режим.
             </p>
             <p className="text-sm text-muted-foreground mt-2">
               Активирайте го от Склад → Настройки → Складове
             </p>
           </div>
         </DialogContent>
       </Dialog>
     );
   }
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5" />
            Трансфер на стоки между складове
          </DialogTitle>
          <DialogDescription>
            Преместете продукти от един склад в друг
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warehouse selection */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 sm:gap-4 items-end">
            <div className="space-y-2">
              <Label>От склад *</Label>
              <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете склад" />
                </SelectTrigger>
                <SelectContent>
                  {activeWarehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === toWarehouse}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="w-6 h-6 text-muted-foreground mb-2 hidden sm:block" />

            <div className="space-y-2">
              <Label>Към склад *</Label>
              <Select value={toWarehouse} onValueChange={setToWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете склад" />
                </SelectTrigger>
                <SelectContent>
                  {activeWarehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === fromWarehouse}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add product */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,100px,auto] gap-3 sm:gap-4 items-end">
             <div className="space-y-2">
               <Label>Продукт</Label>
               <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                 <SelectTrigger>
                   <SelectValue placeholder="Изберете продукт" />
                 </SelectTrigger>
                 <SelectContent>
                   {products
                     .filter(p => p.is_active && p.current_stock > 0)
                     .map((p) => (
                       <SelectItem key={p.id} value={p.id}>
                         {p.name} ({p.sku}) - {p.current_stock} бр.
                       </SelectItem>
                     ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Кол-во</Label>
               <Input
                 type="number"
                 min={1}
                 max={maxQuantity}
                 value={quantity}
                 onChange={(e) => setQuantity(Math.min(Number(e.target.value), maxQuantity))}
               />
             </div>
             <Button
               onClick={addItemToTransfer}
               disabled={!selectedProduct || quantity <= 0}
             >
               Добави
             </Button>
           </div>
 
           {/* Transfer items list */}
           {transferItems.length > 0 && (
             <div className="border rounded-lg divide-y">
               {transferItems.map((item) => (
                 <div key={item.productId} className="flex items-center justify-between p-3">
                   <div className="flex items-center gap-3">
                     <Package className="w-4 h-4 text-muted-foreground" />
                     <div>
                       <p className="font-medium">{item.productName}</p>
                       <p className="text-xs text-muted-foreground">{item.sku}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <Badge variant="secondary">{item.quantity} бр.</Badge>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => removeItem(item.productId)}
                     >
                       ✕
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           )}
 
           {/* Notes */}
           <div className="space-y-2">
             <Label>Бележки</Label>
             <Textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Причина за трансфера (опционално)"
               rows={2}
             />
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Отказ
           </Button>
           <Button
             onClick={handleSubmit}
             disabled={!fromWarehouse || !toWarehouse || transferItems.length === 0 || isSubmitting}
           >
             {isSubmitting ? 'Прехвърляне...' : `Прехвърли ${transferItems.length} артикула`}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };