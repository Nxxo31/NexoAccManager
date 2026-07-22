// Infrastructure: ThemeService — CSS variables + theme system
// Works in both main and renderer processes

export type ThemeId = 'dark' | 'light' | 'midnight';

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
  midnight: {
    bg: '#0a0a1a',
    bgCard: '#12122e',
    bgSurface: '#1a1a3e',
    bgElevated: '#2a2a4e',
    textPrimary: '#e0e0ff',
    textSecondary: '#a0a0c0',
    textTertiary: '#a0a0c0',
    border: '#2a2a4a',
    primary: '#4a4aff',
    primaryHover: '#6a6aff',
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
  // Only apply in renderer process
  if (typeof document !== 'undefined') {
    const css = generateThemeCSS(theme);
    const root = document.documentElement;
    root.style.cssText += `;${css}`;
  }
}

export function getTheme(): ThemeId {
  if (typeof document !== 'undefined') {
    // Renderer: use localStorage
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light' || stored === 'midnight') {
      return stored as ThemeId;
    }
    return 'dark'; // default
  } else {
    // Main process: use a JSON file in userData
    const { app } = require('electron');
    const path = require('path');
    const fs = require('fs');
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    let config: { theme?: ThemeId } = {};
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to read config file', e);
        config = {};
      }
    }
    const theme = config.theme as ThemeId;
    return theme ?? 'dark';
  }
}

export function setTheme(theme: ThemeId): void {
  if (typeof document !== 'undefined') {
    // Renderer: store in localStorage and apply
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  } else {
    // Main process: update the JSON file
    const { app } = require('electron');
    const path = require('path');
    const fs = require('fs');
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    let config: { theme?: ThemeId } = {};
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to read config file', e);
        config = {};
      }
    }
    config.theme = theme;
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (e) {
      console.error('Failed to write config file', e);
    }
  }
}