import { FC, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHealthCheck } from '@/hooks/useSystemHealth';
import { RefreshCw, Database, HardDrive, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

const StatusIcon: FC<{ status: string }> = ({ status }) => {
  if (status === 'checking') return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  if (status === 'ok') return <CheckCircle className="w-5 h-5 text-green-500" />;
  return <XCircle className="w-5 h-5 text-destructive" />;
};

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  if (status === 'checking') return <Badge variant="secondary">Проверка...</Badge>;
  if (status === 'ok') return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Работи</Badge>;
  return <Badge variant="destructive">Грешка</Badge>;
};

export const HealthTab: FC = () => {
  const { health, checking, runHealthCheck } = useHealthCheck();

  useEffect(() => { runHealthCheck(); }, [runHealthCheck]);

  const services = [
    { key: 'database' as const, label: 'База данни', icon: Database, desc: 'PostgreSQL връзка и заявки' },
    { key: 'storage' as const, label: 'Файлово хранилище', icon: HardDrive, desc: 'Storage buckets (logos, media)' },
    { key: 'edgeFunctions' as const, label: 'Backend функции', icon: Zap, desc: 'Edge Functions runtime' },
  ];

  const allOk = services.every(s => health[s.key] === 'ok');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Здраве на системата</h3>
          {health.lastChecked && (
            <p className="text-xs text-muted-foreground">
              Последна проверка: {format(new Date(health.lastChecked), 'dd MMM yyyy, HH:mm:ss', { locale: bg })}
            </p>
          )}
        </div>
        <Button onClick={runHealthCheck} disabled={checking} size="sm" variant="outline" className="gap-1">
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Провери
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {allOk ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
            Обща оценка: {allOk ? 'Всички системи работят нормално' : 'Открити проблеми'}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-3">
        {services.map(svc => (
          <Card key={svc.key}>
            <CardContent className="flex items-center justify-between py-4 px-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={health[svc.key]} />
                <div>
                  <div className="flex items-center gap-2">
                    <svc.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{svc.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{svc.desc}</p>
                </div>
              </div>
              <StatusBadge status={health[svc.key]} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
