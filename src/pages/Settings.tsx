import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Loader2, Key, Link, Webhook, Plus, Trash2, TestTube, ShieldAlert, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiSetting } from '@/types/order';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [customApis, setCustomApis] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('api_settings')
          .select('*');

        if (error) throw error;

        const settingsMap: Record<string, string> = {};
        const customs: { key: string; value: string }[] = [];

        (data as ApiSetting[]).forEach(item => {
          if (item.setting_key.startsWith('custom_api_')) {
            customs.push({ key: item.setting_key, value: item.setting_value || '' });
          } else {
            settingsMap[item.setting_key] = item.setting_value || '';
          }
        });

        setSettings(settingsMap);
        setCustomApis(customs);
      } catch (error: any) {
        toast({
          title: 'Грешка',
          description: 'Неуспешно зареждане на настройките',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      }));

      customApis.forEach(api => {
        updates.push({
          setting_key: api.key,
          setting_value: api.value,
          updated_at: new Date().toISOString(),
        });
      });

      for (const update of updates) {
        await supabase
          .from('api_settings')
          .upsert(update, { onConflict: 'setting_key' });
      }

      toast({
        title: 'Успех',
        description: 'Настройките бяха запазени',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на настройките',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addCustomApi = () => {
    const newKey = `custom_api_${Date.now()}`;
    setCustomApis([...customApis, { key: newKey, value: '' }]);
  };

  const removeCustomApi = (index: number) => {
    setCustomApis(customApis.filter((_, i) => i !== index));
  };

  const testConnection = async () => {
    if (!settings.woocommerce_url || !settings.woocommerce_consumer_key) {
      toast({
        title: 'Внимание',
        description: 'Моля въведете WooCommerce URL и Consumer Key',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Тестване',
      description: 'Връзката ще бъде тествана при следващото синхронизиране',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Настройки</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Запазване...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Запази
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              WooCommerce API
            </CardTitle>
            <CardDescription>
              Свържете системата с вашия WooCommerce магазин за автоматично синхронизиране на поръчки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="woo_url">WooCommerce URL</Label>
              <Input
                id="woo_url"
                placeholder="https://yourstore.com"
                value={settings.woocommerce_url || ''}
                onChange={(e) => setSettings({ ...settings, woocommerce_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumer_key">Consumer Key</Label>
              <Input
                id="consumer_key"
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.woocommerce_consumer_key || ''}
                onChange={(e) => setSettings({ ...settings, woocommerce_consumer_key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumer_secret">Consumer Secret</Label>
              <Input
                id="consumer_secret"
                type="password"
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.woocommerce_consumer_secret || ''}
                onChange={(e) => setSettings({ ...settings, woocommerce_consumer_secret: e.target.value })}
              />
            </div>
            <Button variant="outline" onClick={testConnection}>
              <TestTube className="w-4 h-4 mr-2" />
              Тествай връзката
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhook
            </CardTitle>
            <CardDescription>
              Използвайте този URL за автоматични известия от WooCommerce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                placeholder="https://..."
                value={settings.webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                readOnly
              />
              <p className="text-sm text-muted-foreground">
                Добавете този URL в WooCommerce → Settings → Advanced → Webhooks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Nekorekten.com API
            </CardTitle>
            <CardDescription>
              Проверка на телефонни номера за некоректни клиенти
              <a 
                href="https://nekorekten.com/bg/api/doc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
              >
                Документация <ExternalLink className="w-3 h-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nekorekten_api_key">API ключ</Label>
              <Input
                id="nekorekten_api_key"
                type="password"
                placeholder="Вашият Nekorekten API ключ"
                value={settings.nekorekten_api_key || ''}
                onChange={(e) => setSettings({ ...settings, nekorekten_api_key: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Можете да получите API ключ от профила си в Nekorekten.com
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nekorekten_site_id">Site ID (опционално)</Label>
              <Input
                id="nekorekten_site_id"
                placeholder="ID на вашия сайт в Nekorekten"
                value={settings.nekorekten_site_id || ''}
                onChange={(e) => setSettings({ ...settings, nekorekten_site_id: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Допълнителни API ключове
            </CardTitle>
            <CardDescription>
              Добавете допълнителни API ключове за други интеграции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customApis.map((api, index) => (
              <div key={api.key} className="flex items-center gap-2">
                <Input
                  placeholder="API ключ"
                  value={api.value}
                  onChange={(e) => {
                    const newApis = [...customApis];
                    newApis[index].value = e.target.value;
                    setCustomApis(newApis);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomApi(index)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addCustomApi} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Добави API ключ
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
