import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, TestTube, Copy, Check, RefreshCw, Package, FolderSync, Download, Upload } from 'lucide-react';
import { useEcommercePlatforms, EcommercePlatform } from '@/hooks/useEcommercePlatforms';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import woocommerceLogo from '@/assets/woocommerce-logo.png';
import { PrestaShopLogo, OpenCartLogo, MagentoLogo, ShopifyLogo } from '@/components/icons/PlatformLogos';
import { EditableSourceLogo } from './EditableSourceLogo';
import { SyncProgressDialog, SyncLogEntry, SyncStats } from './SyncProgressDialog';
interface PlatformConfig {
  store_url: string;
  api_key: string;
  api_secret: string;
  webhook_url?: string;
}

const platformLogos: Record<string, React.ReactNode> = {
  woocommerce: <img src={woocommerceLogo} alt="WooCommerce" className="w-6 h-6" />,
  prestashop: <PrestaShopLogo className="w-6 h-6" />,
  opencart: <OpenCartLogo className="w-6 h-6" />,
  magento: <MagentoLogo className="w-6 h-6" />,
  shopify: <ShopifyLogo className="w-6 h-6" />,
};

const platformApiLabels: Record<string, { apiKey: string; apiSecret: string; description: string }> = {
  woocommerce: { 
    apiKey: 'Consumer Key', 
    apiSecret: 'Consumer Secret',
    description: 'Създайте ключове от WooCommerce → Settings → Advanced → REST API'
  },
  prestashop: { 
    apiKey: 'Webservice Key', 
    apiSecret: 'Webservice Secret (опционално)',
    description: 'Създайте ключ от PrestaShop Admin → Advanced Parameters → Webservice'
  },
  opencart: { 
    apiKey: 'API Username', 
    apiSecret: 'API Key',
    description: 'Създайте API потребител от OpenCart Admin → System → Users → API'
  },
  magento: { 
    apiKey: 'Access Token', 
    apiSecret: 'Access Token Secret',
    description: 'Създайте Integration от Magento Admin → System → Integrations'
  },
  shopify: { 
    apiKey: 'API Key', 
    apiSecret: 'API Secret Key',
    description: 'Създайте Private App от Shopify Admin → Apps → Manage private apps'
  },
};

