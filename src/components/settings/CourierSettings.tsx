import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Plus, Trash2, Upload, Loader2, ImageIcon, X, Link, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';

interface Courier {
  id: string;
  name: string;
  logo_url: string | null;
  url_pattern: string | null;
}

interface TrackingConfig {
  id?: string;
  courier_id: string;
  is_enabled: boolean;
  polling_interval_minutes: number;
  delivered_status_name: string;
  returned_status_name: string;
}

export const CourierSettings = () => {
  const { toast } = useToast();
  const { statuses } = useOrderStatuses();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourierName, setNewCourierName] = useState('');
  const [addingCourier, setAddingCourier] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
  const [patternValue, setPatternValue] = useState('');
  const [savingPattern, setSavingPattern] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-tracking config
  const [trackingConfigs, setTrackingConfigs] = useState<Record<string, TrackingConfig>>({});
  const [savingTracking, setSavingTracking] = useState<string | null>(null);

  const fetchCouriers = async () => {
    try {
      const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCouriers(data || []);
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на куриерите',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('courier_tracking_config')
        .select('*');

      if (error) throw error;
      const configMap: Record<string, TrackingConfig> = {};
      (data || []).forEach((c: any) => {
        configMap[c.courier_id] = c;
      });
      setTrackingConfigs(configMap);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchCouriers();
    fetchTrackingConfigs();
  }, []);

  const handleSaveTrackingConfig = async (courierId: string, updates: Partial<TrackingConfig>) => {
    setSavingTracking(courierId);
    try {
      const existing = trackingConfigs[courierId];
      const config = {
        courier_id: courierId,
        is_enabled: updates.is_enabled ?? existing?.is_enabled ?? false,
        polling_interval_minutes: updates.polling_interval_minutes ?? existing?.polling_interval_minutes ?? 30,
        delivered_status_name: updates.delivered_status_name ?? existing?.delivered_status_name ?? 'Доставена',
        returned_status_name: updates.returned_status_name ?? existing?.returned_status_name ?? 'Върната',
      };

      const { error } = await supabase
        .from('courier_tracking_config')
        .upsert(
          existing?.id ? { id: existing.id, ...config } : config,
          { onConflict: 'courier_id' }
        );

      if (error) throw error;

      setTrackingConfigs(prev => ({
        ...prev,
        [courierId]: { ...prev[courierId], ...config },
      }));

      toast({ title: 'Успех', description: 'Настройките за проследяване бяха запазени' });
    } catch (error: any) {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSavingTracking(null);
    }
  };

  const handleAddCourier = async () => {
    if (!newCourierName.trim()) {
      toast({
        title: 'Грешка',
        description: 'Моля въведете име на куриер',
        variant: 'destructive',
      });
      return;
    }

    setAddingCourier(true);
    try {
      const { error } = await supabase
        .from('couriers')
        .insert({ name: newCourierName.trim() });

      if (error) throw error;

      toast({ title: 'Успех', description: 'Куриерът беше добавен' });
      setNewCourierName('');
      fetchCouriers();
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message?.includes('duplicate') 
          ? 'Куриер с това име вече съществува' 
          : 'Неуспешно добавяне на куриер',
        variant: 'destructive',
      });
    } finally {
      setAddingCourier(false);
    }
  };

  const handleDeleteCourier = async (id: string) => {
    setDeletingId(id);
    try {
      const courier = couriers.find(c => c.id === id);
      if (courier?.logo_url) {
        const path = courier.logo_url.split('/logos/')[1];
        if (path) {
          await supabase.storage.from('logos').remove([path]);
        }
      }

      const { error } = await supabase.from('couriers').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Успех', description: 'Куриерът беше изтрит' });
      fetchCouriers();
    } catch (error: any) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на куриер', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogoUpload = async (courierId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Грешка', description: 'Моля изберете изображение', variant: 'destructive' });
      return;
    }

    setUploadingId(courierId);
    try {
      const courier = couriers.find(c => c.id === courierId);
      if (courier?.logo_url) {
        const oldPath = courier.logo_url.split('/logos/')[1];
        if (oldPath) await supabase.storage.from('logos').remove([oldPath]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `courier_${courierId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('couriers').update({ logo_url: publicUrl }).eq('id', courierId);
      if (updateError) throw updateError;

      toast({ title: 'Успех', description: 'Логото беше качено' });
      fetchCouriers();
    } catch (error: any) {
      toast({ title: 'Грешка', description: 'Неуспешно качване на лого', variant: 'destructive' });
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveLogo = async (courierId: string) => {
    const courier = couriers.find(c => c.id === courierId);
    if (!courier?.logo_url) return;

    setUploadingId(courierId);
    try {
      const path = courier.logo_url.split('/logos/')[1];
      if (path) await supabase.storage.from('logos').remove([path]);

      const { error } = await supabase.from('couriers').update({ logo_url: null }).eq('id', courierId);
      if (error) throw error;

      toast({ title: 'Успех', description: 'Логото беше премахнато' });
      fetchCouriers();
    } catch (error: any) {
      toast({ title: 'Грешка', description: 'Неуспешно премахване на лого', variant: 'destructive' });
    } finally {
      setUploadingId(null);
    }
  };

  const startEditingPattern = (courier: Courier) => {
    setEditingPatternId(courier.id);
    setPatternValue(courier.url_pattern || '');
  };

  const handleSavePattern = async (courierId: string) => {
    setSavingPattern(true);
    try {
      const { error } = await supabase.from('couriers').update({ url_pattern: patternValue.trim() || null }).eq('id', courierId);
      if (error) throw error;

      toast({ title: 'Успех', description: 'URL шаблонът беше запазен' });
      setEditingPatternId(null);
      fetchCouriers();
    } catch (error: any) {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSavingPattern(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Куриерски фирми
          </CardTitle>
          <CardDescription>
            Добавете логата на куриерските фирми. Препоръчителен размер: <strong>100x40 пиксела</strong> (PNG с прозрачен фон).
            <br />
            <strong>URL шаблон</strong> - частта от домейна за разпознаване (напр. "econt.com", "speedy.bg")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Име на куриер (напр. DHL, TNT...)"
              value={newCourierName}
              onChange={(e) => setNewCourierName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCourier()}
            />
            <Button onClick={handleAddCourier} disabled={addingCourier}>
              {addingCourier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          <div className="space-y-3">
            {couriers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Няма добавени куриери</p>
            ) : (
              couriers.map((courier) => (
                <div key={courier.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-16 h-8 flex items-center justify-center bg-background rounded border overflow-hidden flex-shrink-0">
                        {courier.logo_url ? (
                          <img src={courier.logo_url} alt={courier.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium truncate">{courier.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[courier.id] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(courier.id, file);
                          e.target.value = '';
                        }}
                      />
                      
                      {courier.logo_url && (
                        <Button variant="outline" size="sm" onClick={() => handleRemoveLogo(courier.id)} disabled={uploadingId === courier.id} className="h-8 px-2">
                          {uploadingId === courier.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[courier.id]?.click()} disabled={uploadingId === courier.id} className="h-8">
                        {uploadingId === courier.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">{courier.logo_url ? 'Смени' : 'Качи'}</span>
                          </>
                        )}
                      </Button>

                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCourier(courier.id)} disabled={deletingId === courier.id} className="text-destructive hover:text-destructive h-8 px-2">
                        {deletingId === courier.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    {editingPatternId === courier.id ? (
                      <>
                        <Input
                          placeholder="напр. econt.com, speedy.bg"
                          value={patternValue}
                          onChange={(e) => setPatternValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePattern(courier.id)}
                          className="h-8 text-sm flex-1"
                          autoFocus
                        />
                        <Button variant="outline" size="sm" onClick={() => handleSavePattern(courier.id)} disabled={savingPattern}>
                          {savingPattern ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPatternId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <button
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left flex-1"
                        onClick={() => startEditingPattern(courier)}
                      >
                        {courier.url_pattern ? (
                          <span className="font-mono bg-muted px-2 py-1 rounded">{courier.url_pattern}</span>
                        ) : (
                          <span className="italic">Кликни за добавяне на URL шаблон</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Tracking Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Автоматично проследяване на пратки
          </CardTitle>
          <CardDescription>
            Активирайте автоматично проследяване за куриерите, които поддържат API. Системата ще проверява статуса на активните пратки и ще обновява поръчките автоматично.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {couriers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Първо добавете куриери по-горе</p>
          ) : (
            couriers.map((courier) => {
              const config = trackingConfigs[courier.id] || {
                courier_id: courier.id,
                is_enabled: false,
                polling_interval_minutes: 30,
                delivered_status_name: 'Доставена',
                returned_status_name: 'Върната',
              };

              return (
                <div key={courier.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {courier.logo_url && (
                        <img src={courier.logo_url} alt={courier.name} className="w-12 h-6 object-contain" />
                      )}
                      <span className="font-medium">{courier.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`tracking-${courier.id}`} className="text-sm text-muted-foreground">
                        {config.is_enabled ? 'Активно' : 'Изключено'}
                      </Label>
                      <Switch
                        id={`tracking-${courier.id}`}
                        checked={config.is_enabled}
                        onCheckedChange={(checked) =>
                          handleSaveTrackingConfig(courier.id, { is_enabled: checked })
                        }
                        disabled={savingTracking === courier.id}
                      />
                    </div>
                  </div>

                  {config.is_enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">При доставка, смени статуса на:</Label>
                        <Select
                          value={config.delivered_status_name}
                          onValueChange={(val) =>
                            handleSaveTrackingConfig(courier.id, { delivered_status_name: val })
                          }
                          disabled={savingTracking === courier.id}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">При връщане, смени статуса на:</Label>
                        <Select
                          value={config.returned_status_name}
                          onValueChange={(val) =>
                            handleSaveTrackingConfig(courier.id, { returned_status_name: val })
                          }
                          disabled={savingTracking === courier.id}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};