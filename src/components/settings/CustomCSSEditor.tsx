import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Code, Save, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  value: string;
  onSave: (value: string) => Promise<boolean>;
}

export const CustomCSSEditor: FC<Props> = ({ value, onSave }) => {
  const [css, setCss] = useState(value);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(css);
    setSaving(false);
    toast({
      title: ok ? 'Успех' : 'Грешка',
      description: ok ? 'CSS кодът е приложен' : 'Неуспешно запазване',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Custom CSS
        </CardTitle>
        <CardDescription>
          Добавете произволен CSS код, който ще се приложи глобално на сайта. Промените са видими веднага.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={css}
          onChange={e => setCss(e.target.value)}
          placeholder={`/* Примерен CSS */\n.my-class {\n  color: red;\n  font-size: 16px;\n}\n\n/* Скриване на елемент */\n.some-element {\n  display: none !important;\n}`}
          className="font-mono text-sm min-h-[250px] bg-muted/30"
          spellCheck={false}
        />
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Запази CSS
          </Button>
          <Button variant="outline" onClick={() => setCss('')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Изчисти
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
