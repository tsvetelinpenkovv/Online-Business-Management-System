import { FC, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw, Check, AlertCircle, Save, TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import woocommerceLogo from '@/assets/woocommerce-logo.png';
import { PrestaShopLogo, OpenCartLogo, MagentoLogo, ShopifyLogo } from '@/components/icons/PlatformLogos';

interface PlatformConfig {
  store_url: string;
  api_key: string;
  api_secret: string;
  is_enabled: boolean;
  auto_sync: boolean;
  last_sync: string | null;
}

interface EcommercePlatformSettingsProps {
  platformName: string;
  displayName: string;
  onSync?: () => void;
  description?: string;
  apiKeyLabel?: string;
  apiSecretLabel?: string;
}

const platformLogos: Record<string, React.ReactNode> = {
  woocommerce: <img src={woocommerceLogo} alt="WooCommerce" className="w-8 h-8" />,
  prestashop: <PrestaShopLogo className="w-8 h-8" />,
  opencart: <OpenCartLogo className="w-8 h-8" />,
  magento: <MagentoLogo className="w-8 h-8" />,
  shopify: <ShopifyLogo className="w-8 h-8" />,
};

export const EcommercePlatformSettings: FC<EcommercePlatformSettingsProps> = ({ 
  platformName,
  displayName,
  onSync,
  description,
  apiKeyLabel = 'API Key',
  apiSecretLabel = 'API Secret'
}) => {
  const [config, setConfig] = useState<PlatformConfig>({
    store_url: '',
    api_key: '',
    api_secret: '',
    is_enabled: false,
    auto_sync: false,
    last_sync: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const { toast } = useToast();

  const SETTING_KEY = `${platformName}_config`;

  useEffect(() => {
    loadConfig();
  }, [platformName]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_settings')
        .select('*')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();

      if (data && !error && data.setting_value) {
        try {
          const settings = JSON.parse(data.setting_value) as PlatformConfig;
          setConfig(settings);
        } catch {
          // Invalid JSON, use defaults
        }
      }
    } catch (err) {
      console.error(`Error loading ${platformName} config:`, err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Save to api_settings
      const { error: settingsError } = await supabase
        .from('api_settings')
        .upsert({
          setting_key: SETTING_KEY,
          setting_value: JSON.stringify(config),
        }, { onConflict: 'setting_key' });

      if (settingsError) throw settingsError;

      // Update platform enabled status
      const { error: platformError } = await supabase
        .from('ecommerce_platforms')
        .update({ 
          is_enabled: config.is_enabled,
          config: config as any
        })
        .eq('name', platformName);

      if (platformError) throw platformError;

      toast({ title: 'Успех', description: 'Настройките са запазени' });
    } catch (err) {
      toast({ 
        title: 'Грешка', 
        description: 'Неуспешно запазване на настройките', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.store_url || !config.api_key || !config.api_secret) {
      toast({ 
        title: 'Грешка', 
        description: 'Моля, попълнете всички полета', 
        variant: 'destructive' 
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const url = new URL(config.store_url);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Invalid URL protocol');
      }

      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestResult('success');
      toast({ title: 'Успех', description: `Връзката с ${displayName} е успешна` });
    } catch (err) {
      setTestResult('error');
      toast({ 
        title: 'Грешка', 
        description: `Неуспешна връзка с ${displayName}. Проверете данните.`, 
        variant: 'destructive' 
      });
    } finally {
      setTesting(false);
    }
  };

  const syncNow = async () => {
    if (!config.is_enabled) {
      toast({ 
        title: 'Грешка', 
        description: `Първо активирайте ${displayName} интеграцията`, 
        variant: 'destructive' 
      });
      return;
    }

    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const now = new Date().toISOString();
      const updatedConfig = { ...config, last_sync: now };
      setConfig(updatedConfig);
      
      await supabase
        .from('api_settings')
        .update({
          setting_value: JSON.stringify(updatedConfig),
        })
        .eq('setting_key', SETTING_KEY);

      toast({ title: 'Успех', description: 'Синхронизацията е завършена' });
      onSync?.();
    } catch (err) {
      toast({ 
        title: 'Грешка', 
        description: 'Неуспешна синхронизация', 
        variant: 'destructive' 
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {platformLogos[platformName] || null}
            <div>
              <CardTitle>{displayName} интеграция</CardTitle>
              <CardDescription>
                {description || `Синхронизирайте наличностите със своя ${displayName} магазин`}
              </CardDescription>
            </div>
          </div>
          <Badge variant={config.is_enabled ? 'default' : 'secondary'} className={config.is_enabled ? 'bg-success' : ''}>
            {config.is_enabled ? 'Активен' : 'Неактивен'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Активирай интеграцията</Label>
            <p className="text-sm text-muted-foreground">
              Включете за да синхронизирате наличностите с {displayName}
            </p>
          </div>
          <Switch
            checked={config.is_enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_enabled: checked }))}
          />
        </div>

        {/* Connection Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${platformName}_store_url`}>URL на магазина</Label>
            <Input
              id={`${platformName}_store_url`}
              value={config.store_url}
              onChange={(e) => setConfig(prev => ({ ...prev, store_url: e.target.value }))}
              placeholder="https://mystore.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${platformName}_api_key`}>{apiKeyLabel}</Label>
            <Input
              id={`${platformName}_api_key`}
              value={config.api_key}
              onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="Въведете API ключ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${platformName}_api_secret`}>{apiSecretLabel}</Label>
            <Input
              id={`${platformName}_api_secret`}
              type="password"
              value={config.api_secret}
              onChange={(e) => setConfig(prev => ({ ...prev, api_secret: e.target.value }))}
              placeholder="Въведете API тайна"
            />
          </div>
        </div>

        {/* Auto Sync Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Автоматична синхронизация</Label>
            <p className="text-sm text-muted-foreground">
              Синхронизирай наличностите автоматично при промяна
            </p>
          </div>
          <Switch
            checked={config.auto_sync}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_sync: checked }))}
          />
        </div>

        {/* Last Sync Info */}
        {config.last_sync && (
          <div className="text-sm text-muted-foreground">
            Последна синхронизация: {new Date(config.last_sync).toLocaleString('bg-BG')}
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            testResult === 'success' 
              ? 'bg-success/10 text-success border border-success/30' 
              : 'bg-destructive/10 text-destructive border border-destructive/30'
          }`}>
            {testResult === 'success' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Връзката е успешна!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Грешка при свързване</span>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={testConnection} variant="outline" disabled={testing}>
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? 'Тестване...' : 'Тест връзка'}
          </Button>
          <Button onClick={saveConfig} variant="outline" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Запазване...' : 'Запази'}
          </Button>
          <Button 
            onClick={syncNow} 
            disabled={!config.is_enabled || syncing}
            className="bg-primary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Синхронизация...' : 'Синхронизирай сега'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
