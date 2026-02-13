import { useState } from 'react';
import { useStores, Store } from '@/hooks/useStores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Globe, Plus, Trash2, Save, Loader2, Store as StoreIcon, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COUNTRY_OPTIONS = [
  { code: 'BG', name: 'България', flag: '🇧🇬', currency: 'EUR', symbol: '€' },
  { code: 'GR', name: 'Гърция', flag: '🇬🇷', currency: 'EUR', symbol: '€' },
  { code: 'RO', name: 'Румъния', flag: '🇷🇴', currency: 'RON', symbol: 'RON' },
  { code: 'HU', name: 'Унгария', flag: '🇭🇺', currency: 'HUF', symbol: 'Ft' },
  { code: 'DE', name: 'Германия', flag: '🇩🇪', currency: 'EUR', symbol: '€' },
  { code: 'FR', name: 'Франция', flag: '🇫🇷', currency: 'EUR', symbol: '€' },
  { code: 'IT', name: 'Италия', flag: '🇮🇹', currency: 'EUR', symbol: '€' },
  { code: 'ES', name: 'Испания', flag: '🇪🇸', currency: 'EUR', symbol: '€' },
  { code: 'PL', name: 'Полша', flag: '🇵🇱', currency: 'PLN', symbol: 'zł' },
  { code: 'CZ', name: 'Чехия', flag: '🇨🇿', currency: 'CZK', symbol: 'Kč' },
];

export const MultiStoreSettings = () => {
  const { stores, multiStoreEnabled, loading, toggleMultiStore, createStore, updateStore, deleteStore } = useStores();
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    country_code: '',
  });

  const handleToggleMultiStore = async (enabled: boolean) => {
    const result = await toggleMultiStore(enabled);
    if (result.success) {
      toast({
        title: enabled ? 'Мулти-магазин активиран' : 'Мулти-магазин деактивиран',
        description: enabled ? 'Вече можете да добавяте магазини' : 'Функционалността е изключена',
      });
    }
  };

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.country_code) {
      toast({ title: 'Грешка', description: 'Попълнете име и държава', variant: 'destructive' });
      return;
    }

    const country = COUNTRY_OPTIONS.find(c => c.code === newStore.country_code);
    if (!country) return;

    setAdding(true);
    const result = await createStore({
      name: newStore.name,
      country_code: country.code,
      country_name: country.name,
      flag_emoji: country.flag,
      currency: country.currency,
      currency_symbol: country.symbol,
      sort_order: stores.length,
    });

    if (result.success) {
      toast({ title: 'Успех', description: 'Магазинът беше добавен' });
      setNewStore({ name: '', country_code: '' });
    } else {
      toast({ title: 'Грешка', description: result.error, variant: 'destructive' });
    }
    setAdding(false);
  };

  const handleSaveStore = async (store: Store, updates: Partial<Store>) => {
    setSaving(store.id);
    const result = await updateStore(store.id, updates);
    if (result.success) {
      toast({ title: 'Запазено', description: `${store.name} е обновен` });
    } else {
      toast({ title: 'Грешка', description: result.error, variant: 'destructive' });
    }
    setSaving(null);
  };

  const handleDeleteStore = async (store: Store) => {
    if (!confirm(`Сигурни ли сте, че искате да изтриете \\"${store.name}\\"?`)) return;
    const result = await deleteStore(store.id);
    if (result.success) {
      toast({ title: 'Изтрит', description: `${store.name} беше изтрит` });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Мулти-магазин режим
          </CardTitle>
          <CardDescription>
            Свържете множество WooCommerce магазини от различни държави към една система
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Активирай мулти-магазин</Label>
              <p className="text-sm text-muted-foreground">
                Позволява управление на поръчки от множество магазини
              </p>
            </div>
            <Switch
              checked={multiStoreEnabled}
              onCheckedChange={handleToggleMultiStore}
            />
          </div>
        </CardContent>
      </Card>

      {multiStoreEnabled && (
        <>
          {/* Add new store */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" />
                Добави магазин
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Име на магазина</Label>
                  <Input
                    placeholder="Моят магазин БГ"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Държава</Label>
                  <Select
                    value={newStore.country_code}
                    onValueChange={(v) => setNewStore({ ...newStore, country_code: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете държава" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddStore} disabled={adding} className="w-full">
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                    Добави
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing stores */}
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              saving={saving === store.id}
              showSecrets={showSecrets[store.id] || false}
              onToggleSecrets={() => setShowSecrets(prev => ({ ...prev, [store.id]: !prev[store.id] }))}
              onSave={(updates) => handleSaveStore(store, updates)}
              onDelete={() => handleDeleteStore(store)}
            />
          ))}
        </>
      )}
    </div>
  );
};

interface StoreCardProps {
  store: Store;
  saving: boolean;
  showSecrets: boolean;
  onToggleSecrets: () => void;
  onSave: (updates: Partial<Store>) => void;
  onDelete: () => void;
}

const StoreCard = ({ store, saving, showSecrets, onToggleSecrets, onSave, onDelete }: StoreCardProps) => {
  const [form, setForm] = useState({
    name: store.name,
    wc_url: store.wc_url || '',
    wc_consumer_key: store.wc_consumer_key || '',
    wc_consumer_secret: store.wc_consumer_secret || '',
    wc_webhook_secret: store.wc_webhook_secret || '',
    is_enabled: store.is_enabled,
    is_primary: store.is_primary,
  });

  return (
    <Card className={`${store.is_enabled ? 'border-primary/30' : 'opacity-75'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">{store.flag_emoji}</span>
            <StoreIcon className="w-4 h-4" />
            {store.name}
            <Badge variant="outline" className="text-xs">
              {store.currency}
            </Badge>
            {store.is_primary && (
              <Badge className="text-xs">Основен</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_enabled}
              onCheckedChange={(v) => {
                setForm({ ...form, is_enabled: v });
                onSave({ is_enabled: v });
              }}
            />
          </div>
        </div>
        <CardDescription>{store.country_name} • {store.currency_symbol}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Име</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>WooCommerce URL</Label>
            <Input
              placeholder="https://mystore.com"
              value={form.wc_url}
              onChange={(e) => setForm({ ...form, wc_url: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">API Ключове</Label>
            <Button variant="ghost" size="sm" onClick={onToggleSecrets}>
              {showSecrets ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {showSecrets ? 'Скрий' : 'Покажи'}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Consumer Key</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                placeholder="ck_..."
                value={form.wc_consumer_key}
                onChange={(e) => setForm({ ...form, wc_consumer_key: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Consumer Secret</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                placeholder="cs_..."
                value={form.wc_consumer_secret}
                onChange={(e) => setForm({ ...form, wc_consumer_secret: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Webhook Secret</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                placeholder="webhook secret..."
                value={form.wc_webhook_secret}
                onChange={(e) => setForm({ ...form, wc_webhook_secret: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onSave({
              name: form.name,
              wc_url: form.wc_url || null,
              wc_consumer_key: form.wc_consumer_key || null,
              wc_consumer_secret: form.wc_consumer_secret || null,
              wc_webhook_secret: form.wc_webhook_secret || null,
            })}
            disabled={saving}
            size="sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Запази
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Изтрий
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
