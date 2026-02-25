import { FC } from 'react';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { AlertTriangle, Package, CheckCircle2, Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const StockAlertsButton: FC = () => {
  const { alerts, unreadCount, loading, markAsRead, markAllAsRead } = useStockAlerts();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {unreadCount > 0 ? (
            <Bell className="w-4 h-4 text-warning" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Известия за наличности
          </h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
              Маркирай всички
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mb-2 text-success" />
            <p className="text-sm">Няма активни известия</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${!alert.is_read ? 'bg-warning/5' : ''}`}
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                >
                  <div className="flex items-start gap-2">
                    <Package className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      alert.alert_type === 'out_of_stock' ? 'text-destructive' : 'text-warning'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{alert.product_name}</span>
                        {!alert.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={alert.alert_type === 'out_of_stock' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                          {alert.alert_type === 'out_of_stock' ? 'Изчерпан' : 'Ниска наличност'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.current_stock} / {alert.threshold} мин.
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.product_sku} • {format(new Date(alert.created_at), 'dd MMM HH:mm', { locale: bg })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
