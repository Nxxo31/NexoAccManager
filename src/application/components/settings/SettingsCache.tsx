// Application Component: SettingsCache — cache analysis + clean
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Button } from '@mantine/core';
import { Trash } from 'lucide-react';
import { t } from '../../../config/i18n';

export function SettingsCache(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [cacheSize, setCacheSize] = useState<string>('');

  const loadCacheAnalysis = async () => {
    const r = await api.byAccount.cacheAnalyze();
    if (r.success && r.data) {
      const d = r.data as { totalSizeMB?: number };
      setCacheSize(d.totalSizeMB ? `${d.totalSizeMB.toFixed(1)} MB` : 'N/A');
    }
  };

  // Initial load
  useEffect(() => {
    loadCacheAnalysis();
  }, []);

  const cleanCache = async () => {
    const r = await api.byAccount.cacheClean({ temp: true, logs: true, cache: true });
    if (r.success) {
      notifications.show({ message: t('settings.cacheCleaned'), color: 'green' });
      loadCacheAnalysis();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  return (
    <Stack gap="md" p="xs">
      <Group justify="space-between" align="center">
        <Text size="sm">{t('settings.cacheSize', { size: cacheSize || t('settings.calculating') })}</Text>
        <Button size="sm" variant="filled" color="red" onClick={cleanCache}><Trash size={14} /> {t('settings.clearCache')}</Button>
      </Group>
      <Text size="xs" c="dimmed">{t('settings.cacheDescription')}</Text>
    </Stack>
  );
}
