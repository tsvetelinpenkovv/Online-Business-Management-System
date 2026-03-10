import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Type, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POPULAR_FONTS = [
  'System Default',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Raleway',
  'Source Sans 3',
  'PT Sans',
  'Noto Sans',
  'Ubuntu',
  'Rubik',
  'Work Sans',
  'Fira Sans',
  'Mulish',
  'Manrope',
  'DM Sans',
  'Plus Jakarta Sans',
];

interface Props {
  fontFamily: string;
  headingFont: string;
  fontSize: string;
  borderRadius: string;
  onSave: (updates: Record<string, string>) => Promise<boolean>;
}

export const TypographySettings: FC<Props> = ({
  fontFamily, headingFont, fontSize, borderRadius, onSave,
}) => {
  const [font, setFont] = useState(fontFamily || 'System Default');
  const [hFont, setHFont] = useState(headingFont || 'System Default');
  const [size, setSize] = useState(fontSize ? parseInt(fontSize) : 16);
  const [radius, setRadius] = useState(borderRadius ? parseFloat(borderRadius) : 0.5);
  const [customFont, setCustomFont] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, string> = {};
    
    const selectedFont = font === 'System Default' ? '' : font;
    const selectedHFont = hFont === 'System Default' ? '' : hFont;
    
    updates.custom_font_family = selectedFont;
    updates.custom_heading_font = selectedHFont;
    updates.custom_font_size = size.toString();
    updates.custom_border_radius = radius.toString();

    const ok = await onSave(updates);
    setSaving(false);
    toast({
      title: ok ? 'Успех' : 'Грешка',
      description: ok ? 'Типографията е обновена' : 'Неуспешно запазване',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const fontOptions = customFont && !POPULAR_FONTS.includes(customFont)
    ? [...POPULAR_FONTS, customFont]
    : POPULAR_FONTS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          Типография и размери
        </CardTitle>
        <CardDescription>
          Изберете шрифтове от Google Fonts, базов размер и закръгляне на ъглите.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Body Font */}
        <div className="space-y-2">
          <Label>Основен шрифт (Body)</Label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map(f => (
                <SelectItem key={f} value={f} style={{ fontFamily: f === 'System Default' ? 'inherit' : f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 mt-1">
            <Input
              value={customFont}
              onChange={e => setCustomFont(e.target.value)}
              placeholder="Или въведете име на Google Font..."
              className="text-sm"
            />
            {customFont && (
              <Button size="sm" variant="outline" onClick={() => { setFont(customFont); setCustomFont(''); }}>
                Използвай
              </Button>
            )}
          </div>
        </div>

        {/* Heading Font */}
        <div className="space-y-2">
          <Label>Шрифт за заглавия (Headings)</Label>
          <Select value={hFont} onValueChange={setHFont}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map(f => (
                <SelectItem key={f} value={f} style={{ fontFamily: f === 'System Default' ? 'inherit' : f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <Label>Базов размер на шрифта: {size}px</Label>
          <Slider
            value={[size]}
            onValueChange={([v]) => setSize(v)}
            min={12}
            max={20}
            step={1}
          />
          <p className="text-xs text-muted-foreground">Стандартен: 16px. Промяната засяга всички rem-базирани размери.</p>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <Label>Закръгляне на ъглите: {radius}rem</Label>
          <Slider
            value={[radius]}
            onValueChange={([v]) => setRadius(v)}
            min={0}
            max={1.5}
            step={0.05}
          />
          <div className="flex gap-3 mt-2">
            {[0, 0.25, 0.5, 0.75, 1].map(r => (
              <div
                key={r}
                onClick={() => setRadius(r)}
                className="w-12 h-12 border-2 bg-primary/10 cursor-pointer hover:border-primary transition-colors"
                style={{ borderRadius: `${r}rem` }}
                title={`${r}rem`}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
          <Label>Преглед</Label>
          <p style={{
            fontFamily: font === 'System Default' ? 'inherit' : `"${font}", sans-serif`,
            fontSize: `${size}px`,
          }}>
            Примерен текст с избрания шрифт и размер. Бързата кафява лисица прескача мързеливото куче.
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" style={{ borderRadius: `${radius}rem` }}>Бутон</Button>
            <Button size="sm" variant="outline" style={{ borderRadius: `${radius}rem` }}>Контурен</Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Запази типография
        </Button>
      </CardContent>
    </Card>
  );
};
