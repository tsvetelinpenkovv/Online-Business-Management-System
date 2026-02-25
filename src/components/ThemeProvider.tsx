import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const userLoadedRef = useRef(false);

  // On mount & auth change, load theme from user_preferences
  useEffect(() => {
    const loadUserTheme = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !userLoadedRef.current) {
        const { data } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (data?.theme && (data.theme === 'dark' || data.theme === 'light')) {
          setThemeState(data.theme as Theme);
          localStorage.setItem(storageKey, data.theme);
        }
        userLoadedRef.current = true;
      }
    };

    loadUserTheme();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        userLoadedRef.current = false;
        loadUserTheme();
      }
      if (event === 'SIGNED_OUT') {
        userLoadedRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);

    // Save to user_preferences in background
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const themeValue = newTheme === 'system' ? 'light' : newTheme;
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          theme: themeValue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }
  }, [storageKey]);

  const value = { theme, setTheme };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
