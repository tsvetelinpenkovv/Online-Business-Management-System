import { FC, useState, useRef } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, Upload, FileSpreadsheet, Package, Users, FolderTree, FileText, Check, AlertCircle, 
  FileDown, Eye, ArrowLeft, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

type ExportType = 'products' | 'suppliers' | 'categories' | 'documents';
type FileFormat = 'csv' | 'xlsx' | 'xls' | 'ods';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
}

interface PreviewData {
  type: ExportType;
  headers: string[];
  rows: string[][];
  fileName: string;
}

const SUPPORTED_FORMATS: { value: FileFormat; label: string; extension: string }[] = [
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'xlsx', label: 'Excel (XLSX)', extension: '.xlsx' },
  { value: 'xls', label: 'Excel (XLS)', extension: '.xls' },
  { value: 'ods', label: 'OpenDocument (ODS)', extension: '.ods' },
];

const ACCEPTED_FILE_TYPES = '.csv,.xls,.xlsx,.xlst,.ods,.ots';

const TEMPLATE_DATA: Record<ExportType, { headers: string[]; sampleRows: string[][] }> = {
  products: {
    headers: ['SKU', 'Име', 'Описание', 'Категория', 'Мерна единица', 'Покупна цена', 'Продажна цена', 'Мин. наличност', 'Текуща наличност', 'Баркод', 'Активен'],
    sampleRows: [
      ['PRD-001', 'Примерен продукт 1', 'Описание на продукта', 'Електроника', 'бр.', '10.00', '15.00', '5', '100', '1234567890123', 'Да'],
      ['PRD-002', 'Примерен продукт 2', '', 'Аксесоари', 'бр.', '5.00', '8.50', '10', '50', '', 'Да'],
    ]
  },
  suppliers: {
    headers: ['Име', 'Контактно лице', 'Имейл', 'Телефон', 'Адрес', 'ЕИК', 'ДДС номер', 'Бележки', 'Активен'],
    sampleRows: [
      ['Примерен доставчик ООД', 'Иван Иванов', 'ivan@example.com', '+359888123456', 'ул. Примерна 1, София', '123456789', 'BG123456789', 'Бележки за доставчика', 'Да'],
      ['Друг доставчик ЕООД', 'Петър Петров', 'petar@example.com', '+359877654321', '', '987654321', '', '', 'Да'],
    ]
  },
  categories: {
    headers: ['Име', 'Описание', 'Родителска категория'],
    sampleRows: [
      ['Електроника', 'Електронни устройства и компоненти', ''],
      ['Телефони', 'Мобилни телефони', 'Електроника'],
      ['Аксесоари', 'Аксесоари за телефони', 'Телефони'],
    ]
  },
  documents: {
    headers: ['Номер', 'Тип', 'Дата', 'Контрагент', 'Сума', 'Бележки'],
    sampleRows: []
  }
};

const TYPE_LABELS: Record<ExportType, string> = {
  products: 'Артикули',
  suppliers: 'Доставчици',
  categories: 'Категории',
  documents: 'Документи'
};

