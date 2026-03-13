import { FC, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export const BulkInvoiceExport: FC = () => {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return format(d, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .gte('issue_date', dateFrom)
        .lte('issue_date', dateTo)
        .order('invoice_number', { ascending: true });

      if (error) throw error;
      if (!invoices || invoices.length === 0) {
        toast({ title: 'Внимание', description: 'Няма фактури за избрания период' });
        setExporting(false);
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      invoices.forEach((inv, idx) => {
        if (idx > 0) doc.addPage();

        let y = 20;
        doc.setFontSize(16);
        doc.text(`Faktura No ${inv.invoice_number}`, pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setFontSize(10);
        doc.text(`Data: ${inv.issue_date}`, 14, y);
        y += 8;

        // Seller
        doc.setFontSize(11);
        doc.text('Dostavchik:', 14, y);
        y += 6;
        doc.setFontSize(9);
        doc.text(inv.seller_name || '', 14, y); y += 5;
        if (inv.seller_eik) { doc.text(`EIK: ${inv.seller_eik}`, 14, y); y += 5; }
        if (inv.seller_vat_number) { doc.text(`DDS No: ${inv.seller_vat_number}`, 14, y); y += 5; }
        if (inv.seller_address) { doc.text(inv.seller_address, 14, y); y += 5; }
        y += 4;

        // Buyer
        doc.setFontSize(11);
        doc.text('Poluchatel:', 14, y);
        y += 6;
        doc.setFontSize(9);
        doc.text(inv.buyer_name || '', 14, y); y += 5;
        if (inv.buyer_eik) { doc.text(`EIK: ${inv.buyer_eik}`, 14, y); y += 5; }
        if (inv.buyer_vat_number) { doc.text(`DDS No: ${inv.buyer_vat_number}`, 14, y); y += 5; }
        if (inv.buyer_address) { doc.text(inv.buyer_address, 14, y); y += 5; }
        y += 6;

        // Table header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Opisanie', 14, y);
        doc.text('K-vo', 110, y);
        doc.text('Ed. cena', 130, y);
        doc.text('Stojnost', 160, y);
        y += 2;
        doc.line(14, y, pageWidth - 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.text(inv.product_description || '', 14, y);
        doc.text(String(inv.quantity), 110, y);
        doc.text(Number(inv.unit_price).toFixed(2), 130, y);
        doc.text(Number(inv.subtotal).toFixed(2), 160, y);
        y += 8;

        doc.line(14, y, pageWidth - 14, y);
        y += 6;

        doc.text(`Danuchna osnova: ${Number(inv.subtotal).toFixed(2)}`, 120, y);
        y += 5;
        if (inv.vat_amount && Number(inv.vat_amount) > 0) {
          doc.text(`DDS (${inv.vat_rate || 20}%): ${Number(inv.vat_amount).toFixed(2)}`, 120, y);
          y += 5;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`Obshto: ${Number(inv.total_amount).toFixed(2)} EUR`, 120, y);

        if (inv.notes) {
          y += 12;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(`Belezhka: ${inv.notes}`, 14, y);
        }
      });

      doc.save(`fakturi_${dateFrom}_${dateTo}.pdf`);
      toast({ title: 'Успех', description: `Експортирани ${invoices.length} фактури` });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message || 'Неуспешен експорт', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileDown className="w-4 h-4 mr-1" />
          Масов експорт
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Масов експорт на фактури (PDF)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>От дата</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>До дата</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Всички фактури за избрания период ще бъдат генерирани в един PDF файл, подходящ за счетоводство.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отказ</Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
            Експортирай
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
