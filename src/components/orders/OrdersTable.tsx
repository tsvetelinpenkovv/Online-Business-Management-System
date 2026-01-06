import { FC, useState } from 'react';
import { 
  Hash, Calendar, User, UserCheck, Phone, Euro, Package, 
  Barcode, Layers, Truck, MessageCircle, MoreHorizontal, 
  Pencil, Trash2, Printer, Globe, Search, ExternalLink, Settings2, FileText
} from 'lucide-react';
import { Order, ORDER_STATUSES } from '@/types/order';
import { SourceIcon } from '@/components/icons/SourceIcon';
import { EcontLogo } from '@/components/icons/EcontLogo';
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
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const getRowColorByStatus = (status: string) => {
    switch (status) {
      case 'Нова':
      case 'В обработка':
        return 'bg-muted/40 hover:bg-muted/60';
      default:
        return 'hover:bg-muted/30';
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
            <title>Поръчка #${order.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .info { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Поръчка #${order.id} - ${order.code}</h1>
            <div class="info"><span class="label">Клиент:</span> ${order.customer_name}</div>
            <div class="info"><span class="label">Телефон:</span> ${order.phone}</div>
            <div class="info"><span class="label">Продукт:</span> ${order.product_name}</div>
            <div class="info"><span class="label">Каталожен номер:</span> ${order.catalog_number || '-'}</div>
            <div class="info"><span class="label">Количество:</span> ${order.quantity}</div>
            <div class="info"><span class="label">Цена:</span> €${order.total_price.toFixed(2)}</div>
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

          {orders.map((order) => (
            <MobileOrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrders.includes(order.id)}
              onSelect={(checked) => handleSelectOne(order.id, checked)}
              onEdit={() => setEditOrder(order)}
              onDelete={() => setDeleteId(order.id)}
              onPrint={() => handlePrint(order)}
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
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Избери всички"
                  className={isSomeSelected ? 'opacity-50' : ''}
                />
              </TableHead>
              <TableHead className="w-[50px]">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  ID
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-center" title="Източник">
                <Globe className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableHead>
              <TableHead className="w-[90px]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Дата
                </div>
              </TableHead>
              <TableHead className="w-[110px]">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Клиент
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-center" title="Коректност на клиента">
                <UserCheck className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableHead>
              <TableHead className="w-[130px]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Телефон
                </div>
              </TableHead>
              <TableHead className="w-[80px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">€</span>
                  <span>Цена</span>
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  Продукт
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-muted-foreground" />
                  Кат.№
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-center" title="Количество">
                <Layers className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableHead>
              <TableHead className="w-[120px]">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Доставка
                </div>
              </TableHead>
              <TableHead className="w-[70px] text-center" title="Товарителница">
                <ExternalLink className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableHead>
              <TableHead className="w-[140px]">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  Статус
                </div>
              </TableHead>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  Коментар
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-center">
                <Settings2 className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className={getRowColorByStatus(order.status)}>
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => handleSelectOne(order.id, checked as boolean)}
                    aria-label={`Избери поръчка ${order.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium" title={`Поръчка номер ${order.id}`}>#{order.id}</TableCell>
                <TableCell title={`Източник: ${order.source === 'google' ? 'Google' : order.source === 'facebook' ? 'Facebook' : 'WooCommerce'}`}>
                  <SourceIcon source={order.source} className="w-5 h-5" />
                </TableCell>
                
                <TableCell className="text-xs text-muted-foreground" title={`Дата на поръчка: ${format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}`}>
                  <div className="flex flex-col">
                    <span>{format(new Date(order.created_at), 'dd.MM.yyyy')}</span>
                    <span className="text-[10px] opacity-70">{format(new Date(order.created_at), 'HH:mm')}</span>
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
                <TableCell className="text-sm font-medium" title={`Обща сума: €${order.total_price.toFixed(2)}`}>€{order.total_price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm line-clamp-2 max-w-[80px]" title={order.product_name}>
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
                            <span><strong>Цена:</strong> €{order.total_price.toFixed(2)}</span>
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
                            <Truck className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{order.delivery_address}</span>
                          </div>
                        }
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell title={order.courier_tracking_url ? `Проследяване на пратка` : 'Няма товарителница'}>
                  {order.courier_tracking_url ? (
                    <a 
                      href={order.courier_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
                      title="Отвори проследяване в нов таб"
                    >
                      <EcontLogo className="w-5 h-5" trackingUrl={order.courier_tracking_url} />
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
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
                      <span className="comment-bubble line-clamp-3 cursor-pointer">
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
                        Печат
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(order.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Изтрий
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
