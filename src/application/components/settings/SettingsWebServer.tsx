// Application Component: SettingsWebServer — LocalApiService toggle + port
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, TextInput, Button } from '@mantine/core';
import { Globe } from 'lucide-react';
import { t } from '../../../config/i18n';

export function SettingsWebServer(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [apiRunning, setApiRunning] = useState(false);
  const [apiPort, setApiPort] = useState('31415');

  const toggleApi = async () => {
    if (apiRunning) {
      const r = await api.advanced.localApiStop();
      if (r.success) {
        setApiRunning(false);
        notifications.show({ message: t('settings.serverStopped'), color: 'green' });
      }
    } else {
      const r = await api.advanced.localApiStart(parseInt(apiPort, 10) || 31415);
      if (r.success) {
        setApiRunning(true);
        notifications.show({ message: t('settings.serverRunning', { port: apiPort }), color: 'green' });
      }
    }
  };

  return (
    <Stack gap="md" p="xs">
      <Group gap="sm" align="center">
        <Globe size={16} />
        <TextInput
          placeholder={t('settings.port')}
          value={apiPort}
          onChange={(e) => setApiPort(e.currentTarget.value)}
          size="sm"
          style={{ width: 100 }}
        />
        <Button
          variant={apiRunning ? 'light' : 'filled'}
          color={apiRunning ? 'red' : 'primary'}
          size="sm"
          onClick={toggleApi}
        >
          {apiRunning ? t('settings.stop') : t('settings.start')}
        </Button>
      </Group>
      <Text size="xs" c="dimmed">{t('settings.webApiDescription')}</Text>
    </Stack>
  );
}
