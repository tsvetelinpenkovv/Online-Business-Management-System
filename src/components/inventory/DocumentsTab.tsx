import { FC, useState, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { StockDocument, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SortableHeader } from '@/components/ui/sortable-header';
import { 
  Plus, Search, FileText, Trash2, ArrowDownToLine, ArrowUpFromLine, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

type DocumentSortKey = 'document_number' | 'document_type' | 'document_date' | 'counterparty' | 'total_amount' | 'notes';

interface DocumentsTabProps {
  inventory: ReturnType<typeof useInventory>;
}

interface DocumentItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const DocumentsTab: FC<DocumentsTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    document_type: 'receiving' as DocumentType,
    supplier_id: '',
    counterparty_name: '',
    notes: '',
  });
  const [items, setItems] = useState<DocumentItem[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [sortKey, setSortKey] = useState<DocumentSortKey>('document_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: DocumentSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = inventory.documents.filter(d => 
      d.document_number.toLowerCase().includes(search.toLowerCase()) ||
      d.counterparty_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.supplier?.name.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'document_number':
          comparison = a.document_number.localeCompare(b.document_number);
          break;
        case 'document_type':
          comparison = a.document_type.localeCompare(b.document_type);
          break;
        case 'document_date':
          comparison = new Date(a.document_date).getTime() - new Date(b.document_date).getTime();
          break;
        case 'counterparty':
          comparison = (a.supplier?.name || a.counterparty_name || '').localeCompare(b.supplier?.name || b.counterparty_name || '');
          break;
        case 'total_amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'notes':
          comparison = (a.notes || '').localeCompare(b.notes || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [inventory.documents, search, sortKey, sortDirection]);

  const openCreateDialog = (type: DocumentType) => {
    setFormData({
      document_type: type,
      supplier_id: '',
      counterparty_name: '',
      notes: '',
    });
    setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    setIsDialogOpen(true);
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price from product
    if (field === 'productId' && value) {
      const product = inventory.products.find(p => p.id === value);
      if (product) {
        if (formData.document_type === 'receiving') {
          newItems[index].unitPrice = product.purchase_price;
        } else {
          newItems[index].unitPrice = product.sale_price;
        }
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async () => {
    const validItems = items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) return;

    await inventory.createStockDocument(
      formData.document_type,
      validItems,
      formData.supplier_id || undefined,
      formData.counterparty_name || undefined,
      formData.notes || undefined
    );
    setIsDialogOpen(false);
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'receiving':
        return <ArrowDownToLine className="w-4 h-4 text-success" />;
      case 'dispatch':
        return <ArrowUpFromLine className="w-4 h-4 text-destructive" />;
      case 'adjustment':
      case 'inventory':
        return <RefreshCw className="w-4 h-4 text-info" />;
      case 'return':
        return <ArrowDownToLine className="w-4 h-4 text-warning" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDocumentBadge = (type: DocumentType) => {
    switch (type) {
      case 'receiving':
        return <Badge className="bg-success text-success-foreground">{DOCUMENT_TYPE_LABELS[type]}</Badge>;
      case 'dispatch':
        return <Badge className="bg-destructive text-destructive-foreground">{DOCUMENT_TYPE_LABELS[type]}</Badge>;
      case 'adjustment':
      case 'inventory':
        return <Badge className="bg-info text-info-foreground">{DOCUMENT_TYPE_LABELS[type]}</Badge>;
      case 'return':
        return <Badge className="bg-warning text-warning-foreground">{DOCUMENT_TYPE_LABELS[type]}</Badge>;
      default:
        return <Badge>{DOCUMENT_TYPE_LABELS[type]}</Badge>;
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Търси документ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openCreateDialog('receiving')} className="bg-success hover:bg-success/90">
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Приход
          </Button>
          <Button onClick={() => openCreateDialog('dispatch')} variant="destructive">
            <ArrowUpFromLine className="w-4 h-4 mr-2" />
            Разход
          </Button>
          <Button onClick={() => openCreateDialog('adjustment')} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Корекция
          </Button>
        </div>
      </div>

      {/* Documents - Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredAndSortedDocuments.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Няма намерени документи</p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(doc.document_type)}
                      <span className="font-mono font-medium">{doc.document_number}</span>
                    </div>
                    {getDocumentBadge(doc.document_type)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Дата:</span>
                      <span className="text-sm">{format(new Date(doc.document_date), 'dd.MM.yyyy', { locale: bg })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Контрагент:</span>
                      <span className="text-sm font-medium">{doc.supplier?.name || doc.counterparty_name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Сума:</span>
                      <span className="font-bold">{doc.total_amount.toFixed(2)} €</span>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground pt-2 border-t line-clamp-2">{doc.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Documents Table - Desktop */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader columnKey="document_number" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Документ №
                    </SortableHeader>
                    <SortableHeader columnKey="document_type" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                      Тип
                    </SortableHeader>
                    <SortableHeader columnKey="document_date" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                      Дата
                    </SortableHeader>
                    <SortableHeader columnKey="counterparty" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                      Контрагент
                    </SortableHeader>
                    <SortableHeader columnKey="total_amount" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="right">
                      Сума
                    </SortableHeader>
                    <SortableHeader columnKey="notes" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                      Бележки
                    </SortableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Няма намерени документи</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDocumentIcon(doc.document_type)}
                            <span className="font-mono font-medium">{doc.document_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getDocumentBadge(doc.document_type)}</TableCell>
                        <TableCell>
                          {format(new Date(doc.document_date), 'dd.MM.yyyy', { locale: bg })}
                        </TableCell>
                        <TableCell>
                          {doc.supplier?.name || doc.counterparty_name || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {doc.total_amount.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {doc.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Document Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getDocumentIcon(formData.document_type)}
              Нов {DOCUMENT_TYPE_LABELS[formData.document_type]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Document Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.document_type === 'receiving' ? (
                <div className="space-y-2">
                  <Label>Доставчик</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Избери доставчик" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="counterparty">Контрагент</Label>
                  <Input
                    id="counterparty"
                    value={formData.counterparty_name}
                    onChange={(e) => setFormData({ ...formData, counterparty_name: e.target.value })}
                    placeholder="Име на клиент/получател"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Бележки</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Допълнителни бележки"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Артикули</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Добави ред
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Артикул</TableHead>
                      <TableHead className="w-[100px]">Количество</TableHead>
                      <TableHead className="w-[120px]">Ед. цена</TableHead>
                      <TableHead className="w-[120px] text-right">Сума</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Избери артикул" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventory.products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.sku} - {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(item.quantity * item.unitPrice).toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="text-right">
                  <span className="text-muted-foreground">Обща сума: </span>
                  <span className="text-xl font-bold">{totalAmount.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отказ
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!items.some(item => item.productId && item.quantity > 0)}
            >
              Създай документ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
