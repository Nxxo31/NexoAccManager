// Application Component: SettingsGeneral — devmode + savePasswords + autoRejoin
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Switch } from '@mantine/core';
import { t } from '../../../config/i18n';

export function SettingsGeneral(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [devmode, setDevmode] = useState(false);
  const [autoRejoin, setAutoRejoin] = useState(false);
  const [savePasswords, setSavePasswords] = useState(false);

  // Initial load
  useEffect(() => {
    Promise.allSettled([
      api.settings.get('devmode'),
      api.settings.get('autoRejoin'),
      api.settings.get('savePasswords'),
    ]).then((results) => {
      const [devmodeR, autoRejoinR, savePasswordsR] = results;
      if (devmodeR.status === 'fulfilled' && devmodeR.value.success) setDevmode(Boolean(devmodeR.value.data));
      if (autoRejoinR.status === 'fulfilled' && autoRejoinR.value.success) setAutoRejoin(Boolean(autoRejoinR.value.data));
      if (savePasswordsR.status === 'fulfilled' && savePasswordsR.value.success) setSavePasswords(Boolean(savePasswordsR.value.data));
    }).catch(() => { /* defaults remain */ });
  }, []);

  const handleToggleDevmode = async (val: boolean) => {
    setDevmode(val);
    await api.settings.set('devmode', val);
    await api.advanced.devMode(val);
    notifications.show({ message: val ? t('settings.devmodeActivated') : t('settings.devmodeDeactivated'), color: 'blue' });
  };

  const handleToggleSavePasswords = async (val: boolean) => {
    setSavePasswords(val);
    await api.settings.set('savePasswords', val);
    notifications.show({ message: val ? t('settings.savePasswordsEnabled') : t('settings.savePasswordsDisabled'), color: 'blue' });
  };

  const handleToggleAutoRejoin = async (val: boolean) => {
    setAutoRejoin(val);
    await api.settings.set('autoRejoin', val);
  };

  return (
    <Stack gap="md" p="xs">
      <Group justify="space-between" align="center">
        <Text size="sm">{t('settings.developerMode')}</Text>
        <Switch checked={devmode} onChange={(e) => handleToggleDevmode(e.currentTarget.checked)} />
      </Group>
      <Group justify="space-between" align="center">
        <Text size="sm">{t('settings.savePasswords')}</Text>
        <Switch checked={savePasswords} onChange={(e) => handleToggleSavePasswords(e.currentTarget.checked)} />
      </Group>
      <Group justify="space-between" align="center">
        <Text size="sm">{t('settings.autoRejoin')}</Text>
        <Switch checked={autoRejoin} onChange={(e) => handleToggleAutoRejoin(e.currentTarget.checked)} />
      </Group>
    </Stack>
  );
}
