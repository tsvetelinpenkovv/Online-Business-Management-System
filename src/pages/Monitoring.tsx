import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useFavicon } from '@/hooks/useFavicon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, AlertTriangle, BarChart3, Bell } from 'lucide-react';
import { buildPath } from '@/components/SecretPathGuard';
import { HealthTab } from '@/components/monitoring/HealthTab';
import { ErrorsTab } from '@/components/monitoring/ErrorsTab';
import { PerformanceTab } from '@/components/monitoring/PerformanceTab';
import { BusinessAlertsTab } from '@/components/monitoring/BusinessAlertsTab';

const Monitoring = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: permLoading } = usePermissions();
  useFavicon();

  useEffect(() => {
    if (!permLoading && !isAdmin) {
      navigate(buildPath('/'));
    }
  }, [isAdmin, permLoading, navigate]);

  if (!user || permLoading) return null;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/settings'))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Мониторинг
            </h1>
            <p className="text-xs text-muted-foreground">Системен статус, грешки и бизнес алерти</p>
          </div>
        </div>

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="health" className="text-xs gap-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Здраве</span>
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Грешки</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="text-xs gap-1">
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Бизнес</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health"><HealthTab /></TabsContent>
          <TabsContent value="errors"><ErrorsTab /></TabsContent>
          <TabsContent value="performance"><PerformanceTab /></TabsContent>
          <TabsContent value="business"><BusinessAlertsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Monitoring;
