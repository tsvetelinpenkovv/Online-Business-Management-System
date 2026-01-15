import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Truck, Loader2, Check, X, Eye, EyeOff, Settings2, MapPin, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Courier {
  id: string;
  name: string;
  logo_url: string | null;
}

interface CourierApiSetting {
  id?: string;
  courier_id: string;
  api_url?: string | null;
  username?: string | null;
  password?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  api_key?: string | null;
  is_test_mode?: boolean;
  is_enabled?: boolean;
  extra_config?: Record<string, unknown> | null;
}

// Courier type definitions for auth requirements
const COURIER_AUTH_TYPES: Record<string, { fields: string[], displayName: string }> = {
  'econt': { 
    fields: ['username', 'password'], 
    displayName: 'Еконт' 
  },
  'speedy': { 
    fields: ['username', 'password'], 
    displayName: 'Спиди' 
  },
  'box now': { 
    fields: ['client_id', 'client_secret'], 
    displayName: 'Box Now' 
  },
  'boxnow': { 
    fields: ['client_id', 'client_secret'], 
    displayName: 'Box Now' 
  },
  'sameday': { 
    fields: ['username', 'password'], 
    displayName: 'Sameday' 
  },
  'dhl': { 
    fields: ['username', 'password', 'account_number'], 
    displayName: 'DHL' 
  },
  'evropat': { 
    fields: ['api_key'], 
    displayName: 'Европат' 
  },
};

export const CourierApiSettings = () => {
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [settings, setSettings] = useState<Record<string, CourierApiSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, CourierApiSetting>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch couriers
      const { data: couriersData, error: couriersError } = await supabase
        .from('couriers')
        .select('id, name, logo_url')
        .order('name');

      if (couriersError) throw couriersError;

      // Fetch existing settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('courier_api_settings')
        .select('*');

      if (settingsError) throw settingsError;

      setCouriers(couriersData || []);
      
      const settingsMap: Record<string, CourierApiSetting> = {};
      const formMap: Record<string, CourierApiSetting> = {};
      
      (settingsData || []).forEach((s) => {
        const setting: CourierApiSetting = {
          ...s,
          extra_config: (s.extra_config as Record<string, unknown>) || {},
        };
        settingsMap[s.courier_id] = setting;
        formMap[s.courier_id] = { ...setting };
      });
      
      // Initialize form data for couriers without settings
      (couriersData || []).forEach((c) => {
        if (!formMap[c.id]) {
          formMap[c.id] = {
            courier_id: c.id,
            is_test_mode: true,
            is_enabled: false,
          };
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

  const handleFormChange = (courierId: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [courierId]: {
        ...prev[courierId],
        [field]: value,
      }
    }));
  };

  const handleSave = async (courier: Courier) => {
    setSaving(courier.id);
    try {
      const data = formData[courier.id];
      
      if (settings[courier.id]) {
        // Update existing
        const { error } = await supabase
          .from('courier_api_settings')
          .update({
            api_url: data.api_url || null,
            username: data.username || null,
            password: data.password || null,
            client_id: data.client_id || null,
            client_secret: data.client_secret || null,
            api_key: data.api_key || null,
            is_test_mode: data.is_test_mode ?? true,
            is_enabled: data.is_enabled ?? false,
            extra_config: (data.extra_config || {}) as Record<string, unknown>,
          })
          .eq('courier_id', courier.id);
          
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('courier_api_settings')
          .insert([{
            courier_id: courier.id,
            api_url: data.api_url || null,
            username: data.username || null,
            password: data.password || null,
            client_id: data.client_id || null,
            client_secret: data.client_secret || null,
            api_key: data.api_key || null,
            is_test_mode: data.is_test_mode ?? true,
            is_enabled: data.is_enabled ?? false,
            extra_config: (data.extra_config || {}) as Record<string, unknown>,
          }]);
          
        if (error) throw error;
      }

      toast({
        title: 'Успех',
        description: `Настройките за ${courier.name} бяха запазени`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на настройките',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (courier: Courier) => {
    setTesting(courier.id);
    try {
      const data = formData[courier.id];
      const courierType = getCourierType(courier.name);
      
      if (!courierType) {
        toast({
          title: 'Грешка',
          description: 'Неподдържан тип куриер',
          variant: 'destructive',
        });
        return;
      }

      const functionName = `courier-${courierType.replace(' ', '')}`;
      
      let credentials: Record<string, unknown> = {
        is_test_mode: data.is_test_mode ?? true,
      };
      
      const authFields = getAuthFields(courier.name);
      authFields.forEach(field => {
        if (field === 'account_number') {
          credentials.account_number = (data.extra_config as Record<string, string>)?.account_number || '';
        } else {
          credentials[field] = data[field as keyof CourierApiSetting] || '';
        }
      });

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'validateCredentials',
          credentials,
        },
      });

      if (error) throw error;
      
      if (result?.error) {
        toast({
          title: 'Грешка при валидация',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result?.success !== false) {
        toast({
          title: 'Успех',
          description: `Връзката с ${courier.name} е успешна!`,
        });
      } else {
        toast({
          title: 'Грешка',
          description: 'Невалидни данни за достъп',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешен тест на връзката',
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  };

  const renderAuthFields = (courier: Courier) => {
    const fields = getAuthFields(courier.name);
    const data = formData[courier.id] || {};

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
              value={(data.extra_config as Record<string, string>)?.account_number || ''}
              onChange={(e) => handleFormChange(courier.id, 'extra_config', { 
                ...(data.extra_config || {}), 
                account_number: e.target.value 
              } as unknown as string)}
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

  // Filter only supported couriers
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
              const data = formData[courier.id] || {};
              const isEnabled = data.is_enabled ?? false;
              const isTestMode = data.is_test_mode ?? true;
              
              return (
                <AccordionItem key={courier.id} value={courier.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 w-full pr-4">
                      {/* Logo */}
                      <div className="w-16 h-8 flex items-center justify-center bg-muted rounded overflow-hidden flex-shrink-0">
                        {courier.logo_url ? (
                          <img
                            src={courier.logo_url}
                            alt={courier.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Truck className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Name */}
                      <span className="font-medium flex-1 text-left">{courier.name}</span>
                      
                      {/* Status badges */}
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
                      {/* Enable/Test mode toggles */}
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`enabled-${courier.id}`}
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleFormChange(courier.id, 'is_enabled', checked)}
                          />
                          <Label htmlFor={`enabled-${courier.id}`}>Активирай интеграция</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`test-${courier.id}`}
                            checked={isTestMode}
                            onCheckedChange={(checked) => handleFormChange(courier.id, 'is_test_mode', checked)}
                          />
                          <Label htmlFor={`test-${courier.id}`}>Тестов режим</Label>
                        </div>
                      </div>

                      {/* Auth fields */}
                      {renderAuthFields(courier)}

                      {/* Features info */}
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

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          onClick={() => handleTest(courier)}
                          variant="outline"
                          disabled={testing === courier.id}
                        >
                          {testing === courier.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Тест връзка
                        </Button>
                        
                        <Button
                          onClick={() => handleSave(courier)}
                          disabled={saving === courier.id}
                        >
                          {saving === courier.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
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
