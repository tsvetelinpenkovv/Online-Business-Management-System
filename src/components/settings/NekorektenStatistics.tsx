import { FC, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';

interface NekorektenStats {
  correct: number;
  incorrect: number;
  unknown: number;
  total: number;
}

export const NekorektenStatistics: FC = () => {
  const [stats, setStats] = useState<NekorektenStats>({ correct: 0, incorrect: 0, unknown: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('is_correct');

        if (error) throw error;

        const statsData = {
          correct: orders?.filter(o => o.is_correct === true).length || 0,
          incorrect: orders?.filter(o => o.is_correct === false).length || 0,
          unknown: orders?.filter(o => o.is_correct === null).length || 0,
          total: orders?.length || 0,
        };

        setStats(statsData);
      } catch (error) {
        console.error('Error fetching nekorekten stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted rounded-lg">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Статистика за некоректни клиенти
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-success">{stats.correct}</div>
          <div className="text-xs text-muted-foreground">Коректни</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="flex items-center justify-center gap-1 mb-1">
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">{stats.incorrect}</div>
          <div className="text-xs text-muted-foreground">Некоректни</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="flex items-center justify-center gap-1 mb-1">
            <HelpCircle className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-warning">{stats.unknown}</div>
          <div className="text-xs text-muted-foreground">Неизвестни</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center border">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-muted-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Общо проверки</div>
        </div>
      </div>
    </div>
  );
};