export const ImportExportDialog: FC<ImportExportDialogProps> = ({ 
  open, 
  onOpenChange, 
  inventory 
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<FileFormat>('xlsx');
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getDataForType = (type: ExportType): { headers: string[]; rows: string[][] } => {
    switch (type) {
      case 'products':
        return {
          headers: TEMPLATE_DATA.products.headers,
          rows: inventory.products.map(p => [
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
        };

      case 'suppliers':
        return {
          headers: TEMPLATE_DATA.suppliers.headers,
          rows: inventory.suppliers.map(s => [
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
        };

      case 'categories':
        return {
          headers: TEMPLATE_DATA.categories.headers,
          rows: inventory.categories.map(c => {
            const parent = inventory.categories.find(p => p.id === c.parent_id);
            return [
              c.name,
              c.description || '',
              parent?.name || ''
            ];
          })
        };

      case 'documents':
        return {
          headers: TEMPLATE_DATA.documents.headers,
          rows: inventory.documents.map(d => [
            d.document_number,
            d.document_type,
            d.document_date,
            d.supplier?.name || d.counterparty_name || '',
            d.total_amount.toString(),
            d.notes || ''
          ])
        };
    }
  };

  const getFilename = (type: ExportType, format: FileFormat, isTemplate = false): string => {
    const prefix = isTemplate ? 'шаблон_' : '';
    const formatInfo = SUPPORTED_FORMATS.find(f => f.value === format);
    return `${prefix}${TYPE_LABELS[type].toLowerCase()}_${new Date().toISOString().split('T')[0]}${formatInfo?.extension || '.xlsx'}`;
  };

  const downloadFile = (data: string[][], filename: string, format: FileFormat) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Set column widths
    const colWidths = data[0].map((_, i) => ({
      wch: Math.max(...data.map(row => (row[i] || '').toString().length)) + 2
    }));
    ws['!cols'] = colWidths;

    let bookType: XLSX.BookType;
    switch (format) {
      case 'csv': bookType = 'csv'; break;
      case 'xls': bookType = 'biff8'; break;
      case 'ods': bookType = 'ods'; break;
      default: bookType = 'xlsx';
    }

    XLSX.writeFile(wb, filename, { bookType });
  };

  const exportData = (type: ExportType) => {
    const { headers, rows } = getDataForType(type);
    const data = [headers, ...rows];
    const filename = getFilename(type, exportFormat);
    downloadFile(data, filename, exportFormat);
    toast({ title: 'Експорт успешен', description: `Файлът ${filename} е изтеглен` });
  };

  const downloadTemplate = (type: ExportType) => {
    const { headers, sampleRows } = TEMPLATE_DATA[type];
    const data = [headers, ...sampleRows];
    const filename = `шаблон_${TYPE_LABELS[type].toLowerCase()}.csv`;
    downloadFile(data, filename, 'csv');
    toast({ title: 'Шаблон изтеглен', description: `Файлът ${filename} е изтеглен` });
  };

  const parseFileData = async (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { 
            header: 1,
            defval: ''
          });
          resolve(jsonData as string[][]);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (type: ExportType) => {
    if (!fileInputRef.current?.files?.length) return;
    
    const file = fileInputRef.current.files[0];

    try {
      const rows = await parseFileData(file);
      const headers = rows[0] || [];
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell && cell.toString().trim()));
      
      setPreviewData({
        type,
        headers: headers.map(h => h.toString()),
        rows: dataRows.map(row => row.map(cell => (cell || '').toString())),
        fileName: file.name
      });
    } catch (err) {
      toast({ title: 'Грешка', description: 'Неуспешно четене на файла', variant: 'destructive' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmImport = async () => {
    if (!previewData) return;
    
    setImporting(true);
    setImportResult(null);

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < previewData.rows.length; i++) {
      const row = previewData.rows[i];
      try {
        switch (previewData.type) {
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
    setPreviewData(null);
    setImporting(false);
    
    if (success > 0) {
      toast({ title: 'Импорт завършен', description: `Успешно импортирани: ${success}` });
    }
  };

  const cancelPreview = () => {
    setPreviewData(null);
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

  // Preview mode
  if (previewData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Преглед преди импорт - {TYPE_LABELS[previewData.type]}
            </DialogTitle>
            <DialogDescription>
              Файл: {previewData.fileName} • {previewData.rows.length} записа за импорт
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                    {previewData.headers.map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.slice(0, 100).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t hover:bg-muted/50">
                      <td className="px-3 py-2 text-muted-foreground">{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                          {cell || <span className="text-muted-foreground italic">празно</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.rows.length > 100 && (
                <div className="p-3 text-center text-sm text-muted-foreground bg-muted/50">
                  Показани са първите 100 реда от общо {previewData.rows.length}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelPreview} disabled={importing}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <Button onClick={confirmImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Импортиране...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Потвърди импорт ({previewData.rows.length} записа)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Импорт / Експорт
          </DialogTitle>
          <DialogDescription>
            Импортирайте или експортирайте данни в различни формати
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
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
            <div className="space-y-2">
              <Label>Формат на файла</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as FileFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете формат" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label} ({format.extension})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Изберете какво искате да експортирате:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {exportButtons.map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => exportData(type)}
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
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Разрешени формати:</p>
              <p className="text-xs text-muted-foreground">
                .csv, .xls, .xlsx, .xlst, .ods, .ots
              </p>
            </div>

            {/* Template downloads */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                Свали примерен шаблон
              </Label>
              <div className="flex flex-wrap gap-2">
                {exportButtons.filter(b => b.type !== 'documents').map(({ type, label }) => (
                  <Button
                    key={type}
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadTemplate(type)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Изберете тип данни за импорт:
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
