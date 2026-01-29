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
  FileDown, Eye, ArrowLeft, Loader2, ArrowRight, Link2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

type ExportType = 'products' | 'suppliers' | 'categories' | 'documents' | 'revision';
type FileFormat = 'csv' | 'xlsx' | 'xls' | 'ods';
type ImportStep = 'select' | 'mapping' | 'preview';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ReturnType<typeof useInventory>;
}

interface FileData {
  type: ExportType;
  headers: string[];
  rows: string[][];
  fileName: string;
}

interface ColumnMapping {
  [targetField: string]: number | null; // maps target field to source column index
}

const SUPPORTED_FORMATS: { value: FileFormat; label: string; extension: string }[] = [
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'xlsx', label: 'Excel (XLSX)', extension: '.xlsx' },
  { value: 'xls', label: 'Excel (XLS)', extension: '.xls' },
  { value: 'ods', label: 'OpenDocument (ODS)', extension: '.ods' },
];

const ACCEPTED_FILE_TYPES = '.csv,.xls,.xlsx,.xlst,.ods,.ots';

const FIELD_DEFINITIONS: Record<ExportType, { key: string; label: string; required?: boolean }[]> = {
  products: [
    { key: 'sku', label: 'SKU', required: true },
    { key: 'name', label: 'Име', required: true },
    { key: 'description', label: 'Описание' },
    { key: 'category', label: 'Категория' },
    { key: 'unit', label: 'Мерна единица' },
    { key: 'purchase_price', label: 'Покупна цена' },
    { key: 'sale_price', label: 'Продажна цена' },
    { key: 'min_stock', label: 'Мин. наличност' },
    { key: 'current_stock', label: 'Текуща наличност' },
    { key: 'barcode', label: 'Баркод' },
    { key: 'is_active', label: 'Активен' },
  ],
  suppliers: [
    { key: 'name', label: 'Име', required: true },
    { key: 'contact_person', label: 'Контактно лице' },
    { key: 'email', label: 'Имейл' },
    { key: 'phone', label: 'Телефон' },
    { key: 'address', label: 'Адрес' },
    { key: 'eik', label: 'ЕИК' },
    { key: 'vat_number', label: 'ДДС номер' },
    { key: 'notes', label: 'Бележки' },
    { key: 'is_active', label: 'Активен' },
  ],
  categories: [
    { key: 'name', label: 'Име', required: true },
    { key: 'description', label: 'Описание' },
    { key: 'parent', label: 'Родителска категория' },
  ],
  documents: [
    { key: 'number', label: 'Номер' },
    { key: 'type', label: 'Тип' },
    { key: 'date', label: 'Дата' },
    { key: 'counterparty', label: 'Контрагент' },
    { key: 'amount', label: 'Сума' },
    { key: 'notes', label: 'Бележки' },
  ],
  revision: [
    { key: 'sku', label: 'SKU', required: true },
    { key: 'name', label: 'Име' },
    { key: 'current_stock', label: 'Системна наличност' },
    { key: 'actual_stock', label: 'Реална наличност', required: true },
  ]
};

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
  },
  revision: {
    headers: ['SKU', 'Име', 'Системна наличност', 'Реална наличност'],
    sampleRows: [
      ['PRD-001', 'Примерен продукт 1', '100', ''],
      ['PRD-002', 'Примерен продукт 2', '50', ''],
    ]
  }
};

const TYPE_LABELS: Record<ExportType, string> = {
  products: 'Артикули',
  suppliers: 'Доставчици',
  categories: 'Категории',
  documents: 'Документи',
  revision: 'Ревизия'
};

// Try to auto-detect column mapping based on header names
const autoDetectMapping = (fileHeaders: string[], targetFields: { key: string; label: string }[]): ColumnMapping => {
  const mapping: ColumnMapping = {};
  const normalizedFileHeaders = fileHeaders.map(h => h.toLowerCase().trim());
  
  targetFields.forEach(field => {
    // Try to find matching column
    const fieldLabelLower = field.label.toLowerCase();
    const fieldKeyLower = field.key.toLowerCase().replace(/_/g, ' ');
    
    let matchIndex = normalizedFileHeaders.findIndex(h => 
      h === fieldLabelLower || 
      h === fieldKeyLower ||
      h.includes(fieldLabelLower) ||
      fieldLabelLower.includes(h)
    );
    
    // Special cases for common WooCommerce fields
    if (matchIndex === -1) {
      if (field.key === 'sku') {
        matchIndex = normalizedFileHeaders.findIndex(h => h.includes('sku') || h.includes('артикул'));
      } else if (field.key === 'name') {
        matchIndex = normalizedFileHeaders.findIndex(h => h.includes('име') || h.includes('name') || h.includes('заглавие') || h.includes('title'));
      } else if (field.key === 'sale_price') {
        matchIndex = normalizedFileHeaders.findIndex(h => h.includes('цена') || h.includes('price'));
      } else if (field.key === 'current_stock') {
        matchIndex = normalizedFileHeaders.findIndex(h => h.includes('наличност') || h.includes('stock') || h.includes('количество'));
      }
    }
    
    mapping[field.key] = matchIndex >= 0 ? matchIndex : null;
  });
  
  return mapping;
};

