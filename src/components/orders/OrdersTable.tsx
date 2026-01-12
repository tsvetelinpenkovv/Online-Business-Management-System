import { FC, useState, useMemo, useEffect } from 'react';
import { 
  Calendar, User, UserCheck, Phone, Euro, Package, 
  Barcode, Layers, Truck, MessageCircle, MoreHorizontal, 
  Pencil, Trash2, Printer, Globe, Search, ExternalLink, Settings2, FileText, FileBox, Copy, Check, ArrowUpDown,
  Send, Loader2, Smartphone
} from 'lucide-react';
import { Order, ORDER_STATUSES } from '@/types/order';
import { SourceIcon } from '@/components/icons/SourceIcon';
import { CourierLogo } from './CourierLogo';
import { StatusBadge } from './StatusBadge';
import { QuantityPopover } from './QuantityPopover';
import { PhoneWithFlag } from './PhoneWithFlag';
import { InfoPopover, CopyableText } from './InfoPopover';
import { CorrectStatusIcon } from './CorrectStatusIcon';
import { MobileOrderCard } from './MobileOrderCard';
import { InvoiceDialog } from './InvoiceDialog';
import { MessageStatusIcon } from './MessageStatusIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrderMessages } from '@/hooks/useOrderMessages';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { format } from 'date-fns';
import { EditOrderDialog } from './EditOrderDialog';

type OrderSortKey = 'id' | 'created_at' | 'customer_name' | 'phone' | 'total_price' | 'product_name' | 'catalog_number' | 'quantity' | 'status';

interface OrdersTableProps {
  orders: Order[];
  onDelete: (id: number) => void;
  onUpdate: (order: Order) => void;
  selectedOrders: number[];
  onSelectionChange: (ids: number[]) => void;
  nekorektenEnabled?: boolean;
}

// Invoice icon button component - checks if order has invoice
const InvoiceIconButton: FC<{ orderId: number; onClick: () => void }> = ({ orderId, onClick }) => {
  const [hasInvoice, setHasInvoice] = useState(false);

  useEffect(() => {
    const checkInvoice = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();
      setHasInvoice(!!data);
    };
    checkInvoice();
  }, [orderId]);

  if (!hasInvoice) return null;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-6 w-6 text-success hover:bg-success/10 hover:text-success" 
      onClick={onClick}
      title="Има издадена фактура"
    >
      <FileText className="w-4 h-4" />
    </Button>
  );
};

