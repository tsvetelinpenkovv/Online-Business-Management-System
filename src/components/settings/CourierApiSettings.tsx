import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Truck, Loader2, Check, Eye, EyeOff, Settings2, MapPin, Package, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface Courier {
  id: string;
  name: string;
  logo_url: string | null;
}

interface CourierApiSetting {
  id?: string;
  courier_id: string;
  api_url: string | null;
  username: string | null;
  password: string | null;
  client_id: string | null;
  client_secret: string | null;
  api_key: string | null;
  is_test_mode: boolean;
  is_enabled: boolean;
  extra_config: Record<string, string>;
}

const createEmptySetting = (courierId: string): CourierApiSetting => ({
  courier_id: courierId,
  api_url: null,
  username: null,
  password: null,
  client_id: null,
  client_secret: null,
  api_key: null,
  is_test_mode: true,
  is_enabled: false,
  extra_config: {},
});

// Courier type definitions for auth requirements
const COURIER_AUTH_TYPES: Record<string, { fields: string[], displayName: string }> = {
  'econt': { fields: ['username', 'password'], displayName: 'Еконт' },
  'speedy': { fields: ['username', 'password'], displayName: 'Спиди' },
  'box now': { fields: ['client_id', 'client_secret'], displayName: 'Box Now' },
  'boxnow': { fields: ['client_id', 'client_secret'], displayName: 'Box Now' },
  'sameday': { fields: ['username', 'password'], displayName: 'Sameday' },
  'dhl': { fields: ['username', 'password', 'account_number'], displayName: 'DHL' },
  'evropat': { fields: ['api_key'], displayName: 'Европат' },
  'cvc': { fields: ['username', 'password'], displayName: 'CVC' },
};

