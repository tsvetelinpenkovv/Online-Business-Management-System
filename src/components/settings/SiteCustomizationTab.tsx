import { FC } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Code, FileCode, Palette, Type, Globe } from 'lucide-react';
import { CustomCSSEditor } from './CustomCSSEditor';
import { CustomCodeEditor } from './CustomCodeEditor';
import { ExtendedColorPicker } from './ExtendedColorPicker';
import { TypographySettings } from './TypographySettings';
import { GlobalColorPicker } from './GlobalColorPicker';
import { useSiteCustomization } from '@/hooks/useSiteCustomization';
import { Loader2 } from 'lucide-react';

interface Props {
  isAdmin: boolean;
}

export const SiteCustomizationTab: FC<Props> = ({ isAdmin }) => {
  const { customization, loading, saveCustomization, saveMultiple } = useSiteCustomization();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['colors', 'primary-color']} className="space-y-4">
        {/* Primary Color (existing) */}
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
            <ExtendedColorPicker
              values={customization}
              onSave={saveMultiple}
            />
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
            <CustomCSSEditor
              value={customization.custom_css || ''}
              onSave={v => saveCustomization('custom_css', v)}
            />
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
