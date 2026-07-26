// Application Component: SettingsBotting — botting enable + interval
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Switch, NumberInput } from '@mantine/core';
import { t } from '../../../config/i18n';

export function SettingsBotting(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [bottingEnabled, setBottingEnabled] = useState(false);
  const [bottingInterval, setBottingInterval] = useState(5);

  // Initial load
  useEffect(() => {
    Promise.allSettled([
      api.settings.get('bottingEnabled'),
      api.settings.get('bottingInterval'),
    ]).then((results) => {
      const [enabledR, intervalR] = results;
      if (enabledR.status === 'fulfilled' && enabledR.value.success) setBottingEnabled(Boolean(enabledR.value.data));
      if (intervalR.status === 'fulfilled' && intervalR.value.success && intervalR.value.data) setBottingInterval(Number(intervalR.value.data));
    }).catch(() => { /* defaults remain */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleBotting = async (val: boolean) => {
    setBottingEnabled(val);
    await api.settings.set('bottingEnabled', val);
    if (!val) await api.botting.stop();
    notifications.show({ message: val ? t('settings.bottingEnabled') : t('settings.bottingDisabled'), color: 'blue' });
  };

  const saveBottingInterval = async (val: number) => {
    setBottingInterval(val);
    await api.settings.set('bottingInterval', val);
  };

  return (
    <Stack gap="md" p="xs">
      <Group justify="space-between" align="center">
        <Text size="sm">{t('settings.enableBotting')}</Text>
        <Switch checked={bottingEnabled} onChange={(e) => handleToggleBotting(e.currentTarget.checked)} />
      </Group>
      {bottingEnabled && (
        <Group gap="sm" align="center">
          <Text size="sm">{t('settings.interval')}</Text>
          <NumberInput
            value={bottingInterval}
            onChange={(val) => saveBottingInterval(Number(val) || 5)}
            min={1}
            max={60}
            size="sm"
            w={80}
          />
        </Group>
      )}
      <Text size="xs" c="red">{t('settings.bottingWarning')}</Text>
    </Stack>
  );
}
