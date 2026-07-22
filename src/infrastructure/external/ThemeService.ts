// Infrastructure: ThemeService — CSS variables + theme system

export type ThemeId = 'dark' | 'light';

interface ThemeColors {
  bg: string;
  bgCard: string;
  bgSurface: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  primaryHover: string;
}

const THEMES: Record<ThemeId, ThemeColors> = {
  dark: {
    bg: '#0d0d1a',
    bgCard: '#1a1a2e',
    bgSurface: '#16213e',
    bgElevated: '#2a2a4e',
    textPrimary: '#eee',
    textSecondary: '#aaa',
    textTertiary: '#666',
    border: '#2a2a4e',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
  },
  light: {
    bg: '#f8fafc',
    bgCard: '#ffffff',
    bgSurface: '#f1f5f9',
    bgElevated: '#e2e8f0',
    textPrimary: '#1a1a2e',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
  },
};

export function generateThemeCSS(theme: ThemeId): string {
  const c = THEMES[theme];
  return [
    `--bg: ${c.bg}`,
    `--bg-card: ${c.bgCard}`,
    `--bg-surface: ${c.bgSurface}`,
    `--bg-elevated: ${c.bgElevated}`,
    `--text-primary: ${c.textPrimary}`,
    `--text-secondary: ${c.textSecondary}`,
    `--text-tertiary: ${c.textTertiary}`,
    `--border: ${c.border}`,
    `--primary: ${c.primary}`,
    `--primary-hover: ${c.primaryHover}`,
  ].join(';');
}

export function applyTheme(theme: ThemeId): void {
  const css = generateThemeCSS(theme);
  const root = document.documentElement;
  root.style.cssText += `;${css}`;
}

export { THEMES };