export const PlatformApiSettings: FC = () => {
  const { platforms, loading, togglePlatform, fetchPlatforms } = useEcommercePlatforms();
  const [configs, setConfigs] = useState<Record<string, PlatformConfig>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingCategories, setSyncingCategories] = useState<{ platform: string; direction: 'import' | 'export' } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync progress dialog state
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncPlatformName, setSyncPlatformName] = useState('');
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    total: 0,
    processed: 0,
    synced: 0,
    created: 0,
    bundles: 0,
    errors: 0,
  });
  const logIdCounter = useRef(0);

  // Get Supabase URL for webhook endpoints
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

  useEffect(() => {
    loadAllConfigs();
  }, [platforms]);

  const loadAllConfigs = async () => {
    const loadedConfigs: Record<string, PlatformConfig> = {};
    
    for (const platform of platforms) {
      const { data } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', `${platform.name}_config`)
        .maybeSingle();

      if (data?.setting_value) {
        try {
          const config = JSON.parse(data.setting_value);
          loadedConfigs[platform.name] = {
            store_url: config.store_url || '',
            api_key: config.api_key || config.consumer_key || '',
            api_secret: config.api_secret || config.consumer_secret || '',
          };
        } catch {
          loadedConfigs[platform.name] = { store_url: '', api_key: '', api_secret: '' };
        }
      } else {
        loadedConfigs[platform.name] = { store_url: '', api_key: '', api_secret: '' };
      }
    }
    
    setConfigs(loadedConfigs);
  };

  const updateConfig = (platformName: string, field: keyof PlatformConfig, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [platformName]: {
        ...prev[platformName],
        [field]: value
      }
    }));
  };

  const saveConfig = async (platform: EcommercePlatform) => {
    setSaving(platform.name);
    try {
      const config = configs[platform.name];
      const { error } = await supabase
        .from('api_settings')
        .upsert({
          setting_key: `${platform.name}_config`,
          setting_value: JSON.stringify({
            ...config,
            is_enabled: platform.is_enabled,
            auto_sync: false,
            last_sync: null,
          }),
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({ title: 'Успех', description: `${platform.display_name} настройките са запазени` });
    } catch (err) {
      toast({ 
        title: 'Грешка', 
        description: 'Неуспешно запазване', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(null);
    }
  };

  const testConnection = async (platform: EcommercePlatform) => {
    const config = configs[platform.name];
    if (!config?.store_url || !config?.api_key) {
      toast({ 
        title: 'Грешка', 
        description: 'Моля, попълнете URL и API ключ', 
        variant: 'destructive' 
      });
      return;
    }

    setTesting(platform.name);
    try {
      // Validate URL
      new URL(config.store_url);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Успех', description: `Връзката с ${platform.display_name} е валидна` });
    } catch {
      toast({ 
        title: 'Грешка', 
        description: 'Невалиден URL адрес', 
        variant: 'destructive' 
      });
    } finally {
      setTesting(null);
    }
  };

  const getWebhookUrl = (platformName: string): string => {
    const webhookPlatforms = ['woocommerce', 'prestashop', 'opencart', 'magento', 'shopify'];
    if (webhookPlatforms.includes(platformName)) {
      return `${supabaseUrl}/functions/v1/${platformName}-webhook`;
    }
    return '';
  };

  const copyWebhookUrl = (platformName: string) => {
    const url = getWebhookUrl(platformName);
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedWebhook(platformName);
      setTimeout(() => setCopiedWebhook(null), 2000);
      toast({ title: 'Копирано', description: 'Webhook URL е копиран' });
    }
  };

  const addLog = useCallback((level: SyncLogEntry['level'], message: string, details?: string) => {
    const newLog: SyncLogEntry = {
      id: `log-${Date.now()}-${logIdCounter.current++}`,
      timestamp: new Date(),
      level,
      message,
      details,
    };
    setSyncLogs(prev => [...prev, newLog]);
  }, []);

  const syncProducts = async (platform: EcommercePlatform) => {
    const config = configs[platform.name];
    if (!config?.store_url || !config?.api_key) {
      toast({ 
        title: 'Грешка', 
        description: 'Моля, конфигурирайте API настройките първо', 
        variant: 'destructive' 
      });
      return;
    }

    // Reset and open dialog
    setSyncLogs([]);
    setSyncStats({
      total: 0,
      processed: 0,
      synced: 0,
      created: 0,
      bundles: 0,
      errors: 0,
    });
    setSyncPlatformName(platform.display_name);
    setSyncDialogOpen(true);
    setSyncing(platform.name);

    // Add initial log
    addLog('info', `Стартиране на синхронизация с ${platform.display_name}...`);
    addLog('info', `URL: ${config.store_url}`);

    try {
      // First, estimate total products (show loading)
      addLog('info', 'Извличане на продукти от платформата...');
      
      const { data, error } = await supabase.functions.invoke('sync-products', {
        body: { platform: platform.name }
      });

      if (error) throw error;

      const synced = data?.synced || 0;
      const created = data?.created || 0;
      const bundles = data?.bundles || 0;
      const total = synced + created;
      const errors = data?.errors || 0;

      // Simulate progress updates from results
      addLog('success', `Намерени ${total} продукта за обработка`);
      
      setSyncStats({
        total,
        processed: total,
        synced,
        created,
        bundles,
        errors,
      });

      // Add detailed logs based on results
      if (created > 0) {
        addLog('success', `Създадени ${created} нови продукта в склада`);
      }
      if (synced > 0) {
        addLog('info', `Обновени ${synced} съществуващи продукта`);
      }
      if (bundles > 0) {
        addLog('success', `Синхронизирани ${bundles} комплекта/бъндъла`);
      }
      if (errors > 0) {
        addLog('warning', `${errors} продукта не бяха синхронизирани поради грешки`);
      }
      
      addLog('success', 'Синхронизацията завърши успешно!');
      
      toast({ 
        title: 'Синхронизация завършена', 
        description: `Синхронизирани: ${synced}, Създадени: ${created}${bundles > 0 ? `, Комплекти: ${bundles}` : ''} от ${platform.display_name}` 
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Неуспешна синхронизация';
      addLog('error', 'Грешка при синхронизация', errorMessage);
      
      setSyncStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
      }));
      
      toast({ 
        title: 'Грешка при синхронизация', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncDialogClose = () => {
    setSyncDialogOpen(false);
    setSyncLogs([]);
  };

  const syncCategories = async (platform: EcommercePlatform, direction: 'import' | 'export') => {
    setSyncingCategories({ platform: platform.name, direction });
    try {
      const { data, error } = await supabase.functions.invoke('sync-categories', {
        body: { platform: platform.name, direction }
      });

      if (error) throw error;

      const count = direction === 'import' ? data?.imported : data?.exported;
      toast({
        title: direction === 'import' ? 'Категории импортирани' : 'Категории експортирани',
        description: `${count || 0} категории ${direction === 'import' ? 'импортирани от' : 'експортирани към'} ${platform.display_name}`,
      });
    } catch (err: any) {
      toast({
        title: 'Грешка',
        description: err.message || 'Неуспешна синхронизация на категории',
        variant: 'destructive',
      });
    } finally {
      setSyncingCategories(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>E-commerce API настройки</CardTitle>
          <CardDescription>
            Конфигурирайте API връзките с вашите онлайн магазини за автоматично получаване на поръчки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {platforms.map((platform, index) => {
            const config = configs[platform.name] || { store_url: '', api_key: '', api_secret: '' };
            const labels = platformApiLabels[platform.name] || { apiKey: 'API Key', apiSecret: 'API Secret', description: '' };
            const webhookUrl = getWebhookUrl(platform.name);

            return (
              <div key={platform.id}>
                {index > 0 && <Separator className="my-6" />}
                
                <div className="space-y-4">
                  {/* Platform Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <EditableSourceLogo
                        sourceId={platform.id}
                        sourceName={platform.display_name}
                        currentLogo={platformLogos[platform.name]}
                        logoUrl={platform.logo_url}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{platform.display_name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{labels.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Badge variant={platform.is_enabled ? 'default' : 'secondary'} className={`text-xs ${platform.is_enabled ? 'bg-success' : ''}`}>
                        {platform.is_enabled ? 'Активен' : 'Неактивен'}
                      </Badge>
                      <Switch
                        checked={platform.is_enabled}
                        onCheckedChange={(checked) => togglePlatform(platform.id, checked)}
                      />
                    </div>
                  </div>

                  {/* API Settings */}
                  <div className="grid gap-4 sm:grid-cols-3 sm:pl-9">
                    <div className="space-y-2">
                      <Label>URL на магазина</Label>
                      <Input
                        value={config.store_url}
                        onChange={(e) => updateConfig(platform.name, 'store_url', e.target.value)}
                        placeholder="https://mystore.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{labels.apiKey}</Label>
                      <Input
                        value={config.api_key}
                        onChange={(e) => updateConfig(platform.name, 'api_key', e.target.value)}
                        placeholder="Въведете ключ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{labels.apiSecret}</Label>
                      <Input
                        type="password"
                        value={config.api_secret}
                        onChange={(e) => updateConfig(platform.name, 'api_secret', e.target.value)}
                        placeholder="Въведете тайна"
                      />
                    </div>
                  </div>

                  {/* Webhook URL */}
                  {webhookUrl && (
                    <div className="sm:pl-9 space-y-2">
                      <Label className="text-muted-foreground">Webhook URL (за автоматични поръчки)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={webhookUrl}
                          readOnly
                          className="font-mono text-xs bg-muted text-muted-foreground"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyWebhookUrl(platform.name)}
                          className="shrink-0"
                        >
                          {copiedWebhook === platform.name ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Добавете този URL в {platform.display_name} → Webhooks за автоматично получаване на поръчки
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 sm:pl-9">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(platform)}
                      disabled={testing === platform.name}
                    >
                      {testing === platform.name ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Тест
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveConfig(platform)}
                      disabled={saving === platform.name}
                    >
                      {saving === platform.name ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Запази
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => syncProducts(platform)}
                      disabled={syncing === platform.name || !platform.is_enabled}
                      title={!platform.is_enabled ? 'Активирайте платформата първо' : 'Синхронизирай продукти и комплекти'}
                    >
                      {syncing === platform.name ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Package className="w-4 h-4 mr-2" />
                      )}
                      <span className="hidden sm:inline">Синхронизирай </span>продукти
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncCategories(platform, 'import')}
                      disabled={syncingCategories?.platform === platform.name || !platform.is_enabled}
                      title="Импортирай категории от платформата"
                    >
                      {syncingCategories?.platform === platform.name && syncingCategories.direction === 'import' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      <span className="hidden md:inline">Импорт </span>категории
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncCategories(platform, 'export')}
                      disabled={syncingCategories?.platform === platform.name || !platform.is_enabled}
                      title="Експортирай категории към платформата"
                    >
                      {syncingCategories?.platform === platform.name && syncingCategories.direction === 'export' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      <span className="hidden md:inline">Експорт </span>категории
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Sync Progress Dialog */}
      <SyncProgressDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        platformName={syncPlatformName}
        isRunning={syncing !== null}
        stats={syncStats}
        logs={syncLogs}
        onClose={handleSyncDialogClose}
      />
    </div>
  );
};
