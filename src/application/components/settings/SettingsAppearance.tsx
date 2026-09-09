// SettingsAppearance.tsx — Apariencia: tema, color principal, idioma
// FIX: Color picker usa onChange (visual) + onChangeEnd (persist) separados
// FIX: Default color hex válido (#1d8bff, no #1d8ff)
// FIX: CSS vars se Apply en runtime + load

import { useState, useEffect, useCallback } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import {
  Group, Stack, Text, Switch, ColorPicker, ColorSwatch, Badge, Select,
} from '@mantine/core';
import { Moon, Sun, Languages } from 'lucide-react';
import { t, setLang, getLang, type LangId } from '../../../config/i18n';

// Generate 10 shades from a base hex color (Mantine expects 0-9)
function generateShades(hex: string): string[] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const shades: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Lighten for 0-3, darken for 6-9, keep 4-5 close to original
    const factor = i < 4 ? (4 - i) * 0.15 : i > 5 ? (i - 5) * -0.12 : 0;
    const nr = Math.round(Math.max(0, Math.min(255, r + (255 - r) * factor)));
    const ng = Math.round(Math.max(0, Math.min(255, g + (255 - g) * factor)));
    const nb = Math.round(Math.max(0, Math.min(255, r + (255 - b) * factor)));
    shades.push(`#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`);
  }
  // Override shade 5 with the actual color
  shades[5] = hex;
  return shades;
}

function applyPrimaryColor(hex: string) {
  const shades = generateShades(hex);
  const root = document.documentElement;
  for (let i = 0; i < 10; i++) {
    root.style.setProperty(`--mantine-color-primary-${i}`, shades[i]);
  }
  root.style.setProperty('--nam-primary', hex);
}

export function SettingsAppearance(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const [lang, setLangState] = useState<LangId>(getLang());
  // FIX: #1d8ff → #1d8bff (hex válido de 6 dígitos)
  const [primaryColor, setPrimaryColor] = useState('#1d8bff');
  const [, forceUpdate] = useState(0);

  const colors = ['#1d8bff', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#facc15'];
  const langOptions = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
  ];

  const applyLang = useCallback((newLang: LangId) => {
    setLang(newLang);
    setLangState(newLang);
    api.settings.set('lang', newLang);
    forceUpdate((n) => n + 1);
  }, [api]);

  // FIX: onChange solo actualiza el estado visual (sin async/persist)
  const handleColorChange = useCallback((color: string) => {
    setPrimaryColor(color);
    applyPrimaryColor(color);
  }, []);

  // FIX: onChangeEnd persiste el color (async, una sola vez al soltar)
  const handleColorEnd = useCallback((color: string) => {
    api.settings.set('primaryColor', color).catch(() => { /* ignore */ });
  }, [api]);

  // Initial load — primaryColor + persisted lang
  useEffect(() => {
    api.settings.get('primaryColor').then((r) => {
      if (r.success && r.data) {
        const color = String(r.data);
        setPrimaryColor(color);
        applyPrimaryColor(color);
      }
    }).catch(() => { /* defaults remain */ });
    api.settings.get('lang').then((r) => {
      if (r.success && r.data) {
        const stored = String(r.data) as LangId;
        if (['es', 'en', 'pt'].includes(stored)) applyLang(stored);
      }
    }).catch(() => { /* defaults remain */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack gap="md" p="xs">
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          {colorScheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          <Text size="sm">{t('settings.darkTheme')}</Text>
        </Group>
        <Switch checked={colorScheme === 'dark'} onChange={() => toggleColorScheme()} />
      </Group>
      <div>
        <Text size="sm" fw={500} mb="xs">{t('settings.primaryColor')}</Text>
        <Group gap="xs" mb="sm">
          {colors.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              onClick={() => { handleColorChange(c); handleColorEnd(c); }}
              style={{ cursor: 'pointer', border: primaryColor === c ? '2px solid white' : 'none' }}
            />
          ))}
        </Group>
        <ColorPicker
          value={primaryColor}
          onChange={handleColorChange}
          onChangeEnd={handleColorEnd}
          format="hex"
          size="sm"
        />
        <Group gap="xs" mt="sm" align="center">
          <Text size="xs" c="dimmed">{t('settings.color')}</Text>
          <Badge variant="filled" style={{ backgroundColor: primaryColor }}>{primaryColor}</Badge>
        </Group>
      </div>
      {/* Language selector */}
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <Languages size={16} />
          <Text size="sm">{t('settings.language')}</Text>
        </Group>
        <Select
          value={lang}
          onChange={(val) => val && applyLang(val as LangId)}
          data={langOptions}
          size="sm"
          w={140}
        />
      </Group>
    </Stack>
  );
}
