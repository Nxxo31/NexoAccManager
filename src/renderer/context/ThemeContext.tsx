import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeId = 'dark' | 'light' | 'roblox-classic' | 'custom';
export type FontSize = 'small' | 'medium' | 'large';
export type UiDensity = 'compact' | 'normal' | 'spacious';

export interface ThemeSettings {
  theme: ThemeId;
  fontSize: FontSize;
  uiDensity: UiDensity;
  animationsEnabled: boolean;
  primaryColor?: string;
  accentColor?: string;
}

export interface ThemeContextType {
  settings: ThemeSettings | null;
  css: Record<string, string> | null;
  loading: boolean;
  setTheme: (partial: Partial<ThemeSettings>) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType>({
  settings: null,
  css: null,
  loading: true,
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  const [css, setCss] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to apply CSS variables
  const applyCss = (variables: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  // Load theme on mount (reuse stored or fetch)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await (window as any).api.theme.get();
        if (cancelled) return;
        // El handler retorna { settings, css } directamente (sin wrapper ok())
        if (result && result.settings) {
          setSettings(result.settings);
          if (result.css) {
            setCss(result.css);
            applyCss(result.css);
          }
        }
      } catch (e) {
        console.error('Failed to fetch theme:', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setTheme = async (partial: Partial<ThemeSettings>) => {
    const result = await (window as any).api.theme.set(partial);
    if (result && result.settings) {
      setSettings(result.settings);
      if (result.css) {
        setCss(result.css);
        applyCss(result.css);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ settings, css, loading, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
