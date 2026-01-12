import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Save, TestTube, MessageCircle, Smartphone, Info, ExternalLink, Download,
  Clock, PhoneOff, CheckCircle2, CreditCard, Building2, Truck, PackageX, Package, 
  CircleCheck, Undo2, XCircle, Ban, Plus, Pencil, Trash2, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AVAILABLE_ICONS: Record<string, any> = {
  Clock, Loader2, PhoneOff, CheckCircle2, CreditCard, Building2,
  Truck, PackageX, Package, CircleCheck, Undo2, XCircle, Ban
};

const AVAILABLE_COLORS: Record<string, { bgClass: string; textClass: string }> = {
  primary: { bgClass: 'bg-primary/10', textClass: 'text-primary' },
  info: { bgClass: 'bg-info/10', textClass: 'text-info' },
  success: { bgClass: 'bg-success/10', textClass: 'text-success' },
  warning: { bgClass: 'bg-warning/10', textClass: 'text-warning' },
  destructive: { bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
  purple: { bgClass: 'bg-purple/10', textClass: 'text-purple' },
  teal: { bgClass: 'bg-teal/10', textClass: 'text-teal' },
  muted: { bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
};

const getIconComponent = (iconName: string) => AVAILABLE_ICONS[iconName] || Clock;
const getColorClasses = (colorName: string) => AVAILABLE_COLORS[colorName] || AVAILABLE_COLORS.primary;

interface ConnectixConfig {
  api_token: string;
  is_enabled: boolean;
  sandbox_mode: boolean;
  add_contacts: boolean;
  track_shipments: boolean;
  delivered_status: string;
}

interface ConnectixTemplate {
  id: string;
  name: string;
  type: 'viber' | 'sms';
  status: 'approved' | 'pending' | 'rejected';
}

interface ConnectixRule {
  id: string;
  name: string;
  template_id: string;
  template_name: string;
  trigger_type: 'status_change' | 'unclaimed_shipment' | 'shipment_ready' | 'delivered';
  trigger_status?: string;
  delay_days?: number;
  is_enabled: boolean;
  channel: 'viber' | 'sms' | 'both';
}

const TRIGGER_TYPES = [
  { value: 'status_change', label: 'Промяна в статуса на поръчката' },
  { value: 'unclaimed_shipment', label: 'Непотърсени пратки' },
  { value: 'shipment_ready', label: 'Пратката е готова за доставка' },
  { value: 'delivered', label: 'Доставена пратка' },
];

const defaultConfig: ConnectixConfig = {
  api_token: '',
  is_enabled: false,
  sandbox_mode: true,
  add_contacts: false,
  track_shipments: true,
  delivered_status: 'Доставена',
};

export const ConnectixSettings: FC = () => {
  const [config, setConfig] = useState<ConnectixConfig>(defaultConfig);
  const [templates, setTemplates] = useState<ConnectixTemplate[]>([]);
  const [rules, setRules] = useState<ConnectixRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingTemplates, setFetchingTemplates] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ConnectixRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const { statuses } = useOrderStatuses();
  const { toast } = useToast();

  // New rule form state
  const [newRule, setNewRule] = useState<Partial<ConnectixRule>>({
    name: '',
    template_id: '',
    template_name: '',
    trigger_type: 'status_change',
    trigger_status: '',
    delay_days: 0,
    is_enabled: true,
    channel: 'viber',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Load main config
      const { data: configData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'connectix_config')
        .maybeSingle();

      if (configData?.setting_value) {
        try {
          const parsed = JSON.parse(configData.setting_value);
          setConfig({ ...defaultConfig, ...parsed });
        } catch {
          setConfig(defaultConfig);
        }
      }

      // Load templates
      const { data: templatesData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'connectix_templates')
        .maybeSingle();

      if (templatesData?.setting_value) {
        try {
          setTemplates(JSON.parse(templatesData.setting_value));
        } catch {
          setTemplates([]);
        }
      }

      // Load rules
      const { data: rulesData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'connectix_rules')
        .maybeSingle();

      if (rulesData?.setting_value) {
        try {
          setRules(JSON.parse(rulesData.setting_value));
        } catch {
          setRules([]);
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

  const saveRules = async (newRules: ConnectixRule[]) => {
    try {
      await supabase
        .from('api_settings')
        .upsert({
          setting_key: 'connectix_rules',
          setting_value: JSON.stringify(newRules),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });
      
      setRules(newRules);
    } catch (error) {
      console.error('Error saving rules:', error);
      throw error;
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

  const fetchTemplates = async () => {
    if (!config.api_token) {
      toast({ 
        title: 'Грешка', 
        description: 'Моля, въведете API токен', 
        variant: 'destructive' 
      });
      return;
    }

    setFetchingTemplates(true);
    try {
      const { data, error } = await supabase.functions.invoke('connectix-send', {
        body: { 
          action: 'fetch_templates',
          api_token: config.api_token,
          sandbox_mode: config.sandbox_mode 
        }
      });

      if (error) throw error;

      if (data?.success && data?.templates) {
        setTemplates(data.templates);
        
        // Save templates to database
        await supabase
          .from('api_settings')
          .upsert({
            setting_key: 'connectix_templates',
            setting_value: JSON.stringify(data.templates),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'setting_key' });

        toast({ 
          title: 'Успех', 
          description: `Заредени ${data.templates.length} шаблона от Connectix` 
        });
      } else if (config.sandbox_mode) {
        // In sandbox mode, create demo templates
        const demoTemplates: ConnectixTemplate[] = [
          { id: 'demo-1', name: 'Нова поръчка', type: 'viber', status: 'approved' },
          { id: 'demo-2', name: 'Поръчката е изпратена', type: 'viber', status: 'approved' },
          { id: 'demo-3', name: 'Напомняне за непотърсена пратка', type: 'sms', status: 'approved' },
          { id: 'demo-4', name: 'Пратката е доставена', type: 'viber', status: 'approved' },
        ];
        setTemplates(demoTemplates);
        
        await supabase
          .from('api_settings')
          .upsert({
            setting_key: 'connectix_templates',
            setting_value: JSON.stringify(demoTemplates),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'setting_key' });

        toast({ 
          title: 'Sandbox режим', 
          description: 'Заредени демо шаблони' 
        });
      } else {
        throw new Error(data?.error || 'Неуспешно зареждане на шаблони');
      }
    } catch (err: any) {
      toast({ 
        title: 'Грешка', 
        description: err.message || 'Неуспешно зареждане на шаблони', 
        variant: 'destructive' 
      });
    } finally {
      setFetchingTemplates(false);
    }
  };

  const openAddRuleDialog = () => {
    setEditingRule(null);
    setNewRule({
      name: '',
      template_id: '',
      template_name: '',
      trigger_type: 'status_change',
      trigger_status: '',
      delay_days: 0,
      is_enabled: true,
      channel: 'viber',
    });
    setRuleDialogOpen(true);
  };

  const openEditRuleDialog = (rule: ConnectixRule) => {
    setEditingRule(rule);
    setNewRule({ ...rule });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!newRule.name || !newRule.template_id) {
      toast({ 
        title: 'Грешка', 
        description: 'Моля, попълнете всички задължителни полета', 
        variant: 'destructive' 
      });
      return;
    }

    const template = templates.find(t => t.id === newRule.template_id);
    
    try {
      let updatedRules: ConnectixRule[];
      
      if (editingRule) {
        updatedRules = rules.map(r => 
          r.id === editingRule.id 
            ? { ...r, ...newRule, template_name: template?.name || '' } as ConnectixRule
            : r
        );
      } else {
        const newRuleWithId: ConnectixRule = {
          ...newRule as ConnectixRule,
          id: `rule_${Date.now()}`,
          template_name: template?.name || '',
        };
        updatedRules = [...rules, newRuleWithId];
      }

      await saveRules(updatedRules);
      setRuleDialogOpen(false);
      toast({ 
        title: 'Успех', 
        description: editingRule ? 'Правилото е обновено' : 'Правилото е добавено' 
      });
    } catch (err) {
      toast({ 
        title: 'Грешка', 
        description: 'Неуспешно запазване на правилото', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleId) return;
    
    try {
      const updatedRules = rules.filter(r => r.id !== deleteRuleId);
      await saveRules(updatedRules);
      setDeleteRuleId(null);
      toast({ title: 'Успех', description: 'Правилото е изтрито' });
    } catch (err) {
      toast({ 
        title: 'Грешка', 
        description: 'Неуспешно изтриване', 
        variant: 'destructive' 
      });
    }
  };

  const toggleRuleEnabled = async (ruleId: string) => {
    const updatedRules = rules.map(r => 
      r.id === ruleId ? { ...r, is_enabled: !r.is_enabled } : r
    );
    await saveRules(updatedRules);
  };

  const getTriggerLabel = (type: string) => {
    return TRIGGER_TYPES.find(t => t.value === type)?.label || type;
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
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  Connectix
                  <Badge variant={config.is_enabled ? 'default' : 'secondary'} className={config.is_enabled ? 'bg-success' : ''}>
                    {config.is_enabled ? 'Активен' : 'Неактивен'}
                  </Badge>
                  {config.sandbox_mode && (
                    <Badge variant="outline" className="text-warning border-warning">
                      Sandbox
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  Изпращане на Viber и SMS известия към клиенти
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={config.is_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })}
              className="shrink-0"
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
              Настройки на модула
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api_token">Токен на приложение от Connectix *</Label>
                <Input
                  id="api_token"
                  type="password"
                  value={config.api_token}
                  onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
                  placeholder="Въведете API токен"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Статус за доставена пратка</Label>
                <Select
                  value={config.delivered_status || "none"}
                  onValueChange={(value) => setConfig({ ...config, delivered_status: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете статус..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Не е зададен —</SelectItem>
                    {statuses.map((status) => {
                      const colorClasses = getColorClasses(status.color);
                      const Icon = getIconComponent(status.icon);
                      return (
                        <SelectItem key={status.id} value={status.name}>
                          <span className={`inline-flex items-center gap-1.5 ${colorClasses.textClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {status.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
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

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Switch
                  id="add_contacts"
                  checked={config.add_contacts}
                  onCheckedChange={(checked) => setConfig({ ...config, add_contacts: checked })}
                />
                <div>
                  <Label htmlFor="add_contacts" className="cursor-pointer">Добавяне на Контактите в Connectix</Label>
                  <p className="text-xs text-muted-foreground">
                    Автоматично добавяне на клиентите като контакти в Connectix
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Switch
                  id="track_shipments"
                  checked={config.track_shipments}
                  onCheckedChange={(checked) => setConfig({ ...config, track_shipments: checked })}
                />
                <div>
                  <Label htmlFor="track_shipments" className="cursor-pointer">Проследи пратките</Label>
                  <p className="text-xs text-muted-foreground">
                    Автоматично проследяване на статуса на пратките
                  </p>
                </div>
              </div>
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
              Запази
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates & Rules Card */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div>
              <CardTitle>Шаблони и Правила</CardTitle>
              <CardDescription>
                Управление на шаблони от Connectix и правила за автоматично изпращане
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={fetchTemplates}
                disabled={fetchingTemplates || !config.api_token}
                className="w-full sm:w-auto"
                size="sm"
              >
                {fetchingTemplates ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                <span className="truncate">Изтегли шаблоните</span>
              </Button>
              <Button 
                onClick={openAddRuleDialog} 
                disabled={templates.length === 0}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="truncate">Добави правило</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Templates list */}
          {templates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Налични шаблони ({templates.length})</h4>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Badge 
                    key={template.id} 
                    variant="outline"
                    className="gap-1.5"
                  >
                    {template.type === 'viber' ? (
                      <MessageCircle className="w-3 h-3 text-purple" />
                    ) : (
                      <Smartphone className="w-3 h-3 text-info" />
                    )}
                    {template.name}
                    {template.status === 'approved' && (
                      <Badge className="bg-success text-white text-[10px] px-1 py-0 h-4">Одобрен</Badge>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Няма заредени шаблони</p>
              <p className="text-sm">Натиснете "Изтегли шаблоните" за да заредите шаблони от Connectix</p>
            </div>
          )}

          <Separator />

          {/* Rules list */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Правила за изпращане ({rules.length})</h4>
            
            {rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Plus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Няма създадени правила</p>
                <p className="text-sm">Добавете правило за автоматично изпращане на съобщения</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg border"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{rule.channel}:</span>
                        <span className="truncate">{rule.template_name || rule.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {getTriggerLabel(rule.trigger_type)}
                        </Badge>
                        {rule.trigger_status && (
                          <Badge variant="outline" className="text-xs">
                            {rule.trigger_status}
                          </Badge>
                        )}
                        {rule.delay_days && rule.delay_days > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Дни: {rule.delay_days}
                          </Badge>
                        )}
                        <Badge 
                          className={rule.is_enabled ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}
                        >
                          {rule.is_enabled ? 'Вкл.' : 'Изкл.'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => openEditRuleDialog(rule)}
                        className="h-8 w-8"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteRuleId(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Редактирай правило' : 'Добави ново правило'}
            </DialogTitle>
            <DialogDescription>
              Конфигурирайте кога и какво съобщение да се изпраща автоматично
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Име на правилото</Label>
              <Input
                value={newRule.name || ''}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Напр. Известие за изпратена поръчка"
              />
            </div>

            <div className="space-y-2">
              <Label>Шаблон *</Label>
              <Select
                value={newRule.template_id || "none"}
                onValueChange={(value) => setNewRule({ ...newRule, template_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Изберете шаблон..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Изберете шаблон —</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <span className="inline-flex items-center gap-1.5">
                        {template.type === 'viber' ? (
                          <MessageCircle className="w-3 h-3 text-purple" />
                        ) : (
                          <Smartphone className="w-3 h-3 text-info" />
                        )}
                        {template.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Тип на тригера *</Label>
              <Select
                value={newRule.trigger_type}
                onValueChange={(value) => setNewRule({ ...newRule, trigger_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newRule.trigger_type === 'status_change' && (
              <div className="space-y-2">
                <Label>При смяна на статус *</Label>
                <Select
                  value={newRule.trigger_status || "none"}
                  onValueChange={(value) => setNewRule({ ...newRule, trigger_status: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете статус..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Изберете статус —</SelectItem>
                    {statuses.map((status) => {
                      const colorClasses = getColorClasses(status.color);
                      const Icon = getIconComponent(status.icon);
                      return (
                        <SelectItem key={status.id} value={status.name}>
                          <span className={`inline-flex items-center gap-1.5 ${colorClasses.textClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {status.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newRule.trigger_type === 'unclaimed_shipment' && (
              <div className="space-y-2">
                <Label>След колко дни</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={newRule.delay_days || 3}
                  onChange={(e) => setNewRule({ ...newRule, delay_days: parseInt(e.target.value) || 3 })}
                />
                <p className="text-xs text-muted-foreground">
                  Изпраща съобщение след посочените дни от изпращане
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Канал</Label>
              <Select
                value={newRule.channel}
                onValueChange={(value) => setNewRule({ ...newRule, channel: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viber">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="w-3 h-3 text-purple" />
                      Viber (с SMS резерва)
                    </span>
                  </SelectItem>
                  <SelectItem value="sms">
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3 text-info" />
                      Само SMS
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Switch
                checked={newRule.is_enabled}
                onCheckedChange={(checked) => setNewRule({ ...newRule, is_enabled: checked })}
              />
              <Label>Правилото е активно</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Отказ
            </Button>
            <Button onClick={handleSaveRule}>
              {editingRule ? 'Запази промените' : 'Добави правило'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteRuleId !== null} onOpenChange={() => setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на правило</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете това правило? Това действие не може да бъде отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};