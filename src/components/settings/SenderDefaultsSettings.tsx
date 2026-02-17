import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Package, MapPin, Phone, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SenderDefaults {
  name: string;
  phone: string;
  city: string;
  address: string;
  postCode: string;
  contactPerson: string;
  officeCode: string;
}

export interface SenderDefaultsSettingsRef {
  saveConfig: () => Promise<void>;
}

export const SenderDefaultsSettings = forwardRef<SenderDefaultsSettingsRef>((_, ref) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaults, setDefaults] = useState<SenderDefaults>({
    name: '',
    phone: '',
    city: '',
    address: '',
    postCode: '',
    contactPerson: '',
    officeCode: '',
  });

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    try {
      // First try to get from api_settings
      const { data: settingsData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'sender_defaults')
        .maybeSingle();

      if (settingsData?.setting_value) {
        try {
          const parsed = JSON.parse(settingsData.setting_value);
          setDefaults(prev => ({ ...prev, ...parsed }));
          setLoading(false);
          return;
        } catch {
          // Invalid JSON, continue to company settings
        }
      }

      // Fallback to company settings
      const { data: companyData } = await supabase
        .from('company_settings')
        .select('company_name, phone, correspondence_address')
        .limit(1)
        .maybeSingle();

      if (companyData) {
        setDefaults(prev => ({
          ...prev,
          name: companyData.company_name || '',
          phone: companyData.phone || '',
          address: companyData.correspondence_address || '',
        }));
      }
    } catch (err) {
      console.error('Error loading sender defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfigSilent = async () => {
    const payload = {
      setting_key: 'sender_defaults',
      setting_value: JSON.stringify(defaults),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('api_settings')
      .upsert(payload, { onConflict: 'setting_key' });

    if (error) throw error;
  };

  useImperativeHandle(ref, () => ({
    saveConfig: async () => {
      await saveConfigSilent();
    },
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfigSilent();
      toast({ title: 'Успех', description: 'Данните на подателя са запазени' });
    } catch (err) {
      console.error('Error saving sender defaults:', err);
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на данните',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Данни на подател (по подразбиране)
        </CardTitle>
        <CardDescription>
          Тези данни ще се използват автоматично при създаване на товарителници. 
          Можете да ги редактирате за всяка отделна пратка.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sender-name" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Име на фирма / Подател
            </Label>
            <Input
              id="sender-name"
              value={defaults.name}
              onChange={(e) => setDefaults(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Име на фирмата"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-contact">Лице за контакт</Label>
            <Input
              id="sender-contact"
              value={defaults.contactPerson}
              onChange={(e) => setDefaults(prev => ({ ...prev, contactPerson: e.target.value }))}
              placeholder="Име на лицето за контакт"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Телефон
            </Label>
            <Input
              id="sender-phone"
              value={defaults.phone}
              onChange={(e) => setDefaults(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="08xxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-city" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Град
            </Label>
            <Input
              id="sender-city"
              value={defaults.city}
              onChange={(e) => setDefaults(prev => ({ ...prev, city: e.target.value }))}
              placeholder="София"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-postcode">Пощенски код</Label>
            <Input
              id="sender-postcode"
              value={defaults.postCode}
              onChange={(e) => setDefaults(prev => ({ ...prev, postCode: e.target.value }))}
              placeholder="1000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-office">Офис код (за изпращане от офис)</Label>
            <Input
              id="sender-office"
              value={defaults.officeCode}
              onChange={(e) => setDefaults(prev => ({ ...prev, officeCode: e.target.value }))}
              placeholder="Код на офис/автомат"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-address">Пълен адрес</Label>
          <Textarea
            id="sender-address"
            value={defaults.address}
            onChange={(e) => setDefaults(prev => ({ ...prev, address: e.target.value }))}
            placeholder="ул. Примерна 123, бл. 1, вх. А, ет. 2"
            rows={2}
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Запази данните на подателя
        </Button>
      </CardContent>
    </Card>
  );
});

SenderDefaultsSettings.displayName = 'SenderDefaultsSettings';
