import { FC, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Code, FileCode, Palette, Type, AlertTriangle, ShieldAlert } from 'lucide-react';
import { CustomCSSEditor } from './CustomCSSEditor';
import { CustomCodeEditor } from './CustomCodeEditor';
import { ExtendedColorPicker } from './ExtendedColorPicker';
import { TypographySettings } from './TypographySettings';
import { GlobalColorPicker } from './GlobalColorPicker';
import { useSiteCustomization } from '@/hooks/useSiteCustomization';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  isAdmin: boolean;
}

export const SiteCustomizationTab: FC<Props> = ({ isAdmin }) => {
  const { customization, loading, saveCustomization, saveMultiple, resetAllCustomCode } = useSiteCustomization();
  const { toast } = useToast();
  const [resetting, setResetting] = useState(false);

  const isSafe = new URLSearchParams(window.location.search).get('safe') === '1';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleEmergencyReset = async () => {
    setResetting(true);
    const ok = await resetAllCustomCode();
    setResetting(false);
    toast({
      title: ok ? 'Нулирано' : 'Грешка',
      description: ok ? 'Custom CSS, JS и HTML бяха изчистени.' : 'Неуспешно нулиране.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      {/* Safe mode banner */}
      {isSafe && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span><strong>Safe Mode активен</strong> — Custom CSS, JS и HTML не се зареждат. Премахнете <code>?safe=1</code> от URL-а за нормален режим.</span>
        </div>
      )}

      {/* Emergency reset */}
      {isAdmin && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <ShieldAlert className="w-5 h-5" />
            <span>Аварийно нулиране на целия custom код (CSS, JS, HTML)</span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={resetting}>
                {resetting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Нулирай всичко
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
                <AlertDialogDescription>
                  Това ще изтрие целия custom CSS, JavaScript и HTML код. Действието е необратимо. Ако сайтът не зарежда правилно, използвайте <code>?safe=1</code> параметър в URL-а преди да нулирате.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отказ</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmergencyReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Потвърди нулиране
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['colors', 'primary-color']} className="space-y-4">
        {/* Primary Color */}
        <AccordionItem value="primary-color" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <span className="font-medium">Основен цвят (Primary)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <GlobalColorPicker />
          </AccordionContent>
        </AccordionItem>

        {/* Extended Colors */}
        <AccordionItem value="colors" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <span className="font-medium">Разширена цветова палитра</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ExtendedColorPicker values={customization} onSave={saveMultiple} />
          </AccordionContent>
        </AccordionItem>

        {/* Typography */}
        <AccordionItem value="typography" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              <span className="font-medium">Типография и размери</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <TypographySettings
              fontFamily={customization.custom_font_family || ''}
              headingFont={customization.custom_heading_font || ''}
              fontSize={customization.custom_font_size || ''}
              borderRadius={customization.custom_border_radius || ''}
              onSave={saveMultiple}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Custom CSS */}
        <AccordionItem value="css" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              <span className="font-medium">Custom CSS</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <CustomCSSEditor value={customization.custom_css || ''} onSave={v => saveCustomization('custom_css', v)} />
          </AccordionContent>
        </AccordionItem>

        {/* Custom JS/HTML - Admin Only */}
        {isAdmin && (
          <AccordionItem value="code" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-destructive" />
                <span className="font-medium">Custom JavaScript & HTML</span>
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Само админ</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <CustomCodeEditor
                jsValue={customization.custom_js || ''}
                htmlHeadValue={customization.custom_html_head || ''}
                htmlBodyValue={customization.custom_html_body || ''}
                onSaveJs={v => saveCustomization('custom_js', v)}
                onSaveHtmlHead={v => saveCustomization('custom_html_head', v)}
                onSaveHtmlBody={v => saveCustomization('custom_html_body', v)}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
