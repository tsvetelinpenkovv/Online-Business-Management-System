import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, TestTube, MessageCircle, Smartphone, Check, Info, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';

interface ConnectixConfig {
  api_token: string;
  template_id: string;
  trigger_status: string;
  is_enabled: boolean;
  message_template: string;
  sandbox_mode: boolean;
}

const defaultConfig: ConnectixConfig = {
  api_token: '',
  template_id: '',
  trigger_status: '',
  is_enabled: false,
  message_template: 'Здравейте {customer_name}, вашата поръчка #{order_id} е изпратена! Товарителница: {tracking_number}',
  sandbox_mode: true,
};

export const ConnectixSettings: FC = () => {
  const [config, setConfig] = useState<ConnectixConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { statuses } = useOrderStatuses();
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'connectix_config')
        .maybeSingle();

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          setConfig({ ...defaultConfig, ...parsed });
        } catch {
          setConfig(defaultConfig);
        }
      }
    } catch (error) {
      console.error('Error loading Connectix config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('api_settings')
        .upsert({
          setting_key: 'connectix_config',
          setting_value: JSON.stringify(config),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({ title: 'Успех', description: 'Connectix настройките са запазени' });
    } catch (err) {
      toast({ 
        title: 'Грешка', 
        description: 'Неуспешно запазване', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.api_token) {
      toast({ 
        title: 'Грешка', 
        description: 'Моля, въведете API токен', 
        variant: 'destructive' 
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('connectix-send', {
        body: { 
          action: 'test',
          api_token: config.api_token,
          sandbox_mode: config.sandbox_mode 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({ title: 'Успех', description: 'Връзката с Connectix е успешна!' });
      } else {
        throw new Error(data?.error || 'Неуспешен тест');
      }
    } catch (err: any) {
      toast({ 
        title: 'Грешка', 
        description: err.message || 'Неуспешна връзка с Connectix', 
        variant: 'destructive' 
      });
    } finally {
      setTesting(false);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Connectix
                <Badge variant={config.is_enabled ? 'default' : 'secondary'} className={config.is_enabled ? 'bg-success' : ''}>
                  {config.is_enabled ? 'Активен' : 'Неактивен'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Изпращане на Viber и SMS известия към клиенти
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={config.is_enabled}
            onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="bg-muted/50 border rounded-lg p-4 flex gap-3">
          <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">Как работи Connectix?</p>
            <p className="text-muted-foreground">
              Connectix изпраща Viber съобщения към клиентите. Ако получателят няма Viber, 
              автоматично се изпраща SMS като резервен вариант.
            </p>
            <a 
              href="https://connectix.bg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Регистрация в Connectix <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <Separator />

        {/* API Configuration */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            API Конфигурация
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api_token">API Токен *</Label>
              <Input
                id="api_token"
                type="password"
                value={config.api_token}
                onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
                placeholder="Въведете API токен от Connectix"
              />
              <p className="text-xs text-muted-foreground">
                Получете токена от панела на Connectix
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template_id">Template ID *</Label>
              <Input
                id="template_id"
                value={config.template_id}
                onChange={(e) => setConfig({ ...config, template_id: e.target.value })}
                placeholder="ID на шаблона за съобщения"
              />
              <p className="text-xs text-muted-foreground">
                Създайте шаблон в Connectix и копирайте ID
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Switch
              id="sandbox_mode"
              checked={config.sandbox_mode}
              onCheckedChange={(checked) => setConfig({ ...config, sandbox_mode: checked })}
            />
            <div>
              <Label htmlFor="sandbox_mode" className="cursor-pointer">Sandbox режим</Label>
              <p className="text-xs text-muted-foreground">
                Тестов режим - съобщенията няма да се изпращат реално
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Trigger Configuration */}
        <div className="space-y-4">
          <h3 className="font-medium">Автоматично изпращане</h3>
          
          <div className="space-y-2">
            <Label>Статус, който тригерира изпращане</Label>
            <Select
              value={config.trigger_status || "none"}
              onValueChange={(value) => setConfig({ ...config, trigger_status: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Изберете статус..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Без автоматично изпращане —</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Когато поръчка премине в този статус, автоматично ще се изпрати известие
            </p>
          </div>
        </div>

        <Separator />

        {/* Message Template Preview */}
        <div className="space-y-4">
          <h3 className="font-medium">Шаблон на съобщението (превю)</h3>
          <Textarea
            value={config.message_template}
            onChange={(e) => setConfig({ ...config, message_template: e.target.value })}
            rows={3}
            placeholder="Вашето съобщение..."
            className="font-mono text-sm"
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Налични плейсхолдъри:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-mono">{'{customer_name}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{order_id}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{tracking_number}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{product_name}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{total_price}'}</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              Забележка: Реалният текст се дефинира в шаблона на Connectix. Този текст е само за справка.
            </p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={testing || !config.api_token}
          >
            {testing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Тест на връзката
          </Button>
          <Button
            onClick={saveConfig}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Запази настройки
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
