import { FC, useState, useRef } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Download, Upload, FileSpreadsheet, Package, Users, FolderTree, FileText, Check, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ExportType = 'products' | 'suppliers' | 'categories' | 'documents';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
}

export const ImportExportDialog: FC<ImportExportDialogProps> = ({ 
  open, 
  onOpenChange, 
  inventory 
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const exportToCSV = (type: ExportType) => {
    let data: string[][] = [];
    let filename = '';

    switch (type) {
      case 'products':
        data = [
          ['SKU', 'Име', 'Описание', 'Категория', 'Мерна единица', 'Покупна цена', 'Продажна цена', 'Мин. наличност', 'Текуща наличност', 'Баркод', 'Активен'],
          ...inventory.products.map(p => [
            p.sku,
            p.name,
            p.description || '',
            p.category?.name || '',
            p.unit?.abbreviation || '',
            p.purchase_price.toString(),
            p.sale_price.toString(),
            p.min_stock_level.toString(),
            p.current_stock.toString(),
            p.barcode || '',
            p.is_active ? 'Да' : 'Не'
          ])
        ];
        filename = `артикули_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'suppliers':
        data = [
          ['Име', 'Контактно лице', 'Имейл', 'Телефон', 'Адрес', 'ЕИК', 'ДДС номер', 'Бележки', 'Активен'],
          ...inventory.suppliers.map(s => [
            s.name,
            s.contact_person || '',
            s.email || '',
            s.phone || '',
            s.address || '',
            s.eik || '',
            s.vat_number || '',
            s.notes || '',
            s.is_active ? 'Да' : 'Не'
          ])
        ];
        filename = `доставчици_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'categories':
        data = [
          ['Име', 'Описание', 'Родителска категория'],
          ...inventory.categories.map(c => {
            const parent = inventory.categories.find(p => p.id === c.parent_id);
            return [
              c.name,
              c.description || '',
              parent?.name || ''
            ];
          })
        ];
        filename = `категории_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'documents':
        data = [
          ['Номер', 'Тип', 'Дата', 'Контрагент', 'Сума', 'Бележки'],
          ...inventory.documents.map(d => [
            d.document_number,
            d.document_type,
            d.document_date,
            d.supplier?.name || d.counterparty_name || '',
            d.total_amount.toString(),
            d.notes || ''
          ])
        ];
        filename = `документи_${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    const csvContent = data.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Експорт успешен', description: `Файлът ${filename} е изтеглен` });
  };

  const handleFileSelect = async (type: ExportType) => {
    if (!fileInputRef.current?.files?.length) return;
    
    const file = fileInputRef.current.files[0];
    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const rows = lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      // Skip header row
      const dataRows = rows.slice(1);
      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        try {
          switch (type) {
            case 'products': {
              const category = inventory.categories.find(c => c.name === row[3]);
              const unit = inventory.units.find(u => u.abbreviation === row[4] || u.name === row[4]);
              
              await inventory.createProduct({
                sku: row[0] || `SKU-${Date.now()}-${i}`,
                name: row[1],
                description: row[2] || null,
                category_id: category?.id || null,
                unit_id: unit?.id || null,
                purchase_price: parseFloat(row[5]) || 0,
                sale_price: parseFloat(row[6]) || 0,
                min_stock_level: parseFloat(row[7]) || 0,
                barcode: row[9] || null,
                is_active: row[10] !== 'Не',
                woocommerce_id: null,
              });
              success++;
              break;
            }
            case 'suppliers': {
              await inventory.createSupplier({
                name: row[0],
                contact_person: row[1] || null,
                email: row[2] || null,
                phone: row[3] || null,
                address: row[4] || null,
                eik: row[5] || null,
                vat_number: row[6] || null,
                notes: row[7] || null,
                is_active: row[8] !== 'Не',
              });
              success++;
              break;
            }
            case 'categories': {
              const parent = inventory.categories.find(c => c.name === row[2]);
              await inventory.createCategory({
                name: row[0],
                description: row[1] || null,
                parent_id: parent?.id || null,
              });
              success++;
              break;
            }
          }
        } catch (err) {
          errors.push(`Ред ${i + 2}: ${err instanceof Error ? err.message : 'Неизвестна грешка'}`);
        }
      }

      setImportResult({ success, errors });
      if (success > 0) {
        toast({ title: 'Импорт завършен', description: `Успешно импортирани: ${success}` });
      }
    } catch (err) {
      toast({ title: 'Грешка', description: 'Неуспешно четене на файла', variant: 'destructive' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImport = (type: ExportType) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.importType = type;
      fileInputRef.current.click();
    }
  };

  const exportButtons = [
    { type: 'products' as ExportType, label: 'Артикули', icon: Package, color: 'bg-primary' },
    { type: 'suppliers' as ExportType, label: 'Доставчици', icon: Users, color: 'bg-success' },
    { type: 'categories' as ExportType, label: 'Категории', icon: FolderTree, color: 'bg-info' },
    { type: 'documents' as ExportType, label: 'Документи', icon: FileText, color: 'bg-warning' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Импорт / Експорт
          </DialogTitle>
          <DialogDescription>
            Импортирайте или експортирайте данни в CSV формат
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const type = e.target.dataset.importType as ExportType;
            if (type) handleFileSelect(type);
          }}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'export' | 'import')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Експорт
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Импорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Изберете какво искате да експортирате в CSV формат:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {exportButtons.map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => exportToCSV(type)}
                >
                  <div className={`p-2 rounded-lg ${color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Изберете тип данни за импорт. Файлът трябва да е в CSV формат със заглавен ред.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {exportButtons.filter(b => b.type !== 'documents').map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => triggerImport(type)}
                  disabled={importing}
                >
                  <div className={`p-2 rounded-lg ${color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>Импорт {label}</span>
                </Button>
              ))}
            </div>

            {importResult && (
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-success mb-2">
                  <Check className="w-4 h-4" />
                  <span>Успешно импортирани: {importResult.success}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Грешки: {importResult.errors.length}</span>
                    </div>
                    <div className="max-h-24 overflow-y-auto text-xs text-muted-foreground">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p>...и още {importResult.errors.length - 5} грешки</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
