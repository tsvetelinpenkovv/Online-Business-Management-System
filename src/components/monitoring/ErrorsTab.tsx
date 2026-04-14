import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSystemAlerts, useResolveAlert } from '@/hooks/useSystemHealth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Info, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

const typeConfig: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  error: { icon: XCircle, color: 'text-destructive', label: 'Грешка' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', label: 'Предупреждение' },
  info: { icon: Info, color: 'text-blue-500', label: 'Информация' },
};

export const ErrorsTab: FC = () => {
  const { data: alerts, isLoading } = useSystemAlerts();
  const resolveAlert = useResolveAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      queryClient.invalidateQueries({ queryKey: ['system_alerts'] });
      toast({ title: 'Алертът е маркиран като решен' });
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const active = alerts?.filter(a => !a.is_resolved) || [];
  const resolved = alerts?.filter(a => a.is_resolved) || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Активни алерти ({active.length})</h3>

      {active.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            Няма активни алерти — системата работи нормално
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {active.map(alert => {
            const cfg = typeConfig[alert.alert_type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <Card key={alert.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{alert.title}</span>
                          <Badge variant="outline" className="text-[10px]">{alert.source}</Badge>
                        </div>
                        {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm', { locale: bg })}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => handleResolve(alert.id)}>
                      Реши
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-6">Решени ({resolved.length})</h3>
          <div className="space-y-2 opacity-60">
            {resolved.slice(0, 20).map(alert => {
              const cfg = typeConfig[alert.alert_type] || typeConfig.info;
              const Icon = cfg.icon;
              return (
                <Card key={alert.id}>
                  <CardContent className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className="text-xs">{alert.title}</span>
                      <Badge variant="secondary" className="text-[10px] ml-auto">Решен</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