export const OrdersTable: FC<OrdersTableProps> = ({ 
  orders, 
  onDelete, 
  onUpdate,
  selectedOrders,
  onSelectionChange,
  nekorektenEnabled = true
}) => {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [sendingMessage, setSendingMessage] = useState<number | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<OrderSortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Fetch messages for orders
  const orderIds = useMemo(() => orders.map(o => o.id), [orders]);
  const { getOrderMessage, refetch: refetchMessages } = useOrderMessages(orderIds);

  const handleSendMessage = async (order: Order) => {
    setSendingMessage(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('connectix-send', {
        body: {
          action: 'send',
          order_id: order.id,
          phone: order.phone,
          customer_name: order.customer_name,
          product_name: order.product_name,
          total_price: order.total_price,
          tracking_number: order.courier_tracking_url,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Успех',
          description: data.sandbox ? 'Тестово съобщение (sandbox режим)' : 'Съобщението е изпратено успешно!',
        });
        refetchMessages(); // Refresh message icons
      } else {
        throw new Error(data?.error || 'Неуспешно изпращане');
      }
    } catch (err: any) {
      toast({
        title: 'Грешка',
        description: err.message || 'Неуспешно изпращане на съобщение',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(null);
    }
  };

  const handleSort = (key: OrderSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'customer_name':
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case 'phone':
          comparison = a.phone.localeCompare(b.phone);
          break;
        case 'total_price':
          comparison = a.total_price - b.total_price;
          break;
        case 'product_name':
          comparison = a.product_name.localeCompare(b.product_name);
          break;
        case 'catalog_number':
          comparison = (a.catalog_number || '').localeCompare(b.catalog_number || '');
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [orders, sortKey, sortDirection]);

  const SortableHead = ({ columnKey, children, className = '', align = 'left' }: { columnKey: OrderSortKey; children: React.ReactNode; className?: string; align?: 'left' | 'center' | 'right' }) => (
    <TableHead 
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        <ArrowUpDown className={`w-3 h-3 flex-shrink-0 ${sortKey === columnKey ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  const getRowColorByStatus = () => {
    return 'hover:bg-muted/30';
  };

  const getRowStripClass = (status: string) => {
    // Use a pseudo-element strip so it doesn't shift table columns (no "white gutter" in the header)
    // Hide on desktop (lg:), show only on mobile/tablet
    const base = "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:content-[''] lg:before:hidden";

    switch (status) {
      case 'Нова':
        return `${base} before:bg-primary`;
      case 'В обработка':
        return `${base} before:bg-info`;
      case 'Неуспешна връзка':
        return `${base} before:bg-warning`;
      case 'Потвърдена':
        return `${base} before:bg-success`;
      case 'Платена с карта':
        return `${base} before:bg-purple`;
      case 'На лизинг през TBI':
      case 'На лизинг през BNP':
      case 'На лизинг през UniCredit':
        return `${base} before:bg-teal`;
      case 'Изпратена':
        return `${base} before:bg-warning`;
      case 'Неуспешна доставка':
        return `${base} before:bg-destructive`;
      case 'Доставена':
      case 'Завършена':
        return `${base} before:bg-success`;
      case 'Върната':
      case 'Анулирана':
        return `${base} before:bg-muted-foreground`;
      case 'Отказана':
        return `${base} before:bg-destructive`;
      default:
        return `${base} before:bg-primary`;
    }
  };

  const [copiedCatalog, setCopiedCatalog] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopyCatalog = (catalogNumber: string) => {
    navigator.clipboard.writeText(catalogNumber);
    setCopiedCatalog(catalogNumber);
    setTimeout(() => setCopiedCatalog(null), 2000);
    toast({
      title: 'Копирано',
      description: `Каталожен номер ${catalogNumber} е копиран`,
    });
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
    toast({
      title: 'Копирано',
      description: `Телефон ${phone} е копиран`,
    });
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Поръчка №${order.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .info { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Поръчка №${order.id} - ${order.code}</h1>
            <div class="info"><span class="label">Клиент:</span> ${order.customer_name}</div>
            <div class="info"><span class="label">Телефон:</span> ${order.phone}</div>
            <div class="info"><span class="label">Продукт:</span> ${order.product_name}</div>
            <div class="info"><span class="label">Каталожен номер:</span> ${order.catalog_number || '-'}</div>
            <div class="info"><span class="label">Количество:</span> ${order.quantity}</div>
            <div class="info"><span class="label">Цена:</span> ${order.total_price.toFixed(2)} €</div>
            <div class="info"><span class="label">Доставка:</span> ${order.delivery_address || '-'}</div>
            <div class="info"><span class="label">Статус:</span> ${order.status}</div>
            <div class="info"><span class="label">Коментар:</span> ${order.comment || '-'}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(orders.map(o => o.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (orderId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedOrders, orderId]);
    } else {
      onSelectionChange(selectedOrders.filter(id => id !== orderId));
    }
  };

  const isAllSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const isSomeSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  // Mobile view - card layout
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {/* Select all on mobile */}
          <div className="flex items-center gap-2 p-2 bg-card rounded-lg border">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Избери всички"
              className={isSomeSelected ? 'opacity-50' : ''}
            />
            <span className="text-sm text-muted-foreground">
              {isAllSelected ? 'Премахни избора' : 'Избери всички'}
            </span>
          </div>

          {orders.map((order) => {
            const message = getOrderMessage(order.id);
            const messageInfo = message ? {
              channel: message.channel as 'viber' | 'sms',
              status: message.status as 'sent' | 'delivered' | 'read' | 'failed',
              sentAt: message.sent_at,
            } : null;
            
            return (
              <MobileOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={(checked) => handleSelectOne(order.id, checked)}
                onEdit={() => setEditOrder(order)}
                onDelete={() => setDeleteId(order.id)}
                onPrint={() => handlePrint(order)}
                onStatusChange={(orderId, newStatus) => {
                  const orderToUpdate = orders.find(o => o.id === orderId);
                  if (orderToUpdate) {
                    onUpdate({ ...orderToUpdate, status: newStatus as any });
                  }
                }}
                messageInfo={messageInfo}
                nekorektenEnabled={nekorektenEnabled}
              />
            );
          })}
        </div>

        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
              <AlertDialogDescription>
                Това действие не може да бъде отменено. Поръчката ще бъде изтрита завинаги.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отказ</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) onDelete(deleteId);
                  setDeleteId(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Изтрий
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EditOrderDialog 
          order={editOrder} 
          onClose={() => setEditOrder(null)} 
          onSave={onUpdate}
        />
      </>
    );
  }

  // Desktop view - table layout
  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/50 border-l-0">
              <TableHead className="w-[40px] pl-2 pr-0">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Избери всички"
                  className={isSomeSelected ? 'opacity-50' : ''}
                />
              </TableHead>
              <SortableHead columnKey="id" className="w-[80px]">
                ID
              </SortableHead>
              <TableHead className="w-[50px] text-center" title="Източник">
                <Globe className="w-4 h-4 text-muted-foreground mx-auto flex-shrink-0" />
              </TableHead>
              <SortableHead columnKey="created_at" className="w-[90px]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Дата
                </div>
              </SortableHead>
              <SortableHead columnKey="customer_name" className="w-[100px]">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Клиент
                </div>
              </SortableHead>
              {nekorektenEnabled && (
                <TableHead className="w-[50px] text-center" title="Коректност на клиента">
                  <UserCheck className="w-4 h-4 text-muted-foreground mx-auto flex-shrink-0" />
                </TableHead>
              )}
              <SortableHead columnKey="phone" className="w-[115px]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Телефон
                </div>
              </SortableHead>
              <SortableHead columnKey="total_price" className="w-[80px]" align="center">
                <Euro className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                Цена
              </SortableHead>
              <SortableHead columnKey="product_name" className="w-[125px]" align="center">
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                Продукт
              </SortableHead>
              <SortableHead columnKey="catalog_number" className="w-[100px]" align="center">
                <Barcode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                Кат.№
              </SortableHead>
              <TableHead className="w-[50px] text-center" title="Количество">
                <Layers className="w-4 h-4 text-muted-foreground mx-auto flex-shrink-0" />
              </TableHead>
              <TableHead className="w-[120px]">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Доставка
                </div>
              </TableHead>
              <TableHead className="w-[70px] text-center" title="Товарителница">
                <ExternalLink className="w-4 h-4 text-muted-foreground mx-auto flex-shrink-0" />
              </TableHead>
              <SortableHead columnKey="status" className="w-[140px]">
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                Статус
              </SortableHead>
              <TableHead className="w-[160px]">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Коментар
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-center">
                <Settings2 className="w-4 h-4 text-muted-foreground mx-auto flex-shrink-0" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order) => (
              <TableRow key={order.id} className={getRowColorByStatus()}>
                <TableCell className={`${getRowStripClass(order.status)} pl-2 pr-0`}>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => handleSelectOne(order.id, checked as boolean)}
                    aria-label={`Избери поръчка ${order.id}`}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap" title={`Поръчка номер ${order.id}`}>
                  № {order.id}
                </TableCell>
                <TableCell title={`Източник: ${order.source === 'google' ? 'Google' : order.source === 'facebook' ? 'Facebook' : 'WooCommerce'}`}>
                  <SourceIcon source={order.source} className="w-5 h-5" />
                </TableCell>
                
                <TableCell className="text-xs text-muted-foreground" title={`Дата на поръчка: ${format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}`}>
                  <div className="flex flex-col items-center">
                    <span>{format(new Date(order.created_at), 'dd.MM.yyyy')}</span>
                    <span>{format(new Date(order.created_at), 'HH:mm')}</span>
                  </div>
                </TableCell>
<TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <span className="line-clamp-2 max-w-[100px] font-medium leading-tight" title={`Клиент: ${order.customer_name}`}>{order.customer_name}</span>
                    <InfoPopover 
                      title="Данни за клиента" 
                      icon="eye"
                      content={
                        <div className="space-y-2">
                          <CopyableText 
                            label="Име" 
                            value={order.customer_name}
                            icon={<User className="w-4 h-4 text-muted-foreground" />}
                          />
                          <CopyableText 
                            label="Телефон" 
                            value={order.phone}
                            icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                          />
                          <CopyableText 
                            label="Адрес" 
                            value={order.delivery_address || '-'}
                            icon={<Truck className="w-4 h-4 text-muted-foreground" />}
                          />
                          <CopyableText 
                            label="Имейл" 
                            value={order.customer_email || '-'}
                            icon={<Globe className="w-4 h-4 text-muted-foreground" />}
                          />
                        </div>
                      }
                    />
                  </div>
                </TableCell>
                {nekorektenEnabled && (
                  <TableCell>
                    <CorrectStatusIcon isCorrect={order.is_correct} />
                  </TableCell>
                )}
<TableCell className="text-[13px]">
                  <div className="flex items-center gap-1">
                    <span className="line-clamp-2 max-w-[100px] font-medium text-foreground leading-tight">{order.phone}</span>
                    <button
                      onClick={() => handleCopyPhone(order.phone)}
                      className="p-0.5 hover:bg-muted rounded transition-colors"
                      title="Копирай телефон"
                    >
                      {copiedPhone === order.phone ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-success whitespace-nowrap text-center" title={`Обща сума: ${order.total_price.toFixed(2)} €`}>{order.total_price.toFixed(2)} €</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm line-clamp-2 max-w-[120px] font-medium" title={order.product_name}>
                      {order.product_name}
                    </span>
                    <InfoPopover 
                      title="Детайли на продукта" 
                      icon="eye"
                      content={
                        <div className="space-y-2">
                          <CopyableText 
                            label="Продукт" 
                            value={order.product_name}
                            icon={<Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                          />
                          <CopyableText 
                            label="Кат. номер" 
                            value={order.catalog_number || '-'}
                            icon={<Barcode className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                          />
                          <p className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <strong>Количество:</strong> 
                            {order.quantity > 1 ? (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
                                {order.quantity} бр.
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                                {order.quantity} бр.
                              </span>
                            )}
                          </p>
                          <p className="flex items-center gap-2">
                            <Euro className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span><strong>Цена:</strong> <span className="text-success font-medium">{order.total_price.toFixed(2)} €</span></span>
                          </p>
                        </div>
                      }
                    />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap text-center">
                  {order.catalog_number ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="truncate max-w-[80px]" title={order.catalog_number}>
                        {order.catalog_number.includes(',') 
                          ? `${order.catalog_number.split(',')[0].trim()}...`
                          : order.catalog_number
                        }
                      </span>
                      <button
                        onClick={() => handleCopyCatalog(order.catalog_number!)}
                        className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
                        title="Копирай каталожен номер"
                      >
                        {copiedCatalog === order.catalog_number ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <QuantityPopover 
                    productName={order.product_name}
                    quantity={order.quantity}
                    catalogNumber={order.catalog_number}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground line-clamp-2 max-w-[100px]" title={order.delivery_address || ''}>
                      {order.delivery_address || '-'}
                    </span>
                    {order.delivery_address && (
                      <InfoPopover 
                        title="Адрес за доставка" 
                        icon="eye"
                        content={
                          <CopyableText 
                            label="Адрес" 
                            value={order.delivery_address}
                            icon={<Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
                          />
                        }
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell title={order.courier_tracking_url ? `Проследяване на пратка` : 'Няма товарителница'}>
                  {order.courier_tracking_url || order.courier_id ? (
                    <div className="flex items-center justify-center gap-1">
                      <CourierLogo 
                        trackingUrl={order.courier_tracking_url} 
                        courierId={order.courier_id}
                        className="w-8 h-8" 
                      />
                      {order.courier_tracking_url && (
                        <a 
                          href={order.courier_tracking_url.startsWith('http') ? order.courier_tracking_url : `https://${order.courier_tracking_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 transition-colors"
                          title="Отвори проследяване в нов таб"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge 
                    status={order.status} 
                    editable 
                    onStatusChange={(newStatus) => onUpdate({ ...order, status: newStatus as any })}
                  />
                </TableCell>
                <TableCell>
                  {order.comment ? (
                    <InfoPopover 
                      title="Коментар" 
                      icon="info"
                      content={
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{order.comment}</span>
                        </div>
                      }
                    >
                      <span className="comment-bubble line-clamp-2 cursor-pointer">
                        {order.comment}
                      </span>
                    </InfoPopover>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-0.5">
                    {/* Invoice icon above the three dots */}
                    <InvoiceIconButton orderId={order.id} onClick={() => setInvoiceOrder(order)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Отвори меню с действия">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditOrder(order)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Редактирай
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setInvoiceOrder(order)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Фактура
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrint(order)}>
                        <Printer className="w-4 h-4 mr-2" />
                        Печат на поръчка
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (order.courier_tracking_url) {
                            window.open(order.courier_tracking_url.startsWith('http') ? order.courier_tracking_url : `https://${order.courier_tracking_url}`, '_blank');
                          }
                        }}
                        disabled={!order.courier_tracking_url}
                        className={!order.courier_tracking_url ? 'opacity-50' : ''}
                      >
                        <FileBox className="w-4 h-4 mr-2" />
                        Печат на товарителница
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSendMessage(order)}
                        disabled={sendingMessage === order.id}
                      >
                        {sendingMessage === order.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Изпрати Viber/SMS
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          // Ръчна проверка - в бъдеще ще използва API
                          toast({
                            title: 'Проверка в Некоректен',
                            description: 'API за Некоректен не е вързано. Моля конфигурирайте го в Настройки.',
                          });
                        }}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Проверка в Nekorekten
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(order.id)}
                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Изтрій
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                    {getOrderMessage(order.id) && (
                      <MessageStatusIcon
                        channel={getOrderMessage(order.id)!.channel}
                        status={getOrderMessage(order.id)!.status}
                        sentAt={getOrderMessage(order.id)!.sent_at}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие не може да бъде отменено. Поръчката ще бъде изтрита завинаги.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditOrderDialog 
        order={editOrder} 
        onClose={() => setEditOrder(null)} 
        onSave={onUpdate}
      />

      <InvoiceDialog
        order={invoiceOrder}
        open={invoiceOrder !== null}
        onOpenChange={(open) => !open && setInvoiceOrder(null)}
      />
    </>
  );
};
