// SettingsAppearance.tsx — extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import {
  Group, Stack, Text, Switch, ColorPicker, ColorSwatch, Badge, Select,
} from '@mantine/core';
import { Moon, Sun, Languages } from 'lucide-react';
import { t, setLang, getLang, type LangId } from '../../../config/i18n';

export function SettingsAppearance(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const [lang, setLangState] = useState<LangId>(getLang());
  const [primaryColor, setPrimaryColor] = useState('#1d8ff');
  const [, forceUpdate] = useState(0);

  const colors = ['#1d8ff', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#facc15'];
  const langOptions = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
  ];

  const applyLang = (newLang: LangId) => {
    setLang(newLang);
    setLangState(newLang);
    api.settings.set('lang', newLang);
    forceUpdate((n) => n + 1);
  };

  const savePrimaryColor = async (color: string) => {
    setPrimaryColor(color);
    await api.settings.set('primaryColor', color);
  };

  // Initial load — primaryColor + persisted lang
  useEffect(() => {
    api.settings.get('primaryColor').then((r) => {
      if (r.success && r.data) setPrimaryColor(String(r.data));
    }).catch(() => { /* defaults remain */ });
    api.settings.get('lang').then((r) => {
      if (r.success && r.data) {
        const stored = String(r.data) as LangId;
        if (['es', 'en', 'pt'].includes(stored)) applyLang(stored);
      }
    }).catch(() => { /* defaults remain */ });
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
              onClick={() => savePrimaryColor(c)}
              style={{ cursor: 'pointer', border: primaryColor === c ? '2px solid white' : 'none' }}
            />
          ))}
        </Group>
        <ColorPicker value={primaryColor} onChange={savePrimaryColor} format="hex" size="sm" />
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
