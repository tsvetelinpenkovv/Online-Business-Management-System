import { FC, useState, useEffect, useRef } from 'react';
import { Order } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Printer, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface CompanySettings {
  id: string;
  company_name: string | null;
  eik: string | null;
  registered_address: string | null;
  correspondence_address: string | null;
  manager_name: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  next_invoice_number: number;
}

interface InvoiceDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoiceDialog: FC<InvoiceDialogProps> = ({ order, open, onOpenChange }) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  // Invoice form data
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [taxEventDate, setTaxEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [buyerName, setBuyerName] = useState('');
  const [buyerEik, setBuyerEik] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerVatNumber, setBuyerVatNumber] = useState('');
  const [includeVat, setIncludeVat] = useState(false);
  const [vatRate, setVatRate] = useState(20);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && order) {
      fetchCompanySettings();
      setBuyerName(order.customer_name);
      setBuyerAddress(order.delivery_address || '');
    }
  }, [open, order]);

  const fetchCompanySettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      
      setCompanySettings(data as CompanySettings);
      setInvoiceNumber(data.next_invoice_number || 1);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!order) return { subtotal: 0, vatAmount: 0, total: 0 };
    
    const subtotal = order.total_price;
    const vatAmount = includeVat ? subtotal * (vatRate / 100) : 0;
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total };
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Фактура ${invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-info, .invoice-info { }
            .company-info h2 { font-size: 18px; margin-bottom: 10px; }
            .invoice-info { text-align: right; }
            .invoice-info h1 { font-size: 24px; color: #333; margin-bottom: 10px; }
            .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .party { width: 48%; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            .party h3 { font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .party p { margin: 5px 0; }
            .items { margin-bottom: 30px; }
            .items table { width: 100%; border-collapse: collapse; }
            .items th, .items td { padding: 10px; text-align: left; border: 1px solid #ddd; }
            .items th { background: #333; color: white; }
            .items .right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .totals table { width: 100%; }
            .totals td { padding: 8px; border-bottom: 1px solid #ddd; }
            .totals .total { font-size: 16px; font-weight: bold; background: #333; color: white; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; }
            .notes { margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSaveAndPrint = async () => {
    if (!order || !companySettings) return;
    
    setSaving(true);
    const { subtotal, vatAmount, total } = calculateTotals();

    try {
      // Save invoice
      const { error: invoiceError } = await supabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        order_id: order.id,
        issue_date: issueDate,
        tax_event_date: taxEventDate,
        seller_name: companySettings.company_name || '',
        seller_eik: companySettings.eik,
        seller_address: companySettings.registered_address,
        seller_vat_number: companySettings.vat_number,
        buyer_name: buyerName,
        buyer_eik: buyerEik || null,
        buyer_address: buyerAddress,
        buyer_vat_number: buyerVatNumber || null,
        buyer_phone: order.phone,
        buyer_email: order.customer_email,
        product_description: order.product_name,
        quantity: order.quantity,
        unit_price: order.total_price / order.quantity,
        subtotal: subtotal,
        vat_rate: includeVat ? vatRate : 0,
        vat_amount: vatAmount,
        total_amount: total,
        notes: notes || null,
      });

      if (invoiceError) throw invoiceError;

      // Update next invoice number
      await supabase
        .from('company_settings')
        .update({ next_invoice_number: invoiceNumber + 1 })
        .eq('id', companySettings.id);

      handlePrint();
      
      toast({
        title: 'Успех',
        description: `Фактура №${invoiceNumber} беше запазена`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно запазване на фактурата',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  const { subtotal, vatAmount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Издаване на фактура</DialogTitle>
          <DialogDescription>
            Поръчка №{order.id} - {order.customer_name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !companySettings?.company_name ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Моля попълнете данните на фирмата в Настройки → Фирмени данни
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Затвори
            </Button>
          </div>
        ) : (
          <>
            {/* Invoice Form */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Номер на фактура</Label>
                <Input
                  type="number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Дата на издаване</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Дата на данъчно събитие</Label>
                <Input
                  type="date"
                  value={taxEventDate}
                  onChange={(e) => setTaxEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Клиент</Label>
                <Input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ЕИК на клиента (ако е фирма)</Label>
                <Input
                  value={buyerEik}
                  onChange={(e) => setBuyerEik(e.target.value)}
                  placeholder="Оставете празно за физическо лице"
                />
              </div>
              <div className="space-y-2">
                <Label>Адрес на клиента</Label>
                <Input
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ДДС номер на клиента</Label>
                <Input
                  value={buyerVatNumber}
                  onChange={(e) => setBuyerVatNumber(e.target.value)}
                  placeholder="Ако е регистриран по ДДС"
                />
              </div>
              <div className="space-y-2">
                <Label>Бележки</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Допълнителни бележки"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-vat"
                  checked={includeVat}
                  onCheckedChange={(checked) => setIncludeVat(checked as boolean)}
                />
                <Label htmlFor="include-vat">Добави ДДС</Label>
              </div>
              {includeVat && (
                <div className="flex items-center gap-2">
                  <Label>Ставка:</Label>
                  <Input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span>%</span>
                </div>
              )}
            </div>

            {/* Invoice Preview */}
            <div ref={printRef} className="border rounded-lg p-6 bg-white text-black">
              <div className="invoice">
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                  <div className="company-info">
                    <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>{companySettings.company_name}</h2>
                    <p>ЕИК: {companySettings.eik}</p>
                    <p>{companySettings.registered_address}</p>
                    {companySettings.vat_registered && <p>ДДС №: {companySettings.vat_number}</p>}
                    {companySettings.phone && <p>Тел: {companySettings.phone}</p>}
                    {companySettings.email && <p>Имейл: {companySettings.email}</p>}
                  </div>
                  <div className="invoice-info" style={{ textAlign: 'right' }}>
                    <h1 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>ФАКТУРА</h1>
                    <p style={{ fontSize: '16px', fontWeight: 'bold' }}>№ {String(invoiceNumber).padStart(10, '0')}</p>
                    <p>Дата: {format(new Date(issueDate), 'dd.MM.yyyy')}</p>
                    <p>Дата на ДС: {format(new Date(taxEventDate), 'dd.MM.yyyy')}</p>
                  </div>
                </div>

                <div className="parties" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                  <div className="party" style={{ width: '48%', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>ДОСТАВЧИК</h3>
                    <p><strong>{companySettings.company_name}</strong></p>
                    <p>ЕИК: {companySettings.eik}</p>
                    <p>{companySettings.registered_address}</p>
                    {companySettings.vat_registered && <p>ДДС №: {companySettings.vat_number}</p>}
                  </div>
                  <div className="party" style={{ width: '48%', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>ПОЛУЧАТЕЛ</h3>
                    <p><strong>{buyerName}</strong></p>
                    {buyerEik && <p>ЕИК: {buyerEik}</p>}
                    <p>{buyerAddress}</p>
                    {buyerVatNumber && <p>ДДС №: {buyerVatNumber}</p>}
                    <p>Тел: {order.phone}</p>
                  </div>
                </div>

                <div className="items" style={{ marginBottom: '30px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', background: '#333', color: 'white' }}>№</th>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', background: '#333', color: 'white' }}>Описание</th>
                        <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', background: '#333', color: 'white' }}>К-во</th>
                        <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', background: '#333', color: 'white' }}>Ед. цена</th>
                        <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', background: '#333', color: 'white' }}>Стойност</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>1</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                          {order.product_name}
                          {order.catalog_number && <span style={{ color: '#666' }}> (Кат.№ {order.catalog_number})</span>}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{order.quantity}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{(order.total_price / order.quantity).toFixed(2)} €</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{subtotal.toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="totals" style={{ marginLeft: 'auto', width: '300px' }}>
                  <table style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Данъчна основа:</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{subtotal.toFixed(2)} €</td>
                      </tr>
                      {includeVat ? (
                        <tr>
                          <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>ДДС ({vatRate}%):</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{vatAmount.toFixed(2)} €</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={2} style={{ padding: '8px', borderBottom: '1px solid #ddd', fontSize: '11px', color: '#666' }}>
                            Не подлежи на облагане с ДДС
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: '8px', background: '#333', color: 'white', fontWeight: 'bold' }}>ОБЩО ЗА ПЛАЩАНЕ:</td>
                        <td style={{ padding: '8px', background: '#333', color: 'white', fontWeight: 'bold', textAlign: 'right' }}>{total.toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {notes && (
                  <div className="notes" style={{ marginTop: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '5px' }}>
                    <p><strong>Бележки:</strong> {notes}</p>
                  </div>
                )}

                {companySettings.bank_iban && (
                  <div style={{ marginTop: '30px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
                    <p><strong>Банкова сметка за плащане:</strong></p>
                    <p>Банка: {companySettings.bank_name}</p>
                    <p>IBAN: {companySettings.bank_iban}</p>
                    {companySettings.bank_bic && <p>BIC: {companySettings.bank_bic}</p>}
                  </div>
                )}

                <div className="footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
                  <p>Фактура издадена от {companySettings.company_name}</p>
                  {companySettings.manager_name && <p>Управител: {companySettings.manager_name}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 mr-2" />
                Отказ
              </Button>
              <Button onClick={handleSaveAndPrint} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Запази и принтирай
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};