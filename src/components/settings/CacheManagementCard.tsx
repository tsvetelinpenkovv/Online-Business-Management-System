import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Database, Globe, HardDrive, RefreshCw, Check, Loader2, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface CacheManagementCardProps {
  toast: (opts: { title: string; description: string; variant?: 'destructive' | 'default' }) => void;
}

type CacheAction = 'app' | 'query' | 'storage' | 'all';

export const CacheManagementCard = ({ toast }: CacheManagementCardProps) => {
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState<CacheAction | null>(null);
  const [completed, setCompleted] = useState<Set<CacheAction>>(new Set());

  const clearAppCache = async () => {
    // Clear browser caches (Cache API - used by service workers / CDN prefetch)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    // Unregister service workers if any
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
  };

  const clearQueryCache = () => {
    queryClient.clear();
    queryClient.invalidateQueries();
  };

  const clearStorageCache = () => {
    // Clear localStorage except critical auth/theme keys
    const keysToKeep = ['app-theme', 'sb-gpmwkgkvikvlzvqpbqus-auth-token'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.some(k => key.includes(k))) {
        localStorage.removeItem(key);
      }
    });
    // Clear sessionStorage
    sessionStorage.clear();
  };

  const handleClear = async (action: CacheAction) => {
    setClearing(action);
    try {
      if (action === 'all' || action === 'app') {
        await clearAppCache();
      }
      if (action === 'all' || action === 'query') {
        clearQueryCache();
      }
      if (action === 'all' || action === 'storage') {
        clearStorageCache();
      }

      setCompleted(prev => new Set(prev).add(action));
      setTimeout(() => setCompleted(prev => {
        const next = new Set(prev);
        next.delete(action);
        return next;
      }), 2000);

      const labels: Record<CacheAction, string> = {
        app: 'Браузър кеш',
        query: 'Кеш на заявките',
        storage: 'Локално хранилище',
        all: 'Целият кеш',
      };

      toast({
        title: '✓ Кешът е изчистен',
        description: `${labels[action]} беше изчистен успешно.${action === 'all' ? ' Страницата ще се презареди.' : ''}`,
      });

      if (action === 'all') {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно изчистване на кеша',
        variant: 'destructive',
      });
    } finally {
      setClearing(null);
    }
  };

  const actions: { key: CacheAction; icon: typeof Zap; label: string; description: string; color: string }[] = [
    {
      key: 'query',
      icon: Database,
      label: 'Кеш на заявките',
      description: 'React Query кеш — данни от базата',
      color: 'text-info',
    },
    {
      key: 'app',
      icon: Globe,
      label: 'Браузър кеш',
      description: 'Cache API, Service Workers, CDN кеш',
      color: 'text-success',
    },
    {
      key: 'storage',
      icon: HardDrive,
      label: 'Локално хранилище',
      description: 'localStorage, sessionStorage (без auth)',
      color: 'text-warning',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Кеш и оптимизация
        </CardTitle>
        <CardDescription>
          Изчистете различни видове кеш за да обновите данните в системата
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current cache info */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            React Query: 2 мин stale / 10 мин GC
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Lazy Loading: {8} страници
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Vite Content Hashes: ✓
          </Badge>
        </div>

        {/* Individual clear buttons */}
        <div className="grid gap-3">
          {actions.map(({ key, icon: Icon, label, description, color }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClear(key)}
                disabled={clearing !== null}
                className="shrink-0"
              >
                {clearing === key ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : completed.has(key) ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Изчисти</span>
              </Button>
            </div>
          ))}
        </div>

        {/* Clear ALL button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => handleClear('all')}
          disabled={clearing !== null}
        >
          {clearing === 'all' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : completed.has('all') ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Trash2 className="w-4 h-4 mr-2" />
          )}
          Изчисти целия кеш и презареди
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          За CDN кеш (Cloudflare / Hostinger) — изчистете от съответния панел.
          Вижте документацията в <span className="font-medium">docs/cdn-cloudflare.md</span> и <span className="font-medium">docs/cdn-hostinger.md</span>
        </p>
      </CardContent>
    </Card>
  );
};
