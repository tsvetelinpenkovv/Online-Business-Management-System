import { FC, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface FactoryResetDialogProps {
  onReset?: () => void;
}

export const FactoryResetDialog: FC<FactoryResetDialogProps> = ({ onReset }) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteOrders, setDeleteOrders] = useState(true);
  const [deleteInventory, setDeleteInventory] = useState(true);
  const [deleteInvoices, setDeleteInvoices] = useState(false);
  const [deleteShipments, setDeleteShipments] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const CONFIRM_TEXT = 'ИЗТРИЙ ВСИЧКО';
  const isValid = confirmText === CONFIRM_TEXT && (deleteOrders || deleteInventory || deleteInvoices || deleteShipments);

  const handleReset = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      // Delete in order to respect foreign key constraints
      if (deleteShipments) {
        await supabase.from('shipments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteInvoices) {
        await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteOrders) {
        // First delete order items
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete connectix messages
        await supabase.from('connectix_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Then delete orders
        await supabase.from('orders').delete().neq('id', 0);
      }

      if (deleteInventory) {
        // Delete stock movements first
        await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete stock documents
        await supabase.from('stock_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete stock batches
        await supabase.from('stock_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete price history
        await supabase.from('price_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete product bundles
        await supabase.from('product_bundles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete stock by warehouse
        await supabase.from('stock_by_warehouse').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete inventory products
        await supabase.from('inventory_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete categories
        await supabase.from('inventory_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete suppliers
        await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      toast({
        title: 'Успех',
        description: 'Данните бяха изтрити успешно',
      });

      setOpen(false);
      setConfirmText('');
      onReset?.();
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно изтриване на данните',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="w-4 h-4 mr-2" />
          Фабрични настройки
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Фабрични настройки
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-4">
            <p className="font-medium text-destructive">
              ВНИМАНИЕ: Това действие е необратимо!
            </p>
            <p>
              Изберете какви данни искате да изтриете:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-orders"
                  checked={deleteOrders}
                  onCheckedChange={(checked) => setDeleteOrders(!!checked)}
                />
                <Label htmlFor="delete-orders" className="cursor-pointer">
                  Всички поръчки и артикули към тях
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-inventory"
                  checked={deleteInventory}
                  onCheckedChange={(checked) => setDeleteInventory(!!checked)}
                />
                <Label htmlFor="delete-inventory" className="cursor-pointer">
                  Всички продукти, категории, доставчици и движения
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-shipments"
                  checked={deleteShipments}
                  onCheckedChange={(checked) => setDeleteShipments(!!checked)}
                />
                <Label htmlFor="delete-shipments" className="cursor-pointer">
                  Всички пратки
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-invoices"
                  checked={deleteInvoices}
                  onCheckedChange={(checked) => setDeleteInvoices(!!checked)}
                />
                <Label htmlFor="delete-invoices" className="cursor-pointer">
                  Всички фактури
                </Label>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-text">
                Напишете <span className="font-mono font-bold">{CONFIRM_TEXT}</span> за потвърждение:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={loading}>Отказ</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Изтриване...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Изтрий избраните данни
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