export const CourierApiSettings = () => {
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [settings, setSettings] = useState<Record<string, CourierApiSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [refreshingOffices, setRefreshingOffices] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, CourierApiSetting>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: couriersData, error: couriersError } = await supabase
        .from('couriers')
        .select('id, name, logo_url')
        .order('name');

      if (couriersError) throw couriersError;

      const { data: settingsData, error: settingsError } = await supabase
        .from('courier_api_settings')
        .select('*');

      if (settingsError) throw settingsError;

      setCouriers(couriersData || []);
      
      const settingsMap: Record<string, CourierApiSetting> = {};
      const formMap: Record<string, CourierApiSetting> = {};
      
      (settingsData || []).forEach((s) => {
        const setting: CourierApiSetting = {
          id: s.id,
          courier_id: s.courier_id,
          api_url: s.api_url,
          username: s.username,
          password: s.password,
          client_id: s.client_id,
          client_secret: s.client_secret,
          api_key: s.api_key,
          is_test_mode: s.is_test_mode ?? true,
          is_enabled: s.is_enabled ?? false,
          extra_config: (s.extra_config as Record<string, string>) || {},
        };
        settingsMap[s.courier_id] = setting;
        formMap[s.courier_id] = { ...setting };
      });
      
      (couriersData || []).forEach((c) => {
        if (!formMap[c.id]) {
          formMap[c.id] = createEmptySetting(c.id);
        }
      });
      
      setSettings(settingsMap);
      setFormData(formMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на настройките',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCourierType = (courierName: string): string | null => {
    const lowerName = courierName.toLowerCase();
    for (const key of Object.keys(COURIER_AUTH_TYPES)) {
      if (lowerName.includes(key)) {
        return key;
      }
    }
    return null;
  };

  const getAuthFields = (courierName: string): string[] => {
    const type = getCourierType(courierName);
    return type ? COURIER_AUTH_TYPES[type].fields : ['api_key'];
  };

  const handleFormChange = (courierId: string, field: string, value: string | boolean | Record<string, string>) => {
    setFormData(prev => {
      const current = prev[courierId] || createEmptySetting(courierId);
      return {
        ...prev,
        [courierId]: {
          ...current,
          [field]: value,
        }
      };
    });
  };

  const handleSave = async (courier: Courier) => {
    setSaving(courier.id);
    try {
      const data = formData[courier.id] || createEmptySetting(courier.id);
      const payload = {
        api_url: data.api_url || null,
        username: data.username || null,
        password: data.password || null,
        client_id: data.client_id || null,
        client_secret: data.client_secret || null,
        api_key: data.api_key || null,
        is_test_mode: data.is_test_mode,
        is_enabled: data.is_enabled,
        extra_config: data.extra_config as unknown as Json,
      };
      
      if (settings[courier.id]) {
        const { error } = await supabase
          .from('courier_api_settings')
          .update(payload)
          .eq('courier_id', courier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courier_api_settings')
          .insert([{ courier_id: courier.id, ...payload }]);
        if (error) throw error;
      }

      toast({ title: 'Успех', description: `Настройките за ${courier.name} бяха запазени` });
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Грешка', description: 'Неуспешно запазване на настройките', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (courier: Courier) => {
    setTesting(courier.id);
    try {
      const data = formData[courier.id] || createEmptySetting(courier.id);
      const courierType = getCourierType(courier.name);
      
      if (!courierType) {
        toast({ title: 'Грешка', description: 'Неподдържан тип куриер', variant: 'destructive' });
        return;
      }

      const functionName = `courier-${courierType.replace(' ', '')}`;
      const credentials: Record<string, unknown> = { is_test_mode: data.is_test_mode };
      
      const authFields = getAuthFields(courier.name);
      authFields.forEach(field => {
        if (field === 'account_number') {
          credentials.account_number = data.extra_config?.account_number || '';
        } else {
          credentials[field] = data[field as keyof CourierApiSetting] || '';
        }
      });

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'validateCredentials', credentials },
      });

      if (error) throw error;
      
      if (result?.error) {
        toast({ title: 'Грешка при валидация', description: result.error, variant: 'destructive' });
      } else if (result?.success !== false) {
        toast({ title: 'Успех', description: `Връзката с ${courier.name} е успешна!` });
      } else {
        toast({ title: 'Грешка', description: 'Невалидни данни за достъп', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({ title: 'Грешка', description: 'Неуспешен тест на връзката', variant: 'destructive' });
    } finally {
      setTesting(null);
    }
  };

  const handleRefreshOffices = async (courier: Courier) => {
    setRefreshingOffices(courier.id);
    try {
      const data = formData[courier.id] || createEmptySetting(courier.id);
      const courierType = getCourierType(courier.name);
      
      if (!courierType) {
        toast({ title: 'Грешка', description: 'Неподдържан тип куриер', variant: 'destructive' });
        return;
      }

      const functionName = `courier-${courierType.replace(' ', '')}`;
      const credentials: Record<string, unknown> = { is_test_mode: data.is_test_mode };
      
      const authFields = getAuthFields(courier.name);
      authFields.forEach(field => {
        if (field === 'account_number') {
          credentials.account_number = data.extra_config?.account_number || '';
        } else {
          credentials[field] = data[field as keyof CourierApiSetting] || '';
        }
      });

      // Try to fetch offices
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'getOffices', credentials },
      });

      if (error) throw error;
      
      const officesCount = result?.offices?.length || result?.destinations?.length || result?.data?.length || 0;
      
      toast({ 
        title: 'Успех', 
        description: `Заредени ${officesCount} офиси/автомати от ${courier.name}` 
      });
    } catch (error) {
      console.error('Refresh offices error:', error);
      toast({ title: 'Грешка', description: 'Неуспешно обновяване на офиси', variant: 'destructive' });
    } finally {
      setRefreshingOffices(null);
    }
  };

  const renderAuthFields = (courier: Courier) => {
    const fields = getAuthFields(courier.name);
    const data = formData[courier.id] || createEmptySetting(courier.id);

    return (
      <div className="space-y-4">
        {fields.includes('username') && (
          <div className="space-y-2">
            <Label htmlFor={`username-${courier.id}`}>Потребител</Label>
            <Input
              id={`username-${courier.id}`}
              value={data.username || ''}
              onChange={(e) => handleFormChange(courier.id, 'username', e.target.value)}
              placeholder="Въведете потребителско име"
            />
          </div>
        )}

        {fields.includes('password') && (
          <div className="space-y-2">
            <Label htmlFor={`password-${courier.id}`}>Парола</Label>
            <div className="relative">
              <Input
                id={`password-${courier.id}`}
                type={showPasswords[courier.id] ? 'text' : 'password'}
                value={data.password || ''}
                onChange={(e) => handleFormChange(courier.id, 'password', e.target.value)}
                placeholder="Въведете парола"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, [courier.id]: !prev[courier.id] }))}
              >
                {showPasswords[courier.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {fields.includes('client_id') && (
          <div className="space-y-2">
            <Label htmlFor={`client_id-${courier.id}`}>Client ID</Label>
            <Input
              id={`client_id-${courier.id}`}
              value={data.client_id || ''}
              onChange={(e) => handleFormChange(courier.id, 'client_id', e.target.value)}
              placeholder="OAuth Client ID"
            />
          </div>
        )}

        {fields.includes('client_secret') && (
          <div className="space-y-2">
            <Label htmlFor={`client_secret-${courier.id}`}>Client Secret</Label>
            <div className="relative">
              <Input
                id={`client_secret-${courier.id}`}
                type={showPasswords[`secret-${courier.id}`] ? 'text' : 'password'}
                value={data.client_secret || ''}
                onChange={(e) => handleFormChange(courier.id, 'client_secret', e.target.value)}
                placeholder="OAuth Client Secret"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, [`secret-${courier.id}`]: !prev[`secret-${courier.id}`] }))}
              >
                {showPasswords[`secret-${courier.id}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {fields.includes('api_key') && (
          <div className="space-y-2">
            <Label htmlFor={`api_key-${courier.id}`}>API Key</Label>
            <div className="relative">
              <Input
                id={`api_key-${courier.id}`}
                type={showPasswords[`key-${courier.id}`] ? 'text' : 'password'}
                value={data.api_key || ''}
                onChange={(e) => handleFormChange(courier.id, 'api_key', e.target.value)}
                placeholder="API ключ"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({ ...prev, [`key-${courier.id}`]: !prev[`key-${courier.id}`] }))}
              >
                {showPasswords[`key-${courier.id}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {fields.includes('account_number') && (
          <div className="space-y-2">
            <Label htmlFor={`account-${courier.id}`}>Номер на акаунт (DHL)</Label>
            <Input
              id={`account-${courier.id}`}
              value={data.extra_config?.account_number || ''}
              onChange={(e) => handleFormChange(courier.id, 'extra_config', { 
                ...data.extra_config, 
                account_number: e.target.value 
              })}
              placeholder="DHL Account Number"
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const supportedCouriers = couriers.filter(c => getCourierType(c.name) !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          API настройки на куриери
        </CardTitle>
        <CardDescription>
          Конфигурирайте API достъп за автоматично създаване на товарителници и търсене на офиси.
          Поддържани куриери: Еконт, Спиди, Box Now, Sameday, DHL, Европат
        </CardDescription>
      </CardHeader>
      <CardContent>
        {supportedCouriers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Няма добавени поддържани куриери. Добавете куриер от секцията "Куриерски фирми".
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {supportedCouriers.map((courier) => {
              const data = formData[courier.id] || createEmptySetting(courier.id);
              const isEnabled = data.is_enabled;
              const isTestMode = data.is_test_mode;
              
              return (
                <AccordionItem key={courier.id} value={courier.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 w-full pr-4">
                      <div className="w-16 h-8 flex items-center justify-center bg-muted rounded overflow-hidden flex-shrink-0">
                        {courier.logo_url ? (
                          <img src={courier.logo_url} alt={courier.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Truck className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium flex-1 text-left">{courier.name}</span>
                      <div className="flex items-center gap-2">
                        {isEnabled && (
                          <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Активен
                          </span>
                        )}
                        {isTestMode && isEnabled && (
                          <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Тест режим
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`enabled-${courier.id}`}
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleFormChange(courier.id, 'is_enabled', checked)}
                          />
                          <Label htmlFor={`enabled-${courier.id}`} className="text-sm">Активирай интеграция</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`test-${courier.id}`}
                            checked={isTestMode}
                            onCheckedChange={(checked) => handleFormChange(courier.id, 'is_test_mode', checked)}
                          />
                          <Label htmlFor={`test-${courier.id}`} className="text-sm">Тестов режим</Label>
                        </div>
                      </div>

                      {renderAuthFields(courier)}

                      <div className="flex flex-wrap gap-2 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Package className="w-3.5 h-3.5" />
                          <span>Товарителници</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Офиси & автомати</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                        <Button 
                          onClick={() => handleTest(courier)} 
                          variant="outline" 
                          disabled={testing === courier.id}
                          className="w-full sm:w-auto"
                          size="sm"
                        >
                          {testing === courier.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                          Тест връзка
                        </Button>
                        <Button 
                          onClick={() => handleRefreshOffices(courier)} 
                          variant="outline" 
                          disabled={refreshingOffices === courier.id || !formData[courier.id]?.is_enabled}
                          title="Обнови офиси и автомати от API"
                          className="w-full sm:w-auto"
                          size="sm"
                        >
                          {refreshingOffices === courier.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Обнови офиси
                        </Button>
                        <Button 
                          onClick={() => handleSave(courier)} 
                          disabled={saving === courier.id}
                          className="w-full sm:w-auto"
                          size="sm"
                        >
                          {saving === courier.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Запази настройки
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
