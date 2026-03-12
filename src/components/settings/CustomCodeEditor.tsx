import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Loader2, RotateCcw, ShieldAlert, FileCode, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Props {
  jsValue: string;
  htmlHeadValue: string;
  htmlBodyValue: string;
  onSaveJs: (value: string) => Promise<boolean>;
  onSaveHtmlHead: (value: string) => Promise<boolean>;
  onSaveHtmlBody: (value: string) => Promise<boolean>;
}

export const CustomCodeEditor: FC<Props> = ({
  jsValue, htmlHeadValue, htmlBodyValue,
  onSaveJs, onSaveHtmlHead, onSaveHtmlBody,
}) => {
  const [js, setJs] = useState(jsValue);
  const [htmlHead, setHtmlHead] = useState(htmlHeadValue);
  const [htmlBody, setHtmlBody] = useState(htmlBodyValue);
  const [savingField, setSavingField] = useState<string | null>(null);
  const { toast } = useToast();

  const save = async (field: string, fn: (v: string) => Promise<boolean>, value: string) => {
    setSavingField(field);
    const ok = await fn(value);
    setSavingField(null);
    toast({
      title: ok ? 'Успех' : 'Грешка',
      description: ok ? 'Кодът е запазен' : 'Неуспешно запазване',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          <strong>Внимание!</strong> Потребителският JavaScript и HTML код се изпълняват директно в браузъра. Добавяйте код само от доверени източници. Грешен код може да счупи сайта.
        </AlertDescription>
      </Alert>

      {/* Custom JavaScript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Потребителски JavaScript
          </CardTitle>
          <CardDescription>
            Добавете JavaScript код (analytics, tracking pixels, custom логика). Изпълнява се еднократно при зареждане.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={js}
            onChange={e => setJs(e.target.value)}
            placeholder={`// Google Analytics\ngtag('config', 'GA_MEASUREMENT_ID');\n\n// Custom логика\nconsole.log('Site loaded');`}
            className="font-mono text-sm min-h-[180px] bg-muted/30"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <Button onClick={() => save('js', onSaveJs, js)} disabled={!!savingField}>
              {savingField === 'js' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Запази JS
            </Button>
            <Button variant="outline" onClick={() => setJs('')}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Изчисти
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom HTML Head */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Потребителски HTML (Head)
          </CardTitle>
          <CardDescription>
            Meta тагове, external скриптове, link тагове — добавят се в &lt;head&gt; секцията.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={htmlHead}
            onChange={e => setHtmlHead(e.target.value)}
            placeholder={`<meta name="custom-meta" content="value" />\n<link rel="stylesheet" href="https://example.com/style.css" />`}
            className="font-mono text-sm min-h-[120px] bg-muted/30"
            spellCheck={false}
          />
          <Button onClick={() => save('head', onSaveHtmlHead, htmlHead)} disabled={!!savingField}>
            {savingField === 'head' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Запази HTML за Head
          </Button>
        </CardContent>
      </Card>

      {/* Custom HTML Body */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Потребителски HTML (Body)
          </CardTitle>
          <CardDescription>
            HTML съдържание, което се показва в началото на страницата (банери, уведомления, widgets).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={htmlBody}
            onChange={e => setHtmlBody(e.target.value)}
            placeholder={`<div style="background: #ff0; padding: 8px; text-align: center;">\n  ⚠️ Сайтът е в режим на поддръжка\n</div>`}
            className="font-mono text-sm min-h-[120px] bg-muted/30"
            spellCheck={false}
          />
          <Button onClick={() => save('body', onSaveHtmlBody, htmlBody)} disabled={!!savingField}>
            {savingField === 'body' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Запази HTML за Body
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
