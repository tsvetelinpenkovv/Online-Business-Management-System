import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Convert hex to HSL
const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Get current theme mode
const getCurrentTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// Apply color to CSS variables
const applyGlobalColor = (lightHsl: string, darkHsl: string) => {
  const root = document.documentElement;
  const currentTheme = getCurrentTheme();
  const hsl = currentTheme === 'dark' ? darkHsl : lightHsl;
  
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--accent', hsl);
  root.style.setProperty('--ring', hsl);
  root.style.setProperty('--sidebar-primary', hsl);
  root.style.setProperty('--sidebar-ring', hsl);
};

export const useGlobalColor = () => {
  const [globalColor, setGlobalColor] = useState<string>('#2463eb');
  const [darkModeColor, setDarkModeColor] = useState<string>('#3b82f6');
  const [loading, setLoading] = useState(true);

  // Apply colors on theme change
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const lightHsl = hexToHsl(globalColor);
      const darkHsl = hexToHsl(darkModeColor);
      applyGlobalColor(lightHsl, darkHsl);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [globalColor, darkModeColor]);

  // Load colors from database on mount
  useEffect(() => {
    const loadColors = async () => {
      try {
        const { data: lightData } = await supabase
          .from('api_settings')
          .select('setting_value')
          .eq('setting_key', 'global_primary_color')
          .maybeSingle();

        const { data: darkData } = await supabase
          .from('api_settings')
          .select('setting_value')
          .eq('setting_key', 'global_dark_mode_color')
          .maybeSingle();

        const lightColor = lightData?.setting_value || '#2463eb';
        const darkColor = darkData?.setting_value || '#3b82f6';
        
        setGlobalColor(lightColor);
        setDarkModeColor(darkColor);
        
        const lightHsl = hexToHsl(lightColor);
        const darkHsl = hexToHsl(darkColor);
        applyGlobalColor(lightHsl, darkHsl);
      } catch (error) {
        console.error('Error loading global colors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadColors();
  }, []);

  const saveColor = useCallback(async (color: string, mode: 'light' | 'dark' = 'light') => {
    try {
      if (mode === 'light') {
        setGlobalColor(color);
      } else {
        setDarkModeColor(color);
      }
      
      const lightHsl = hexToHsl(mode === 'light' ? color : globalColor);
      const darkHsl = hexToHsl(mode === 'dark' ? color : darkModeColor);
      applyGlobalColor(lightHsl, darkHsl);

      const settingKey = mode === 'light' ? 'global_primary_color' : 'global_dark_mode_color';
      
      await supabase
        .from('api_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: color,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

      return true;
    } catch (error) {
      console.error('Error saving global color:', error);
      return false;
    }
  }, [globalColor, darkModeColor]);

  return { globalColor, darkModeColor, saveColor, loading };
};
