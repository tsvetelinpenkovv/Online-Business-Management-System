import { FC } from 'react';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { Clock, ArrowRight, User, Truck, CreditCard, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderTimelineProps {
  orderId: number;
}

const ACTION_ICONS: Record<string, typeof Clock> = {
  status_change: ArrowRight,
  payment_change: CreditCard,
  courier_change: Truck,
  address_change: MapPin,
  comment_change: MessageCircle,
};

const ACTION_LABELS: Record<string, string> = {
  status_change: 'Промяна на статус',
  payment_change: 'Промяна на плащане',
  courier_change: 'Промяна на курьер',
  address_change: 'Промяна на адрес',
  comment_change: 'Промяна на коментар',
};

export const OrderTimeline: FC<OrderTimelineProps> = ({ orderId }) => {
  const { history, loading } = useOrderHistory(orderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Няма записана история за тази поръчка
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="relative pl-6 space-y-4">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

        {history.map((entry) => {
          const Icon = ACTION_ICONS[entry.action] || Clock;
          const label = ACTION_LABELS[entry.action] || entry.action;

          return (
            <div key={entry.id} className="relative flex gap-3">
              {/* Timeline dot */}
              <div className="absolute -left-6 top-1 w-[22px] h-[22px] rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <Icon className="w-3 h-3 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm', { locale: bg })}
                  </span>
                </div>

                {entry.old_value && entry.new_value && (
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive line-through">
                      {entry.old_value}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">
                      {entry.new_value}
                    </span>
                  </div>
                )}

                {entry.user_email && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    {entry.user_email}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
