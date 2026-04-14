import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBusinessMetrics } from '@/hooks/useSystemHealth';
import { Loader2, ShoppingCart, AlertTriangle, PackageX, Webhook, Clock } from 'lucide-react';

export const BusinessAlertsTab: FC = () => {
  const { data: metrics, isLoading } = useBusinessMetrics();

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const alerts = [
    {
      icon: ShoppingCart,
      label: 'Нови поръчки днес',
      value: metrics?.newOrdersToday || 0,
      severity: (metrics?.newOrdersToday || 0) > 0 ? 'info' : 'neutral',
    },
    {
      icon: Clock,
      label: 'Чакащи поръчки',
      value: metrics?.pendingOrders || 0,
      severity: (metrics?.pendingOrders || 0) > 10 ? 'warning' : (metrics?.pendingOrders || 0) > 0 ? 'info' : 'neutral',
    },
    {
      icon: AlertTriangle,
      label: 'Продукти с нисък сток',
      value: metrics?.lowStockProducts || 0,
      severity: (metrics?.lowStockProducts || 0) > 5 ? 'error' : (metrics?.lowStockProducts || 0) > 0 ? 'warning' : 'neutral',
    },
    {
      icon: PackageX,
      label: 'Продукти без наличност',
      value: metrics?.outOfStockProducts || 0,
      severity: (metrics?.outOfStockProducts || 0) > 0 ? 'error' : 'neutral',
    },
    {
      icon: Webhook,
      label: 'Неуспешни webhooks',
      value: metrics?.failedWebhooks || 0,
      severity: (metrics?.failedWebhooks || 0) > 0 ? 'error' : 'neutral',
    },
  ];

  const severityColors: Record<string, string> = {
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    neutral: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Бизнес алерти</h3>
      <p className="text-xs text-muted-foreground">Автоматично обновяване на всяка минута</p>

      <div className="space-y-2">
        {alerts.map(alert => (
          <Card key={alert.label}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <alert.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{alert.label}</span>
              </div>
              <Badge className={severityColors[alert.severity]}>
                {alert.value}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
