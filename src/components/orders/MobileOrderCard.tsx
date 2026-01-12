import { FC, useState, useEffect } from 'react';
import { 
  User, Phone, Euro, Package, Truck, MessageCircle, 
  MoreHorizontal, Pencil, Trash2, Printer, Calendar,
  Barcode, ExternalLink, Search, Globe, FileBox, Copy, Check, FileText, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderStatus } from '@/types/order';
import { SourceIcon } from '@/components/icons/SourceIcon';
import { CourierLogo } from './CourierLogo';
import { StatusBadge } from './StatusBadge';
import { PhoneWithFlag } from './PhoneWithFlag';
import { CorrectStatusIcon } from './CorrectStatusIcon';
import { MessageStatusIcon } from './MessageStatusIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface MobileOrderCardProps {
  order: Order;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onStatusChange?: (orderId: number, newStatus: string) => void;
  messageInfo?: {
    channel: 'viber' | 'sms';
    status: 'sent' | 'delivered' | 'read' | 'failed';
    sentAt?: string;
  } | null;
  nekorektenEnabled?: boolean;
}

export const MobileOrderCard: FC<MobileOrderCardProps> = ({
  order,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onPrint,
  onStatusChange,
  messageInfo,
  nekorektenEnabled = true,
}) => {
  const { toast } = useToast();
  const [copiedCatalog, setCopiedCatalog] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ hasInvoice: boolean; viewedAt: string | null }>({ hasInvoice: false, viewedAt: null });

  // Check if order has invoice
  useEffect(() => {
    const checkInvoice = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('id, created_at')
        .eq('order_id', order.id)
        .maybeSingle();
      
      if (data) {
        // Check localStorage to see if this invoice was viewed
        const viewedKey = `invoice_viewed_${data.id}`;
        const viewedAt = localStorage.getItem(viewedKey);
        setInvoiceData({ hasInvoice: true, viewedAt });
      }
    };
    checkInvoice();
  }, [order.id]);

  const handleCopyCatalog = () => {
    if (order.catalog_number) {
      navigator.clipboard.writeText(order.catalog_number);
      setCopiedCatalog(true);
      setTimeout(() => setCopiedCatalog(false), 2000);
      toast({
        title: 'Копирано',
        description: `Каталожен номер ${order.catalog_number} е копиран`,
      });
    }
  };
  const getCardBorderColor = (status: string) => {
    switch (status) {
      case 'Нова':
        return 'border-l-4 border-l-primary';
      case 'В обработка':
        return 'border-l-4 border-l-info';
      case 'Неуспешна връзка':
        return 'border-l-4 border-l-warning';
      case 'Потвърдена':
        return 'border-l-4 border-l-success';
      case 'Платена с карта':
        return 'border-l-4 border-l-purple';
      case 'На лизинг през TBI':
      case 'На лизинг през BNP':
      case 'На лизинг през UniCredit':
        return 'border-l-4 border-l-teal';
      case 'Изпратена':
        return 'border-l-4 border-l-warning';
      case 'Неуспешна доставка':
        return 'border-l-4 border-l-destructive';
      case 'Доставена':
        return 'border-l-4 border-l-success';
      case 'Завършена':
        return 'border-l-4 border-l-success';
      case 'Върната':
        return 'border-l-4 border-l-muted-foreground';
      case 'Отказана':
        return 'border-l-4 border-l-destructive';
      case 'Анулирана':
        return 'border-l-4 border-l-muted-foreground';
      default:
        return 'border-l-4 border-l-muted';
    }
  };

  return (
    <Card className={`${getCardBorderColor(order.status)} overflow-hidden`}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label={`Избери поръчка ${order.id}`}
            />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap inline-flex items-center gap-1 min-w-[70px]">№ {order.id}</span>
            {messageInfo && (
              <MessageStatusIcon 
                channel={messageInfo.channel} 
                status={messageInfo.status} 
                sentAt={messageInfo.sentAt}
              />
            )}
            {invoiceData.hasInvoice && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-success hover:bg-success/10 hover:text-success relative" 
                title={invoiceData.viewedAt ? "Фактурата е прегледана" : "Има издадена фактура (непрегледана)"}
              >
                <FileText className="w-4 h-4" />
                <span className={`absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[14px] h-[14px] rounded-full text-[9px] font-bold text-white ${
                  invoiceData.viewedAt ? 'bg-success' : 'bg-destructive'
                }`}>
                  {invoiceData.viewedAt ? '✓' : '!'}
                </span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SourceIcon source={order.source} className="w-5 h-5" />
            {nekorektenEnabled && <CorrectStatusIcon isCorrect={order.is_correct} />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Редактирай
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPrint}>
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
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Изтрий
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Date and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <div className="flex flex-col">
              <span>{format(new Date(order.created_at), 'dd.MM.yyyy')}</span>
              <span className="text-xs opacity-70">{format(new Date(order.created_at), 'HH:mm')}</span>
            </div>
          </div>
          <StatusBadge 
            status={order.status} 
            editable={!!onStatusChange}
            onStatusChange={(newStatus) => onStatusChange?.(order.id, newStatus)}
          />
        </div>

        {/* Customer info */}
        <div className="space-y-2 py-2 border-t border-b">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <PhoneWithFlag phone={order.phone} />
          </div>
          {order.customer_email && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{order.customer_email}</span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            <div className="flex-1">
              <span className="text-sm">{order.product_name}</span>
              {order.catalog_number && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground font-mono">{order.catalog_number}</span>
                  <button
                    onClick={handleCopyCatalog}
                    className="p-0.5 hover:bg-muted rounded transition-colors"
                    title="Копирай каталожен номер"
                  >
                    {copiedCatalog ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                    )}
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${order.quantity > 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-muted-foreground'} font-semibold`}>
                {order.quantity} бр.
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">{order.total_price.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        {order.delivery_address && (
          <div className="flex items-start gap-2 text-sm">
            <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{order.delivery_address}</span>
          </div>
        )}

        {/* Courier info */}
        {(order.courier_tracking_url || order.courier_id) && (
          <div className="flex items-center gap-2">
            <CourierLogo 
              trackingUrl={order.courier_tracking_url} 
              courierId={order.courier_id}
              className="w-5 h-5" 
              showLink={false} 
            />
            {order.courier_tracking_url && (
              <a 
                href={order.courier_tracking_url.startsWith('http') ? order.courier_tracking_url : `https://${order.courier_tracking_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
              >
                <Search className="w-3 h-3" />
                <span>Товарителница</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Comment */}
        {order.comment && (
          <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
            <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground">{order.comment}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
