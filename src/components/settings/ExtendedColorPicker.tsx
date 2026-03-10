import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ColorField {
  key: string;
  label: string;
  description: string;
}

const COLOR_FIELDS: ColorField[] = [
  { key: 'custom_colors_secondary', label: 'Secondary (вторичен)', description: 'Вторичен цвят за бутони и елементи' },
  { key: 'custom_colors_destructive', label: 'Destructive (червен)', description: 'Цвят за грешки и изтриване' },
  { key: 'custom_colors_muted', label: 'Muted (приглушен)', description: 'Фон за приглушени секции' },
  { key: 'custom_colors_border', label: 'Border (рамка)', description: 'Цвят на рамките' },
  { key: 'custom_colors_card', label: 'Card (карта)', description: 'Фон на картите' },
  { key: 'custom_colors_success', label: 'Success (зелен)', description: 'Цвят за успешни действия' },
  { key: 'custom_colors_warning', label: 'Warning (жълт)', description: 'Цвят за предупреждения' },
];

interface Props {
  values: Record<string, string>;
  onSave: (updates: Record<string, string>) => Promise<boolean>;
}

export const ExtendedColorPicker: FC<Props> = ({ values, onSave }) => {
  const [colors, setColors] = useState<Record<string, string>>({ ...values });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const changed: Record<string, string> = {};
    COLOR_FIELDS.forEach(f => {
      if (colors[f.key] && colors[f.key] !== values[f.key]) {
        changed[f.key] = colors[f.key];
      }
    });

    if (Object.keys(changed).length === 0) {
      toast({ title: 'Няма промени', description: 'Не са направени промени в цветовете' });
      setSaving(false);
      return;
    }

    const ok = await onSave(changed);
    setSaving(false);
    toast({
      title: ok ? 'Успех' : 'Грешка',
      description: ok ? 'Цветовете са обновени' : 'Неуспешно запазване',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Разширена цветова палитра
        </CardTitle>
        <CardDescription>
          Настройте допълнителни цветове освен основния (primary). Промените се прилагат веднага.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(field => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm font-medium">{field.label}</Label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-md border shrink-0"
                  style={{ backgroundColor: colors[field.key] || '#cccccc' }}
                />
                <Input
                  value={colors[field.key] || ''}
                  onChange={e => setColors(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder="#hex"
                  className="font-mono text-sm"
                  maxLength={7}
                />
                <input
                  type="color"
                  value={colors[field.key] || '#cccccc'}
                  onChange={e => setColors(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer shrink-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">{field.description}</p>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Запази цветове
        </Button>
      </CardContent>
    </Card>
  );
};
