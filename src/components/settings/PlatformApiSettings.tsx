import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, TestTube, Copy, Check } from 'lucide-react';
import { useEcommercePlatforms, EcommercePlatform } from '@/hooks/useEcommercePlatforms';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import woocommerceLogo from '@/assets/woocommerce-logo.png';
import { PrestaShopLogo, OpenCartLogo, MagentoLogo, ShopifyLogo } from '@/components/icons/PlatformLogos';
import { EditableSourceLogo } from './EditableSourceLogo';

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
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const { toast } = useToast();

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
          {platforms.filter(p => p.name !== 'woocommerce').map((platform, index) => {
            const config = configs[platform.name] || { store_url: '', api_key: '', api_secret: '' };
            const labels = platformApiLabels[platform.name] || { apiKey: 'API Key', apiSecret: 'API Secret', description: '' };
            const webhookUrl = getWebhookUrl(platform.name);
            const filteredPlatforms = platforms.filter(p => p.name !== 'woocommerce');

            return (
              <div key={platform.id}>
                {index > 0 && <Separator className="my-6" />}
                
                <div className="space-y-4">
                  {/* Platform Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <EditableSourceLogo
                        sourceId={platform.id}
                        sourceName={platform.display_name}
                        currentLogo={platformLogos[platform.name]}
                        logoUrl={platform.logo_url}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-medium">{platform.display_name}</h3>
                        <p className="text-xs text-muted-foreground">{labels.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={platform.is_enabled ? 'default' : 'secondary'} className={platform.is_enabled ? 'bg-success' : ''}>
                        {platform.is_enabled ? 'Активен' : 'Неактивен'}
                      </Badge>
                      <Switch
                        checked={platform.is_enabled}
                        onCheckedChange={(checked) => togglePlatform(platform.id, checked)}
                      />
                    </div>
                  </div>

                  {/* API Settings */}
                  <div className="grid gap-4 sm:grid-cols-3 pl-9">
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
                    <div className="pl-9 space-y-2">
                      <Label className="text-muted-foreground">Webhook URL (за автоматични поръчки)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={webhookUrl}
                          readOnly
                          className="font-mono text-xs bg-muted"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyWebhookUrl(platform.name)}
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
                  <div className="flex gap-2 pl-9">
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
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
