import { createContext, useContext, useEffect, useState, useCallback } from "react";

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function fetchThemeFromIP(): Promise<Theme | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/theme-preference`, {
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.theme as Theme | null;
  } catch {
    return null;
  }
}

async function saveThemeToIP(theme: Theme): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/theme-preference`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: theme === 'system' ? 'light' : theme }),
    });
  } catch {
    // silent fail
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [ipLoaded, setIpLoaded] = useState(false);

  // On mount, fetch theme from IP if no local preference exists
  useEffect(() => {
    const localTheme = localStorage.getItem(storageKey);
    if (!localTheme) {
      fetchThemeFromIP().then((ipTheme) => {
        if (ipTheme && (ipTheme === 'dark' || ipTheme === 'light')) {
          setThemeState(ipTheme);
          localStorage.setItem(storageKey, ipTheme);
        }
        setIpLoaded(true);
      });
    } else {
      setIpLoaded(true);
    }
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

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
    // Save to IP in background
    saveThemeToIP(newTheme);
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
