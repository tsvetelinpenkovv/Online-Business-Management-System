import { FC, useState, useMemo } from 'react';
import { 
  Calendar, User, UserCheck, Phone, Euro, Package, 
  Barcode, Layers, Truck, MessageCircle, MoreHorizontal, 
  Pencil, Trash2, Printer, Globe, Search, ExternalLink, Settings2, FileText, FileBox,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Order, ORDER_STATUSES } from '@/types/order';
import { SourceIcon } from '@/components/icons/SourceIcon';
import { CourierLogo } from './CourierLogo';
import { StatusBadge } from './StatusBadge';
import { PhoneWithFlag } from './PhoneWithFlag';
import { InfoPopover } from './InfoPopover';
import { CorrectStatusIcon } from './CorrectStatusIcon';
import { MobileOrderCard } from './MobileOrderCard';
import { InvoiceDialog } from './InvoiceDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface OrdersTableProps {
  orders: Order[];
  onDelete: (id: number) => void;
  onUpdate: (order: Order) => void;
  selectedOrders: number[];
  onSelectionChange: (ids: number[]) => void;
}

export const OrdersTable: FC<OrdersTableProps> = ({ 
  orders, 
  onDelete, 
  onUpdate,
  selectedOrders,
  onSelectionChange
}) => {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const sortedOrders = useMemo(() => {
    if (!sortOrder) return orders;
    return [...orders].sort((a, b) => {
      if (sortOrder === 'asc') return a.id - b.id;
      return b.id - a.id;
    });
  }, [orders, sortOrder]);

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder(null);
  };

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

  const handleCopyCatalog = (catalogNumber: string) => {
    navigator.clipboard.writeText(catalogNumber);
    toast({
      title: 'Копирано',
      description: `Каталожен номер ${catalogNumber} е копиран`,
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

          {sortedOrders.map((order) => (
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
                  onUpdate({ ...orderToUpdate, status: newStatus });
                }
              }}
            />
          ))}
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
              <TableHead className="w-[50px]">
                <button 
                  onClick={toggleSort}
                  className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                >
                  ID
                  <div className="flex flex-col -space-y-1">
                    <ArrowUp className={`w-3 h-3 ${sortOrder === 'asc' ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    <ArrowDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'text-primary' : 'text-muted-foreground/50'}`} />
                  </div>
                </button>
              </TableHead>
              <TableHead className="w-[50px] text-center" title="Източник">
                <Globe className="w-4 h-4 text-muted-foreground mx-auto flex-shrink-0" />
              </TableHead>
              <TableHead className="w-[90px]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Дата
                </div>
              </TableHead>
              <TableHead className="w-[110px]">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Клиент
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-center" title="Коректност на клиента">
                <UserCheck className="w-4 h-4 text-muted-foreground mx-auto flex-shrink-0" />
              </TableHead>
              <TableHead className="w-[130px]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Телефон
                </div>
              </TableHead>
              <TableHead className="w-[80px]">
                <div className="flex items-center gap-1.5">
                  <Euro className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Цена
                </div>
              </TableHead>
              <TableHead className="w-[140px]">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Продукт
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Кат.№
                </div>
              </TableHead>
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
              <TableHead className="w-[140px]">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Статус
                </div>
              </TableHead>
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
                <TableCell className="text-xs text-muted-foreground" title={`Поръчка номер ${order.id}`}>№ {order.id}</TableCell>
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
                    <span title={`Клиент: ${order.customer_name}`}>{order.customer_name}</span>
                    <InfoPopover 
                      title="Данни за клиента" 
                      icon="eye"
                      content={
                        <div className="space-y-2">
                          <p className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Име:</strong> {order.customer_name}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Телефон:</strong> {order.phone}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Адрес:</strong> {order.delivery_address || '-'}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Имейл:</strong> {order.customer_email || '-'}</span>
                          </p>
                        </div>
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <CorrectStatusIcon isCorrect={order.is_correct} />
                </TableCell>
                <TableCell className="text-sm">
                  <PhoneWithFlag phone={order.phone} />
                </TableCell>
                <TableCell className="text-sm font-medium text-success whitespace-nowrap" title={`Обща сума: ${order.total_price.toFixed(2)} €`}>{order.total_price.toFixed(2)} €</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm line-clamp-2 max-w-[120px]" title={order.product_name}>
                      {order.product_name}
                    </span>
                    <InfoPopover 
                      title="Детайли на продукта" 
                      icon="eye"
                      content={
                        <div className="space-y-2">
                          <p className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span><strong>Продукт:</strong> {order.product_name}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Barcode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span><strong>Кат. номер:</strong> {order.catalog_number || '-'}</span>
                          </p>
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
                <TableCell 
                  className="font-mono text-xs text-muted-foreground whitespace-nowrap cursor-pointer hover:text-primary transition-colors"
                  onClick={() => order.catalog_number && handleCopyCatalog(order.catalog_number)}
                  title={order.catalog_number ? "Кликни за копиране" : undefined}
                >
                  {order.catalog_number || '-'}
                </TableCell>
                <TableCell className="text-center" title={`Количество: ${order.quantity} бр.`}>
                  {order.quantity > 1 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
                      {order.quantity}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                      {order.quantity}
                    </span>
                  )}
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
                          <div className="flex items-start gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{order.delivery_address}</span>
                          </div>
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
                    onStatusChange={(newStatus) => onUpdate({ ...order, status: newStatus })}
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
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell title="Действия с поръчката">
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
                        onClick={() => setDeleteId(order.id)}
                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Изтрій
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
