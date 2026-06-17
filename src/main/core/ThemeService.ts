import { DatabaseManager } from '../storage/DatabaseManager';

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

const DEFAULT_THEME: ThemeSettings = {
  theme: 'dark',
  fontSize: 'medium',
  uiDensity: 'normal',
  animationsEnabled: true,
};

export class ThemeService {
  private readonly db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  getSettings(): ThemeSettings {
    try {
      const theme = this.db.getSetting('theme') as ThemeId || DEFAULT_THEME.theme;
      const fontSize = this.db.getSetting('fontSize') as FontSize || DEFAULT_THEME.fontSize;
      const uiDensity = this.db.getSetting('uiDensity') as UiDensity || DEFAULT_THEME.uiDensity;
      const animationsEnabled = this.db.getSetting('animationsEnabled') === 'true' || DEFAULT_THEME.animationsEnabled;
      const primaryColor = this.db.getSetting('primaryColor');
      const accentColor = this.db.getSetting('accentColor');

      return {
        theme,
        fontSize,
        uiDensity,
        animationsEnabled,
        ...(primaryColor !== undefined ? { primaryColor } : {}),
        ...(accentColor !== undefined ? { accentColor } : {}),
      };
    } catch (e) {
      console.error('Error loading theme settings, using defaults:', e);
      return DEFAULT_THEME;
    }
  }

  setSettings(settings: Partial<ThemeSettings>): ThemeSettings {
    const current = this.getSettings();
    const merged = { ...current, ...settings };

    // Validate and store each setting individually
    if (merged.theme !== undefined) {
      this.db.setSetting('theme', merged.theme);
    }
    if (merged.fontSize !== undefined) {
      this.db.setSetting('fontSize', merged.fontSize);
    }
    if (merged.uiDensity !== undefined) {
      this.db.setSetting('uiDensity', merged.uiDensity);
    }
    if (merged.animationsEnabled !== undefined) {
      this.db.setSetting('animationsEnabled', merged.animationsEnabled ? 'true' : 'false');
    }
    if (merged.primaryColor !== undefined) {
      this.db.setSetting('primaryColor', merged.primaryColor);
    }
    if (merged.accentColor !== undefined) {
      this.db.setSetting('accentColor', merged.accentColor);
    }

    return merged;
  }

  getThemeCSS(): Record<string, string> {
    const settings = this.getSettings();
    return generateThemeCSS(settings);
  }
}

export const themeDefinitions: Record<ThemeId, Record<string, string>> = {
  dark: {
    '--primary': '#DE350D',
    '--primary-dark': '#B22A0A',
    '--accent': '#6347FF',
    '--accent-light': '#8B6FFF',
    '--bg-dark': '#0D0D0D',
    '--bg-card': '#161616',
    '--bg-surface': '#1E1E1E',
    '--text-primary': '#FFFFFF',
    '--text-secondary': '#A0A0A0',
    '--success': '#2ED573',
    '--warning': '#FFA502',
    '--error': '#FF4757',
    '--border': '#2A2A2A',
  },
  light: {
    '--primary': '#DE350D',
    '--primary-dark': '#B22A0A',
    '--accent': '#6347FF',
    '--accent-light': '#8B6FFF',
    '--bg-dark': '#F5F5F5',
    '--bg-card': '#FFFFFF',
    '--bg-surface': '#EEEEEE',
    '--text-primary': '#1A1A1A',
    '--text-secondary': '#6B6B6B',
    '--success': '#27AE60',
    '--warning': '#E67E22',
    '--error': '#E74C3C',
    '--border': '#D0D0D0',
  },
  'roblox-classic': {
    '--primary': '#DE350D',
    '--primary-dark': '#B22A0A',
    '--accent': '#FFAB00',
    '--accent-light': '#FFC400',
    '--bg-dark': '#111111',
    '--bg-card': '#1A1A1A',
    '--bg-surface': '#222222',
    '--text-primary': '#FFFFFF',
    '--text-secondary': '#CCCCCC',
    '--success': '#2ED573',
    '--warning': '#FFAB00',
    '--error': '#FF4757',
    '--border': '#333333',
  },
  custom: {
    // Only for Enterprise, colors are set dynamically
    '--primary': '#DE350D',
    '--primary-dark': '#B22A0A',
    '--accent': '#6347FF',
    '--accent-light': '#8B6FFF',
    '--bg-dark': '#0D0D0D',
    '--bg-card': '#161616',
    '--bg-surface': '#1E1E1E',
    '--text-primary': '#FFFFFF',
    '--text-secondary': '#A0A0A0',
    '--success': '#2ED573',
    '--warning': '#FFA502',
    '--error': '#FF4757',
    '--border': '#2A2A2A',
  },
};

export function generateThemeCSS(settings: ThemeSettings): Record<string, string> {
  const base = themeDefinitions[settings.theme] || themeDefinitions['dark'];
  const css: Record<string, string> = { ...base };

  if (settings.theme === 'custom') {
    if (settings.primaryColor) css['--primary'] = settings.primaryColor;
    if (settings.accentColor) css['--accent'] = settings.accentColor;
  }

  // Font size
  const fontSizeMap: Record<FontSize, string> = {
    small: '13px',
    medium: '15px',
    large: '17px',
  };
  css['--font-size'] = fontSizeMap[settings.fontSize ?? 'medium'] ?? '15px';

  // UI Density
  const densityMap: Record<UiDensity, { spacing: string; cardPadding: string }> = {
    compact: { spacing: '4px', cardPadding: '8px' },
    normal: { spacing: '8px', cardPadding: '16px' },
    spacious: { spacing: '16px', cardPadding: '24px' },
  };
  const density = densityMap[settings.uiDensity ?? 'normal'] ?? densityMap['normal'];
  css['--spacing'] = density.spacing;
  css['--card-padding'] = density.cardPadding;

  // Animations
  css['--transition-duration'] = settings.animationsEnabled ? '200ms' : '0ms';

  return css;
}