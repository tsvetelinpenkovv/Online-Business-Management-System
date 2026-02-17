import { FC, useState } from 'react';
import {
  AlertDialog,
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
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface FactoryResetDialogProps {
  onReset?: () => void;
}

export const FactoryResetDialog: FC<FactoryResetDialogProps> = ({ onReset }) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteOrders, setDeleteOrders] = useState(true);
  const [deleteInventory, setDeleteInventory] = useState(true);
  const [deleteInvoices, setDeleteInvoices] = useState(true);
  const [deleteShipments, setDeleteShipments] = useState(true);
  const [deleteCustomers, setDeleteCustomers] = useState(true);
  const [deleteExpenses, setDeleteExpenses] = useState(true);
  const [deleteAuditLogs, setDeleteAuditLogs] = useState(true);
  const [deleteLogoFavicon, setDeleteLogoFavicon] = useState(true);
  const [deleteCompanySettings, setDeleteCompanySettings] = useState(true);
  const [deleteApiSettings, setDeleteApiSettings] = useState(true);
  const [deleteCouriers, setDeleteCouriers] = useState(false);
  const [deleteEcommercePlatforms, setDeleteEcommercePlatforms] = useState(false);
  const [deleteStores, setDeleteStores] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const CONFIRM_TEXT = 'ИЗТРИЙ ВСИЧКО';
  const hasAnySelected = deleteOrders || deleteInventory || deleteInvoices || deleteShipments || deleteCustomers || deleteExpenses || deleteAuditLogs || deleteLogoFavicon || deleteCompanySettings || deleteApiSettings || deleteCouriers || deleteEcommercePlatforms || deleteStores;
  const isValid = confirmText === CONFIRM_TEXT && hasAnySelected;

  const handleReset = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      // Delete in order to respect foreign key constraints
      if (deleteShipments) {
        await supabase.from('shipments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteInvoices) {
        await supabase.from('credit_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Reset invoice counter
        const { data: settings } = await supabase.from('company_settings').select('id').limit(1).maybeSingle();
        if (settings) {
          await supabase.from('company_settings').update({ next_invoice_number: 1 }).eq('id', settings.id);
        }
      }

      if (deleteCustomers) {
        await supabase.from('customer_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteExpenses) {
        await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteOrders) {
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('connectix_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('orders').delete().neq('id', 0);
      }

      if (deleteInventory) {
        await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stock_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stock_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('price_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('product_bundles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stock_by_warehouse').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inventory_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inventory_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteLogoFavicon) {
        const { data: logoFiles } = await supabase.storage.from('logos').list();
        if (logoFiles && logoFiles.length > 0) {
          await supabase.storage.from('logos').remove(logoFiles.map(f => f.name));
        }
        const { data: bgFiles } = await supabase.storage.from('login-backgrounds').list();
        if (bgFiles && bgFiles.length > 0) {
          await supabase.storage.from('login-backgrounds').remove(bgFiles.map(f => f.name));
        }
      }

      if (deleteAuditLogs) {
        await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteCompanySettings) {
        // Reset company settings to defaults (not delete the row)
        const { data: cs } = await supabase.from('company_settings').select('id').limit(1).maybeSingle();
        if (cs) {
          await supabase.from('company_settings').update({
            company_name: null,
            eik: null,
            registered_address: null,
            correspondence_address: null,
            manager_name: null,
            vat_registered: false,
            vat_number: null,
            email: null,
            phone: null,
            bank_name: null,
            bank_iban: null,
            bank_bic: null,
            website_url: null,
            orders_page_title: 'Управление на поръчки',
            inventory_page_title: 'Склад',
            footer_text: null,
            footer_link_text: null,
            footer_link: null,
            footer_website: null,
            login_title: null,
            login_description: null,
            login_background_color: null,
            secret_path: null,
          }).eq('id', cs.id);
        }
      }

      if (deleteApiSettings) {
        // Delete all api_settings (connectix config, sender defaults, interface texts, etc.)
        await supabase.from('api_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteCouriers) {
        // Delete courier API settings first (FK)
        await supabase.from('courier_api_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('couriers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteEcommercePlatforms) {
        await supabase.from('ecommerce_platforms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (deleteStores) {
        await supabase.from('stores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // Invalidate all cached queries so UI refreshes
      await queryClient.invalidateQueries();

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
      <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                <Checkbox id="delete-orders" checked={deleteOrders} onCheckedChange={(checked) => setDeleteOrders(!!checked)} />
                <Label htmlFor="delete-orders" className="cursor-pointer">Всички поръчки, артикули и съобщения</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-inventory" checked={deleteInventory} onCheckedChange={(checked) => setDeleteInventory(!!checked)} />
                <Label htmlFor="delete-inventory" className="cursor-pointer">Всички продукти, категории, доставчици и движения</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-shipments" checked={deleteShipments} onCheckedChange={(checked) => setDeleteShipments(!!checked)} />
                <Label htmlFor="delete-shipments" className="cursor-pointer">Всички пратки</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-invoices" checked={deleteInvoices} onCheckedChange={(checked) => setDeleteInvoices(!!checked)} />
                <Label htmlFor="delete-invoices" className="cursor-pointer">Всички фактури и кредитни известия</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-customers" checked={deleteCustomers} onCheckedChange={(checked) => setDeleteCustomers(!!checked)} />
                <Label htmlFor="delete-customers" className="cursor-pointer">Всички клиенти и бележки към тях</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-expenses" checked={deleteExpenses} onCheckedChange={(checked) => setDeleteExpenses(!!checked)} />
                <Label htmlFor="delete-expenses" className="cursor-pointer">Всички разходи</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-audit-logs" checked={deleteAuditLogs} onCheckedChange={(checked) => setDeleteAuditLogs(!!checked)} />
                <Label htmlFor="delete-audit-logs" className="cursor-pointer">Всички одит логове</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-logo-favicon" checked={deleteLogoFavicon} onCheckedChange={(checked) => setDeleteLogoFavicon(!!checked)} />
                <Label htmlFor="delete-logo-favicon" className="cursor-pointer">Лого, фавикон и фон за вход</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-company-settings" checked={deleteCompanySettings} onCheckedChange={(checked) => setDeleteCompanySettings(!!checked)} />
                <Label htmlFor="delete-company-settings" className="cursor-pointer">Фирмени данни (нулиране)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-api-settings" checked={deleteApiSettings} onCheckedChange={(checked) => setDeleteApiSettings(!!checked)} />
                <Label htmlFor="delete-api-settings" className="cursor-pointer">API настройки, Connectix, текстове на интерфейса</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-couriers" checked={deleteCouriers} onCheckedChange={(checked) => setDeleteCouriers(!!checked)} />
                <Label htmlFor="delete-couriers" className="cursor-pointer">Всички куриери и техните API настройки</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-ecommerce" checked={deleteEcommercePlatforms} onCheckedChange={(checked) => setDeleteEcommercePlatforms(!!checked)} />
                <Label htmlFor="delete-ecommerce" className="cursor-pointer">Всички e-commerce платформи</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-stores" checked={deleteStores} onCheckedChange={(checked) => setDeleteStores(!!checked)} />
                <Label htmlFor="delete-stores" className="cursor-pointer">Всички магазини</Label>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Няма да бъдат изтрити: потребители, роли и техните права, статуси на поръчки, мерни единици.
            </p>

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
