import { Bell, Package, AlertTriangle, CreditCard, Truck, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '@/components/SecretPathGuard';
import { formatDistanceToNow } from 'date-fns';
import { bg } from 'date-fns/locale';

const iconMap = {
  low_stock: AlertTriangle,
  new_order: Package,
  failed_delivery: Truck,
  overdue_payment: CreditCard,
};

const colorMap = {
  low_stock: 'text-warning',
  new_order: 'text-primary',
  failed_delivery: 'text-destructive',
  overdue_payment: 'text-destructive',
};

const NotificationItem = ({ notification, onRead }: { notification: AppNotification; onRead: () => void }) => {
  const navigate = useNavigate();
  const Icon = iconMap[notification.type];

  const handleClick = () => {
    onRead();
    if (notification.link) navigate(buildPath(notification.link));
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex gap-2.5">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorMap[notification.type]}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: bg })}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </div>
    </button>
  );
};

export const NotificationCenter = ({ className }: { className?: string }) => {
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className={`relative ${className || ''}`}>
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Известия</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                <Check className="w-3 h-3 mr-1" />Прочети
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={clearAll}>
                <Trash2 className="w-3 h-3 mr-1" />Изчисти
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Няма известия
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onRead={() => markAsRead(n.id)} />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
