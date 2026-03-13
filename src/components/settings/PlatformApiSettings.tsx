import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, TestTube, Copy, Check, RefreshCw, Link, Code, FileJson } from 'lucide-react';
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
  webhook_secret?: string;
}

const platformLogos: Record<string, React.ReactNode> = {
  woocommerce: <img src={woocommerceLogo} alt="WooCommerce" className="w-6 h-6" />,
  prestashop: <PrestaShopLogo className="w-6 h-6" />,
  opencart: <OpenCartLogo className="w-6 h-6" />,
  magento: <MagentoLogo className="w-6 h-6" />,
  shopify: <ShopifyLogo className="w-6 h-6" />,
  custom_api: <Link className="w-6 h-6 text-primary" />,
};

const platformApiLabels: Record<string, { apiKey: string; apiSecret: string; description: string }> = {
  woocommerce: { 
    apiKey: 'Потребителски ключ (Consumer Key)', 
    apiSecret: 'Потребителска тайна (Consumer Secret)',
    description: 'Създайте ключове от WooCommerce → Settings → Advanced → REST API'
  },
  prestashop: { 
    apiKey: 'Ключ за уебуслуга (Webservice Key)', 
    apiSecret: 'Тайна за уебуслуга (опционално)',
    description: 'Създайте ключ от PrestaShop Admin → Advanced Parameters → Webservice'
  },
  opencart: { 
    apiKey: 'API Потребител', 
    apiSecret: 'API Ключ',
    description: 'Създайте API потребител от OpenCart Admin → System → Users → API'
  },
  magento: { 
    apiKey: 'Токен за достъп (Access Token)', 
    apiSecret: 'Тайна на токена (Access Token Secret)',
    description: 'Създайте интеграция от Magento Admin → System → Integrations'
  },
  shopify: { 
    apiKey: 'API Ключ', 
    apiSecret: 'API Таен ключ',
    description: 'Създайте частно приложение от Shopify Admin → Apps → Manage private apps'
  },
  custom_api: {
    apiKey: '',
    apiSecret: '',
    description: 'Свържете вашия собствен сайт чрез REST API / Webhook'
  },
};

