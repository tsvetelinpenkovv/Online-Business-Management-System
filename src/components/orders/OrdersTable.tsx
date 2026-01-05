import { FC, useState } from 'react';
import { 
  Hash, Tag, Calendar, User, UserCheck, Phone, Euro, Package, 
  Barcode, Layers, Truck, MessageCircle, MoreHorizontal, 
  Pencil, Trash2, Printer, Globe 
} from 'lucide-react';
import { Order } from '@/types/order';
import { SourceIcon } from '@/components/icons/SourceIcon';
import { EcontLogo } from '@/components/icons/EcontLogo';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
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
import { CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { EditOrderDialog } from './EditOrderDialog';

interface OrdersTableProps {
  orders: Order[];
  onDelete: (id: number) => void;
  onUpdate: (order: Order) => void;
}

export const OrdersTable: FC<OrdersTableProps> = ({ orders, onDelete, onUpdate }) => {
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

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[60px]">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  ID
                </div>
              </TableHead>
              <TableHead className="w-[60px]">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Източник
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  Код
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Дата
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Клиент
                </div>
              </TableHead>
              <TableHead className="w-[80px]">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  Коректен
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Телефон
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  Цена
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  Продукт
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-muted-foreground" />
                  Кат. номер
                </div>
              </TableHead>
              <TableHead className="w-[60px]">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  Кол.
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Доставка
                </div>
              </TableHead>
              <TableHead className="w-[70px] text-center">Куриер</TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  Статус
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  Коментар
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>
                  <SourceIcon source={order.source} className="w-5 h-5" />
                </TableCell>
                <TableCell className="font-mono text-sm">{order.code}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), 'dd MMM yyyy', { locale: bg })}
                </TableCell>
                <TableCell className="font-medium">{order.customer_name}</TableCell>
                <TableCell className="text-center">
                  {order.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-sm">{order.phone}</TableCell>
                <TableCell className="font-semibold">€{order.total_price.toFixed(2)}</TableCell>
                <TableCell className="max-w-[150px] truncate" title={order.product_name}>
                  {order.product_name}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {order.catalog_number || '-'}
                </TableCell>
                <TableCell className="text-center">{order.quantity}</TableCell>
                <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground" title={order.delivery_address || ''}>
                  {order.delivery_address || '-'}
                </TableCell>
                <TableCell className="text-center">
                  <EcontLogo className="w-7 h-7 mx-auto" trackingUrl={order.courier_tracking_url} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {order.comment ? (
                    <span className="comment-bubble" title={order.comment}>
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
