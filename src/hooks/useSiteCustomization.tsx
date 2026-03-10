import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CUSTOMIZATION_KEYS = [
  'custom_css',
  'custom_js',
  'custom_html_head',
  'custom_html_body',
  'custom_font_family',
  'custom_font_size',
  'custom_heading_font',
  'custom_border_radius',
  'custom_colors_secondary',
  'custom_colors_destructive',
  'custom_colors_success',
  'custom_colors_warning',
  'custom_colors_muted',
  'custom_colors_border',
  'custom_colors_card',
  'custom_spacing_base',
  'custom_sidebar_width',
  'custom_layout_hide_footer',
  'custom_layout_hide_sidebar_icons',
] as const;

export type CustomizationKey = typeof CUSTOMIZATION_KEYS[number];

export interface SiteCustomization {
  [key: string]: string;
}

// Hex to HSL conversion
const hexToHsl = (hex: string): string | null => {
  hex = hex.replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return null;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const applyCustomizations = (data: SiteCustomization) => {
  // 1. Custom CSS
  let styleEl = document.getElementById('site-custom-css') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'site-custom-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = data.custom_css || '';

  // 2. Custom Font
  if (data.custom_font_family) {
    let fontLink = document.getElementById('site-custom-font') as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'site-custom-font';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    const fontName = data.custom_font_family;
    fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
    document.documentElement.style.setProperty('--font-sans', `"${fontName}", system-ui, sans-serif`);
  }

  if (data.custom_heading_font) {
    let fontLink = document.getElementById('site-custom-heading-font') as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'site-custom-heading-font';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(data.custom_heading_font)}:wght@400;500;600;700&display=swap`;
  }

  // 3. Font size
  if (data.custom_font_size) {
    document.documentElement.style.fontSize = `${data.custom_font_size}px`;
  }

  // 4. Border radius
  if (data.custom_border_radius) {
    document.documentElement.style.setProperty('--radius', `${data.custom_border_radius}rem`);
  }

  // 5. Custom colors
  const colorMap: Record<string, string> = {
    custom_colors_secondary: '--secondary',
    custom_colors_destructive: '--destructive',
    custom_colors_muted: '--muted',
    custom_colors_border: '--border',
    custom_colors_card: '--card',
  };
  Object.entries(colorMap).forEach(([key, cssVar]) => {
    if (data[key]) {
      const hsl = hexToHsl(data[key]);
      if (hsl) document.documentElement.style.setProperty(cssVar, hsl);
    }
  });

  // 6. Custom HTML head
  if (data.custom_html_head) {
    let headContainer = document.getElementById('site-custom-html-head');
    if (!headContainer) {
      headContainer = document.createElement('div');
      headContainer.id = 'site-custom-html-head';
      document.head.appendChild(headContainer);
    }
    headContainer.innerHTML = data.custom_html_head;
  }

  // 7. Custom JS (only execute once)
  if (data.custom_js) {
    const existingScript = document.getElementById('site-custom-js');
    if (!existingScript) {
      try {
        const script = document.createElement('script');
        script.id = 'site-custom-js';
        script.textContent = data.custom_js;
        document.body.appendChild(script);
      } catch (e) {
        console.error('Custom JS error:', e);
      }
    }
  }
};

export const useSiteCustomization = () => {
  const [customization, setCustomization] = useState<SiteCustomization>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('api_settings')
          .select('setting_key, setting_value')
          .in('setting_key', CUSTOMIZATION_KEYS as unknown as string[]);

        if (error) {
          console.error('Error loading site customization:', error);
          return;
        }

        const map: SiteCustomization = {};
        data?.forEach(row => {
          if (row.setting_value) map[row.setting_key] = row.setting_value;
        });

        setCustomization(map);
        applyCustomizations(map);
      } catch (e) {
        console.error('Site customization error:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveCustomization = useCallback(async (key: string, value: string) => {
    try {
      await supabase
        .from('api_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

      setCustomization(prev => {
        const next = { ...prev, [key]: value };
        applyCustomizations(next);
        return next;
      });
      return true;
    } catch (e) {
      console.error('Error saving customization:', e);
      return false;
    }
  }, []);

  const saveMultiple = useCallback(async (updates: Record<string, string>) => {
    try {
      const rows = Object.entries(updates).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        await supabase
          .from('api_settings')
          .upsert(row, { onConflict: 'setting_key' });
      }

      setCustomization(prev => {
        const next = { ...prev, ...updates };
        applyCustomizations(next);
        return next;
      });
      return true;
    } catch (e) {
      console.error('Error saving customizations:', e);
      return false;
    }
  }, []);

  return { customization, loading, saveCustomization, saveMultiple };
};
