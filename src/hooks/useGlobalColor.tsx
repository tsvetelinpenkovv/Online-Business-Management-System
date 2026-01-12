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

// Apply color to CSS variables
const applyGlobalColor = (hsl: string) => {
  const root = document.documentElement;
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--accent', hsl);
  root.style.setProperty('--ring', hsl);
  root.style.setProperty('--sidebar-primary', hsl);
  root.style.setProperty('--sidebar-ring', hsl);
};

export const useGlobalColor = () => {
  const [globalColor, setGlobalColor] = useState<string>('#2463eb');
  const [loading, setLoading] = useState(true);

  // Load color from database on mount
  useEffect(() => {
    const loadColor = async () => {
      try {
        const { data } = await supabase
          .from('api_settings')
          .select('setting_value')
          .eq('setting_key', 'global_primary_color')
          .maybeSingle();

        if (data?.setting_value) {
          setGlobalColor(data.setting_value);
          const hsl = hexToHsl(data.setting_value);
          applyGlobalColor(hsl);
        }
      } catch (error) {
        console.error('Error loading global color:', error);
      } finally {
        setLoading(false);
      }
    };

    loadColor();
  }, []);

  const saveColor = useCallback(async (color: string) => {
    try {
      setGlobalColor(color);
      const hsl = hexToHsl(color);
      applyGlobalColor(hsl);

      await supabase
        .from('api_settings')
        .upsert({
          setting_key: 'global_primary_color',
          setting_value: color,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

      return true;
    } catch (error) {
      console.error('Error saving global color:', error);
      return false;
    }
  }, []);

  return { globalColor, saveColor, loading };
};