export const ImportExportDialog: FC<ImportExportDialogProps> = ({ 
  open, 
  onOpenChange, 
  inventory 
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<FileFormat>('xlsx');
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('select');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetImport = () => {
    setImportStep('select');
    setFileData(null);
    setColumnMapping({});
    setImportResult(null);
  };

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

      case 'revision':
        return {
          headers: TEMPLATE_DATA.revision.headers,
          rows: inventory.products.map(p => [
            p.sku,
            p.name,
            p.current_stock.toString(),
            '' // Empty column for actual stock to be filled during revision
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
      
      const newFileData: FileData = {
        type,
        headers: headers.map(h => h.toString()),
        rows: dataRows.map(row => row.map(cell => (cell || '').toString())),
        fileName: file.name
      };
      
      setFileData(newFileData);
      
      // Auto-detect column mapping
      const fields = FIELD_DEFINITIONS[type];
      const autoMapping = autoDetectMapping(newFileData.headers, fields);
      setColumnMapping(autoMapping);
      
      setImportStep('mapping');
    } catch (err) {
      toast({ title: 'Грешка', description: 'Неуспешно четене на файла', variant: 'destructive' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getMappedValue = (row: string[], fieldKey: string): string => {
    const colIndex = columnMapping[fieldKey];
    if (colIndex === null || colIndex === undefined || colIndex < 0) return '';
    return row[colIndex] || '';
  };

  const getMappedRows = (): string[][] => {
    if (!fileData) return [];
    
    const fields = FIELD_DEFINITIONS[fileData.type];
    return fileData.rows.map(row => 
      fields.map(field => getMappedValue(row, field.key))
    );
  };

  const confirmImport = async () => {
    if (!fileData) return;
    
    setImporting(true);
    setImportResult(null);

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < fileData.rows.length; i++) {
      const row = fileData.rows[i];
      try {
        switch (fileData.type) {
          case 'products': {
            const categoryName = getMappedValue(row, 'category');
            const unitName = getMappedValue(row, 'unit');
            const category = inventory.categories.find(c => c.name === categoryName);
            const unit = inventory.units.find(u => u.abbreviation === unitName || u.name === unitName);
            
            const sku = getMappedValue(row, 'sku') || `SKU-${Date.now()}-${i}`;
            const name = getMappedValue(row, 'name');
            
            if (!name) {
              errors.push(`Ред ${i + 2}: Липсва име на продукта`);
              continue;
            }
            
            await inventory.createProduct({
              sku,
              name,
              description: getMappedValue(row, 'description') || null,
              category_id: category?.id || null,
              unit_id: unit?.id || null,
              purchase_price: parseFloat(getMappedValue(row, 'purchase_price')) || 0,
              sale_price: parseFloat(getMappedValue(row, 'sale_price')) || 0,
              min_stock_level: parseFloat(getMappedValue(row, 'min_stock')) || 0,
              barcode: getMappedValue(row, 'barcode') || null,
              is_active: getMappedValue(row, 'is_active') !== 'Не',
              woocommerce_id: null,
              is_bundle: false,
              external_bundle_type: null,
            });
            success++;
            break;
          }
          case 'suppliers': {
            const name = getMappedValue(row, 'name');
            if (!name) {
              errors.push(`Ред ${i + 2}: Липсва име на доставчика`);
              continue;
            }
            
            await inventory.createSupplier({
              name,
              contact_person: getMappedValue(row, 'contact_person') || null,
              email: getMappedValue(row, 'email') || null,
              phone: getMappedValue(row, 'phone') || null,
              address: getMappedValue(row, 'address') || null,
              eik: getMappedValue(row, 'eik') || null,
              vat_number: getMappedValue(row, 'vat_number') || null,
              notes: getMappedValue(row, 'notes') || null,
              is_active: getMappedValue(row, 'is_active') !== 'Не',
            });
            success++;
            break;
          }
          case 'categories': {
            const name = getMappedValue(row, 'name');
            if (!name) {
              errors.push(`Ред ${i + 2}: Липсва име на категорията`);
              continue;
            }
            
            const parentName = getMappedValue(row, 'parent');
            const parent = inventory.categories.find(c => c.name === parentName);
            
            await inventory.createCategory({
              name,
              description: getMappedValue(row, 'description') || null,
              parent_id: parent?.id || null,
            });
            success++;
            break;
          }
          case 'revision': {
            const sku = getMappedValue(row, 'sku');
            const actualStock = parseFloat(getMappedValue(row, 'actual_stock'));
            
            if (!sku) {
              errors.push(`Ред ${i + 2}: Липсва SKU`);
              continue;
            }
            if (isNaN(actualStock)) {
              errors.push(`Ред ${i + 2}: Липсва или невалидна реална наличност`);
              continue;
            }
            
            // Find product by SKU and update stock
            const product = inventory.products.find(p => p.sku === sku);
            if (!product) {
              errors.push(`Ред ${i + 2}: Продукт с SKU "${sku}" не е намерен`);
              continue;
            }
            
            // Create adjustment movement to set new stock
            await inventory.createStockMovement(
              product.id,
              'adjustment',
              actualStock,
              0,
              'Ревизия на наличности'
            );
            success++;
            break;
          }
        }
      } catch (err) {
        errors.push(`Ред ${i + 2}: ${err instanceof Error ? err.message : 'Неизвестна грешка'}`);
      }
    }

    setImportResult({ success, errors });
    resetImport();
    
    if (success > 0) {
      toast({ title: 'Импорт завършен', description: `Успешно импортирани: ${success}` });
    }
  };

  const triggerImport = (type: ExportType) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.importType = type;
      fileInputRef.current.click();
    }
  };

  const updateMapping = (fieldKey: string, colIndex: number | null) => {
    setColumnMapping(prev => ({ ...prev, [fieldKey]: colIndex }));
  };

  const exportButtons = [
    { type: 'products' as ExportType, label: 'Артикули', icon: Package, color: 'bg-primary' },
    { type: 'revision' as ExportType, label: 'Ревизия', icon: FileSpreadsheet, color: 'bg-purple' },
    { type: 'suppliers' as ExportType, label: 'Доставчици', icon: Users, color: 'bg-success' },
    { type: 'categories' as ExportType, label: 'Категории', icon: FolderTree, color: 'bg-info' },
    { type: 'documents' as ExportType, label: 'Документи', icon: FileText, color: 'bg-warning' },
  ];

  // Mapping step
  if (importStep === 'mapping' && fileData) {
    const fields = FIELD_DEFINITIONS[fileData.type];
    const requiredFields = fields.filter(f => f.required);
    const allRequiredMapped = requiredFields.every(f => columnMapping[f.key] !== null && columnMapping[f.key] !== undefined);
    
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) resetImport(); onOpenChange(o); }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Свързване на колони - {TYPE_LABELS[fileData.type]}
            </DialogTitle>
            <DialogDescription>
              Изберете коя колона от файла отговаря на всяко поле. Полетата с * са задължителни.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <span className="font-medium">Файл:</span> {fileData.fileName} • 
              <span className="font-medium ml-2">Колони:</span> {fileData.headers.length} • 
              <span className="font-medium ml-2">Редове:</span> {fileData.rows.length}
            </div>

            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-40 flex-shrink-0">
                      <Label className={field.required ? 'font-semibold' : ''}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Select
                      value={columnMapping[field.key]?.toString() ?? 'none'}
                      onValueChange={(v) => updateMapping(field.key, v === 'none' ? null : parseInt(v))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Изберете колона" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">-- Не импортирай --</span>
                        </SelectItem>
                        {fileData.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            <span className="font-medium">{header}</span>
                            {fileData.rows[0] && fileData.rows[0][index] && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                (пр: {fileData.rows[0][index].substring(0, 20)}{fileData.rows[0][index].length > 20 ? '...' : ''})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetImport}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <Button onClick={() => setImportStep('preview')} disabled={!allRequiredMapped}>
              <Eye className="w-4 h-4 mr-2" />
              Преглед
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Preview step
  if (importStep === 'preview' && fileData) {
    const fields = FIELD_DEFINITIONS[fileData.type];
    const mappedRows = getMappedRows();
    
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) resetImport(); onOpenChange(o); }}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Преглед преди импорт - {TYPE_LABELS[fileData.type]}
            </DialogTitle>
            <DialogDescription>
              Файл: {fileData.fileName} • {fileData.rows.length} записа за импорт
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                    {fields.map((field) => (
                      <th key={field.key} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {field.label}
                        {columnMapping[field.key] === null && (
                          <span className="text-orange-500 ml-1">(празно)</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 100).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t hover:bg-muted/50">
                      <td className="px-3 py-2 text-muted-foreground">{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                          {cell || <span className="text-muted-foreground italic">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {fileData.rows.length > 100 && (
                <div className="p-3 text-center text-sm text-muted-foreground bg-muted/50">
                  Показани са първите 100 реда от общо {fileData.rows.length}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setImportStep('mapping')} disabled={importing}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Промени mapping
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
                  Потвърди импорт ({fileData.rows.length} записа)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetImport(); onOpenChange(o); }}>
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

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'export' | 'import'); setImportResult(null); }}>
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
