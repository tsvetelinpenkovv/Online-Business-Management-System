import { FC, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Bell, Volume2, Play, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const NOTIFICATION_SOUNDS = [
  { id: 'chime', name: 'Звънец', frequency: [523, 659, 784], duration: 150 },
  { id: 'ding', name: 'Динг', frequency: [880], duration: 200 },
  { id: 'double-beep', name: 'Двоен бийп', frequency: [660, 880], duration: 120 },
  { id: 'alert', name: 'Сигнал', frequency: [440, 554, 660], duration: 100 },
  { id: 'soft', name: 'Мек тон', frequency: [392], duration: 300 },
  { id: 'urgent', name: 'Спешен', frequency: [880, 1100, 880, 1100], duration: 80 },
];

const STORAGE_KEY = 'notification_settings';

interface NotificationSettings {
  enabled: boolean;
  soundId: string;
  volume: number;
  browserNotifications: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  soundId: 'chime',
  volume: 70,
  browserNotifications: false,
};

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {}
  return defaultSettings;
};

export const playNotificationSound = (settingsOverride?: NotificationSettings) => {
  const settings = settingsOverride || getNotificationSettings();
  if (!settings.enabled) return;

  const sound = NOTIFICATION_SOUNDS.find(s => s.id === settings.soundId) || NOTIFICATION_SOUNDS[0];
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const volume = settings.volume / 100;

  sound.frequency.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume * 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const startTime = ctx.currentTime + (i * sound.duration) / 1000;
    const endTime = startTime + sound.duration / 1000;

    osc.start(startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);
    osc.stop(endTime + 0.05);
  });
};

export const NotificationSoundSettings: FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);

  const saveSettings = (updated: NotificationSettings) => {
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleTestSound = () => {
    playNotificationSound(settings);
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        saveSettings({ ...settings, browserNotifications: true });
        new Notification('🔔 Известия активирани', {
          body: 'Ще получавате известия при нови поръчки.',
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Известия за нови поръчки
        </CardTitle>
        <CardDescription>
          Настройте звукови и браузър известия при постъпване на нови поръчки в реално време
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Звукови известия</Label>
            <p className="text-sm text-muted-foreground">Възпроизвеждане на звук при нова поръчка</p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => saveSettings({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Sound selection */}
            <div className="space-y-2">
              <Label>Избор на звук</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={settings.soundId}
                  onValueChange={(val) => saveSettings({ ...settings, soundId: val })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_SOUNDS.map((sound) => (
                      <SelectItem key={sound.id} value={sound.id}>
                        {sound.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleTestSound} title="Тествай звука">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Сила на звука
                </Label>
                <span className="text-sm text-muted-foreground">{settings.volume}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([val]) => saveSettings({ ...settings, volume: val })}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Browser notifications */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <Label>Браузър известия</Label>
            <p className="text-sm text-muted-foreground">Push известия дори когато табът не е на фокус</p>
          </div>
          {settings.browserNotifications ? (
            <Switch
              checked={settings.browserNotifications}
              onCheckedChange={(checked) => saveSettings({ ...settings, browserNotifications: checked })}
            />
          ) : (
            <Button variant="outline" size="sm" onClick={requestBrowserPermission}>
              Активирай
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const OverduePaymentSettings: FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'overdue_payments_enabled')
        .maybeSingle();
      setEnabled(data?.setting_value === 'true');
      setLoading(false);
    };
    fetch();
  }, []);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    setSaving(true);
    await supabase
      .from('api_settings')
      .upsert({
        setting_key: 'overdue_payments_enabled',
        setting_value: String(checked),
      }, { onConflict: 'setting_key' });
    setSaving(false);
    toast({
      title: checked ? 'Активирано' : 'Деактивирано',
      description: checked
        ? 'Известията за просрочени плащания са включени'
        : 'Известията за просрочени плащания са изключени',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Просрочени плащания
        </CardTitle>
        <CardDescription>
          Известия за поръчки с неплатен статус повече от 7 дни
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <Label>Активирай известия за просрочени плащания</Label>
            <p className="text-sm text-muted-foreground">
              Системата ще проверява периодично за неплатени поръчки
            </p>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Switch checked={enabled} onCheckedChange={handleToggle} disabled={saving} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