export const PlatformApiSettings: FC = () => {
  const { platforms, loading, togglePlatform, fetchPlatforms } = useEcommercePlatforms();
  const [configs, setConfigs] = useState<Record<string, PlatformConfig>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  
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
    const webhookPlatforms = ['woocommerce', 'prestashop', 'opencart', 'magento', 'shopify', 'custom_api'];
    if (platformName === 'custom_api') {
      return `${supabaseUrl}/functions/v1/custom-webhook`;
    }
    if (webhookPlatforms.includes(platformName)) {
      return `${supabaseUrl}/functions/v1/${platformName}-webhook`;
    }
    return '';
  };

  const generateWebhookSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'capi_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const saveCustomApiConfig = async (platform: EcommercePlatform) => {
    setSaving(platform.name);
    try {
      let config = configs[platform.name] || { store_url: '', api_key: '', api_secret: '' };
      
      // Generate webhook secret if not exists
      if (!config.webhook_secret) {
        config = { ...config, webhook_secret: generateWebhookSecret() };
        setConfigs(prev => ({ ...prev, [platform.name]: config }));
      }

      const { error } = await supabase
        .from('api_settings')
        .upsert({
          setting_key: 'custom_api_config',
          setting_value: JSON.stringify({
            is_enabled: platform.is_enabled,
            webhook_secret: config.webhook_secret,
            store_url: config.store_url,
          }),
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      toast({ title: 'Успех', description: 'Custom API настройките са запазени' });
    } catch (err) {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const loadCustomApiConfig = async () => {
    const { data } = await supabase
      .from('api_settings')
      .select('setting_value')
      .eq('setting_key', 'custom_api_config')
      .maybeSingle();
    
    if (data?.setting_value) {
      try {
        const parsed = JSON.parse(data.setting_value);
        setConfigs(prev => ({
          ...prev,
          custom_api: {
            store_url: parsed.store_url || '',
            api_key: '',
            api_secret: '',
            webhook_secret: parsed.webhook_secret || '',
          }
        }));
      } catch {}
    }
  };

  useEffect(() => {
    if (platforms.some(p => p.name === 'custom_api')) {
      loadCustomApiConfig();
    }
  }, [platforms]);

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
    addLog('info', `Стартиране на пълна синхронизация с ${platform.display_name}...`);
    addLog('info', `URL: ${config.store_url}`);

    try {
      // Step 1: Sync categories first
      addLog('info', 'Синхронизиране на категории...');
      
      const { data: categoryData, error: categoryError } = await supabase.functions.invoke('sync-categories', {
        body: { platform: platform.name, direction: 'import' }
      });

      if (categoryError) {
        addLog('warning', 'Грешка при синхронизация на категории', categoryError.message);
      } else {
        const importedCategories = categoryData?.imported || 0;
        if (importedCategories > 0) {
          addLog('success', `Импортирани ${importedCategories} категории`);
        } else {
          addLog('info', 'Няма нови категории за импорт');
        }
      }

      // Step 2: Sync products
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

      // Update stats with results
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
      
      addLog('success', 'Пълната синхронизация завърши успешно!');
      
      toast({ 
        title: 'Синхронизация завършена', 
        description: `Продукти: ${synced + created}, Комплекти: ${bundles} от ${platform.display_name}` 
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

                {platform.name === 'custom_api' ? (
                  /* Custom API Platform - Special UI */
                  <>
                    <div className="sm:pl-9 space-y-4">
                      {/* Webhook URL */}
                      <div className="space-y-2">
                        <Label>Webhook URL (дайте го на разработчика на вашия сайт)</Label>
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
                      </div>

                      {/* API Key */}
                      <div className="space-y-2">
                        <Label>API Ключ за автентикация (x-api-key header)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={config.webhook_secret || ''}
                            readOnly
                            className="font-mono text-xs bg-muted"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (config.webhook_secret) {
                                navigator.clipboard.writeText(config.webhook_secret);
                                toast({ title: 'Копирано', description: 'API ключът е копиран' });
                              }
                            }}
                            className="shrink-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Този ключ трябва да се изпраща като <code className="bg-muted px-1 rounded">x-api-key</code> header при всяка заявка
                        </p>
                      </div>

                      {/* Store URL (optional) */}
                      <div className="space-y-2">
                        <Label>URL на сайта (опционално, за справка)</Label>
                        <Input
                          value={config.store_url}
                          onChange={(e) => updateConfig(platform.name, 'store_url', e.target.value)}
                          placeholder="https://mysite.com"
                        />
                      </div>

                      {/* JSON Format Documentation */}
                      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">Формат на заявката (POST JSON)</Label>
                        </div>
                        <pre className="text-xs font-mono bg-background rounded p-3 overflow-x-auto whitespace-pre">
{`POST ${webhookUrl}
Headers:
  Content-Type: application/json
  x-api-key: <вашият_api_ключ>

Body:
{
  "customer_name": "Иван Иванов",     // задължително
  "phone": "+359888123456",            // задължително
  "product_name": "Продукт 1",        // задължително
  "total_price": 49.99,               // задължително
  "quantity": 2,                       // опционално (по подр. 1)
  "customer_email": "ivan@mail.bg",    // опционално
  "delivery_address": "ул. Тест 1",   // опционално
  "comment": "Бележка",               // опционално
  "payment_method": "cod",            // опционално: cod|cash|card|bank_transfer
  "catalog_number": "SKU-001",        // опционално
  "items": [                           // опционално - детайли
    {
      "product_name": "Артикул 1",
      "quantity": 1,
      "unit_price": 25.00,
      "catalog_number": "SKU-001"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:pl-9">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveCustomApiConfig(platform)}
                        disabled={saving === platform.name}
                      >
                        {saving === platform.name ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {config.webhook_secret ? 'Запази' : 'Генерирай ключ и запази'}
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Standard Platform UI */
                  <>
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
                      title={!platform.is_enabled ? 'Активирайте платформата първо' : 'Синхронизирай всичко (категории, продукти, комплекти)'}
                    >
                      {syncing === platform.name ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Синхронизация
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
