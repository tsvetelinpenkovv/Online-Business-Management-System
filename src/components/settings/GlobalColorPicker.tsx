import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Check, Loader2, Sun, Moon } from 'lucide-react';
import { useGlobalColor } from '@/hooks/useGlobalColor';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PRESET_COLORS = [
  { name: 'Син', value: '#2463eb' },
  { name: 'Червен', value: '#dc2626' },
  { name: 'Зелен', value: '#16a34a' },
  { name: 'Жълт', value: '#ca8a04' },
  { name: 'Лилав', value: '#9333ea' },
  { name: 'Розов', value: '#db2777' },
  { name: 'Тюркоаз', value: '#0891b2' },
  { name: 'Оранжев', value: '#ea580c' },
  { name: 'Черен', value: '#171717' },
];

export const GlobalColorPicker: FC = () => {
  const { globalColor, darkModeColor, saveColor, loading } = useGlobalColor();
  const [customLightColor, setCustomLightColor] = useState(globalColor);
  const [customDarkColor, setCustomDarkColor] = useState(darkModeColor);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCustomLightColor(globalColor);
  }, [globalColor]);

  useEffect(() => {
    setCustomDarkColor(darkModeColor);
  }, [darkModeColor]);

  const handleColorChange = async (color: string, mode: 'light' | 'dark') => {
    setSaving(true);
    if (mode === 'light') {
      setCustomLightColor(color);
    } else {
      setCustomDarkColor(color);
    }
    const success = await saveColor(color, mode);
    setSaving(false);
    
    if (success) {
      toast({
        title: 'Успех',
        description: `Цветът за ${mode === 'light' ? 'светла' : 'тъмна'} тема е обновен`,
      });
    } else {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на цвета',
        variant: 'destructive',
      });
    }
  };

  const handleCustomColorApply = async (mode: 'light' | 'dark') => {
    const color = mode === 'light' ? customLightColor : customDarkColor;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      await handleColorChange(color, mode);
    } else {
      toast({
        title: 'Грешка',
        description: 'Невалиден цветови код. Използвайте формат #RRGGBB',
        variant: 'destructive',
      });
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

  const renderColorPicker = (mode: 'light' | 'dark') => {
    const currentColor = mode === 'light' ? globalColor : darkModeColor;
    const customColor = mode === 'light' ? customLightColor : customDarkColor;
    const setCustomColor = mode === 'light' ? setCustomLightColor : setCustomDarkColor;
    
    return (
      <div className="space-y-6">
        {/* Preset colors */}
        <div className="space-y-3">
          <Label>Готови цветове</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleColorChange(preset.value, mode)}
                disabled={saving}
                className="relative w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ 
                  backgroundColor: preset.value,
                  borderColor: currentColor === preset.value ? 'white' : 'transparent',
                  boxShadow: currentColor === preset.value ? `0 0 0 2px ${preset.value}` : undefined
                }}
                title={preset.name}
              >
                {currentColor === preset.value && (
                  <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom color */}
        <div className="space-y-3">
          <Label htmlFor={`custom-color-${mode}`}>Персонализиран цвят (HEX код)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded border"
                style={{ backgroundColor: customColor }}
              />
              <Input
                id={`custom-color-${mode}`}
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#2463eb"
                className="pl-10 font-mono"
                maxLength={7}
              />
            </div>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-10 h-10 rounded-lg border cursor-pointer"
            />
            <Button 
              onClick={() => handleCustomColorApply(mode)} 
              disabled={saving || customColor === currentColor}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Приложи'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Въведете HEX код (напр. #2463eb) или използвайте color picker-а
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Преглед</Label>
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Примерен бутон</Button>
              <Button size="sm" variant="outline">Контурен бутон</Button>
            </div>
            <div 
              className="px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"
              style={{ backgroundColor: `${currentColor}20`, color: currentColor }}
            >
              Примерен статус
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Глобален цвят
        </CardTitle>
        <CardDescription>
          Изберете основния цвят на интерфейса. Можете да зададете различен цвят за светла и тъмна тема.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="light" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="light" className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Светла тема
            </TabsTrigger>
            <TabsTrigger value="dark" className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Тъмна тема
            </TabsTrigger>
          </TabsList>
          <TabsContent value="light">
            {renderColorPicker('light')}
          </TabsContent>
          <TabsContent value="dark">
            {renderColorPicker('dark')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
