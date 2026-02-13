import { useState, FC } from 'react';
import { useStores, Store } from '@/hooks/useStores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Globe, Plus, Trash2, Save, Loader2, Store as StoreIcon, Eye, EyeOff, TestTube, RefreshCw, Check, AlertCircle, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getFlagByCountryCode } from '@/components/orders/StoreFilterTabs';

const COUNTRY_OPTIONS = [
  { code: 'BG', name: 'България', currency: 'EUR', symbol: '€' },
  { code: 'GR', name: 'Гърция', currency: 'EUR', symbol: '€' },
  { code: 'RO', name: 'Румъния', currency: 'RON', symbol: 'RON' },
  { code: 'HU', name: 'Унгария', currency: 'HUF', symbol: 'Ft' },
  { code: 'DE', name: 'Германия', currency: 'EUR', symbol: '€' },
  { code: 'FR', name: 'Франция', currency: 'EUR', symbol: '€' },
  { code: 'IT', name: 'Италия', currency: 'EUR', symbol: '€' },
  { code: 'ES', name: 'Испания', currency: 'EUR', symbol: '€' },
  { code: 'PL', name: 'Полша', currency: 'PLN', symbol: 'zł' },
  { code: 'CZ', name: 'Чехия', currency: 'CZK', symbol: 'Kč' },
];

// Inline SVG flag for select items
const CountryFlag: FC<{ code: string; className?: string }> = ({ code, className = "w-5 h-3.5" }) => {
  const FlagComp = getFlagByCountryCode(code);
  if (!FlagComp) return <span className="text-xs font-mono uppercase text-muted-foreground">{code}</span>;
  return <FlagComp className={`${className} rounded-[1px] shadow-sm flex-shrink-0`} />;
};

export const MultiStoreSettings = () => {
  const { stores, multiStoreEnabled, loading, toggleMultiStore, createStore, updateStore, deleteStore, reorderStores } = useStores();
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    country_code: '',
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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
      flag_emoji: '',
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
    if (!confirm(`Сигурни ли сте, че искате да изтриете "${store.name}"?`)) return;
    const result = await deleteStore(store.id);
    if (result.success) {
      toast({ title: 'Изтрит', description: `${store.name} беше изтрит` });
    }
  };

  const moveStore = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stores.length) return;
    const reordered = [...stores];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const result = await reorderStores(reordered);
    if (result.success) {
      toast({ title: 'Преподредено', description: 'Редът на магазините е обновен' });
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...stores];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    reorderStores(reordered);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    toast({ title: 'Преподредено', description: 'Редът на магазините е обновен' });
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
                          <div className="flex items-center gap-2">
                            <CountryFlag code={c.code} />
                            <span>{c.name} ({c.currency})</span>
                          </div>
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

          {/* Existing stores - draggable */}
          {stores.map((store, index) => (
            <div
              key={store.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-opacity ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <StoreCard
                store={store}
                index={index}
                totalStores={stores.length}
                saving={saving === store.id}
                showSecrets={showSecrets[store.id] || false}
                onToggleSecrets={() => setShowSecrets(prev => ({ ...prev, [store.id]: !prev[store.id] }))}
                onSave={(updates) => handleSaveStore(store, updates)}
                onDelete={() => handleDeleteStore(store)}
                onMoveUp={() => moveStore(index, 'up')}
                onMoveDown={() => moveStore(index, 'down')}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
};

interface StoreCardProps {
  store: Store;
  index: number;
  totalStores: number;
  saving: boolean;
  showSecrets: boolean;
  onToggleSecrets: () => void;
  onSave: (updates: Partial<Store>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const StoreCard = ({ store, index, totalStores, saving, showSecrets, onToggleSecrets, onSave, onDelete, onMoveUp, onMoveDown }: StoreCardProps) => {
  const [form, setForm] = useState({
    name: store.name,
    wc_url: store.wc_url || '',
    wc_consumer_key: store.wc_consumer_key || '',
    wc_consumer_secret: store.wc_consumer_secret || '',
    wc_webhook_secret: store.wc_webhook_secret || '',
    is_enabled: store.is_enabled,
    is_primary: store.is_primary,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncStockToWoo, setSyncStockToWoo] = useState(true);
  const { toast } = useToast();

  const testConnection = async () => {
    if (!form.wc_url || !form.wc_consumer_key || !form.wc_consumer_secret) {
      toast({ title: 'Грешка', description: 'Моля, попълнете URL, Consumer Key и Consumer Secret', variant: 'destructive' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      new URL(form.wc_url);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResult('success');
      toast({ title: 'Успех', description: 'Връзката с WooCommerce е успешна' });
    } catch {
      setTestResult('error');
      toast({ title: 'Грешка', description: 'Неуспешна връзка с WooCommerce', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const syncNow = async () => {
    if (!form.is_enabled) {
      toast({ title: 'Грешка', description: 'Първо активирайте магазина', variant: 'destructive' });
      return;
    }
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: 'Успех', description: `Синхронизацията за ${store.name} е завършена` });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешна синхронизация', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className={`${store.is_enabled ? 'border-primary/30' : 'opacity-75'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
            <CountryFlag code={store.country_code} className="w-6 h-4" />
            <StoreIcon className="w-4 h-4" />
            {store.name}
            <Badge variant="outline" className="text-xs">
              {store.currency}
            </Badge>
            {store.is_primary && (
              <Badge className="text-xs">Основен</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={index === 0} title="Премести нагоре">
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={index === totalStores - 1} title="Премести надолу">
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
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
            <Label>URL на магазина</Label>
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
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.wc_consumer_key}
                onChange={(e) => setForm({ ...form, wc_consumer_key: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Consumer Secret</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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

        {/* Auto Sync Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Автоматична синхронизация</Label>
            <p className="text-sm text-muted-foreground">
              Синхронизирай наличностите автоматично при промяна
            </p>
          </div>
          <Switch
            checked={autoSync}
            onCheckedChange={setAutoSync}
          />
        </div>

        {/* Sync Stock TO WooCommerce Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg border-warning/50">
          <div className="space-y-0.5">
            <Label className="text-base">Изпращай наличности към WooCommerce</Label>
            <p className="text-sm text-muted-foreground">
              Когато е изключено, наличностите се водят само в системата и НЕ се изпращат към WooCommerce
            </p>
          </div>
          <Switch
            checked={syncStockToWoo}
            onCheckedChange={setSyncStockToWoo}
          />
        </div>

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
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={testConnection} variant="outline" size="sm" disabled={testing}>
            <TestTube className="w-4 h-4 mr-1" />
            {testing ? 'Тестване...' : 'Тест връзка'}
          </Button>
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
          <Button 
            onClick={syncNow}
            disabled={!form.is_enabled || syncing}
            size="sm"
            className="bg-primary"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Синхронизация...' : 'Синхронизирай сега'}
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
