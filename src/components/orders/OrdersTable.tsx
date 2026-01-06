import { FC, useState } from 'react';
import { 
  Hash, Tag, Calendar, User, UserCheck, Phone, Euro, Package, 
  Barcode, Layers, Truck, MessageCircle, MoreHorizontal, 
  Pencil, Trash2, Printer, Globe, Search, ExternalLink
} from 'lucide-react';
import { Order, ORDER_STATUSES } from '@/types/order';
import { SourceIcon } from '@/components/icons/SourceIcon';
import { EcontLogo } from '@/components/icons/EcontLogo';
import { StatusBadge } from './StatusBadge';
import { PhoneWithFlag } from './PhoneWithFlag';
import { InfoPopover } from './InfoPopover';
import { CorrectStatusIcon } from './CorrectStatusIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { bg } from 'date-fns/locale';
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

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
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
              <TableHead className="w-[50px]">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="w-[90px]">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  Код
                </div>
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
              <TableHead className="w-[50px]">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="w-[130px]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Телефон
                </div>
              </TableHead>
              <TableHead className="w-[70px]">
                <div className="flex items-center gap-1.5">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  Цена
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  Продукт
                </div>
              </TableHead>
              <TableHead className="w-[80px]">
                <div className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-muted-foreground" />
                  Кат.№
                </div>
              </TableHead>
              <TableHead className="w-[40px]">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="w-[80px]">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Доставка
                </div>
              </TableHead>
              <TableHead className="w-[60px]">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Куриер
                </div>
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
              <TableHead className="w-[60px] text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/30">
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => handleSelectOne(order.id, checked as boolean)}
                    aria-label={`Избери поръчка ${order.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>
                  <SourceIcon source={order.source} className="w-5 h-5" />
                </TableCell>
                <TableCell className="font-mono text-xs">{order.code}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), 'dd.MM.yyyy')}
                </TableCell>
                <TableCell className="font-medium text-sm">{order.customer_name}</TableCell>
                <TableCell>
                  <CorrectStatusIcon isCorrect={order.is_correct} />
                </TableCell>
                <TableCell className="text-sm">
                  <PhoneWithFlag phone={order.phone} />
                </TableCell>
                <TableCell className="font-semibold text-sm">€{order.total_price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm line-clamp-2 max-w-[80px]" title={order.product_name}>
                      {order.product_name}
                    </span>
                    <InfoPopover 
                      title="Детайли на продукта" 
                      icon="eye"
                      content={
                        <div className="space-y-1">
                          <p><strong>Продукт:</strong> {order.product_name}</p>
                          <p><strong>Кат. номер:</strong> {order.catalog_number || '-'}</p>
                          <p className="flex items-center gap-2">
                            <strong>Количество:</strong> 
                            {order.quantity > 1 ? (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
                                {order.quantity} бр.
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                                {order.quantity} бр.
                              </span>
                            )}
                          </p>
                          <p><strong>Цена:</strong> €{order.total_price.toFixed(2)}</p>
                        </div>
                      }
                    />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {order.catalog_number || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {order.quantity > 1 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
                      {order.quantity}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs">
                      {order.quantity}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground truncate max-w-[50px]">
                      {order.delivery_address ? (order.delivery_address.length > 10 ? order.delivery_address.substring(0, 10) + '...' : order.delivery_address) : '-'}
                    </span>
                    {order.delivery_address && (
                      <InfoPopover 
                        title="Адрес за доставка" 
                        icon="eye"
                        content={order.delivery_address}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-1">
                    <EcontLogo className="w-6 h-6" trackingUrl={order.courier_tracking_url} />
                    {order.courier_tracking_url && (
                      <a 
                        href={order.courier_tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        <Search className="w-3 h-3" />
                        <span>{order.courier_tracking_url.match(/\d{10}/)?.[0] || 'Товарителница'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {order.comment ? (
                    <span className="comment-bubble">
                      {order.comment}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditOrder(order)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Редактирай
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
    </>
  );
};
