// Application Component: SettingsDiscordRPC — discord RPC toggle + presence update
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Switch, TextInput, Button } from '@mantine/core';
import { t } from '../../../config/i18n';

export function SettingsDiscordRPC(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [discordRunning, setDiscordRunning] = useState(false);
  const [discordDetails, setDiscordDetails] = useState('Playing Roblox');
  const [discordState, setDiscordState] = useState('NexoAccManager');

  const toggleDiscord = async () => {
    if (discordRunning) {
      await api.byAccount.discordShutdown();
      setDiscordRunning(false);
      notifications.show({ message: t('settings.discordDisconnected'), color: 'blue' });
    } else {
      const r = await api.byAccount.discordInitialize();
      if (r.success) {
        setDiscordRunning(true);
        await api.byAccount.discordUpdatePresence(discordDetails, discordState, 'nam-logo', undefined, Date.now());
        notifications.show({ message: t('settings.discordConnected'), color: 'green' });
      } else {
        notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
      }
    }
  };

  const updateDiscordPresence = async () => {
    const r = await api.byAccount.discordUpdatePresence(discordDetails, discordState, 'nam-logo', undefined, Date.now());
    if (r.success) notifications.show({ message: t('settings.presenceUpdated'), color: 'green' });
    else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
  };

  return (
    <Stack gap="md" p="xs">
      <Group justify="space-between" align="center">
        <Text size="sm">{t('settings.enableDiscordRpc')}</Text>
        <Switch checked={discordRunning} onChange={() => toggleDiscord()} />
      </Group>
      {discordRunning && (
        <>
          <TextInput
            label={t('settings.discordDetails')}
            placeholder="Playing Roblox"
            value={discordDetails}
            onChange={(e) => setDiscordDetails(e.currentTarget.value)}
            size="sm"
          />
          <TextInput
            label={t('settings.discordState')}
            placeholder="NexoAccManager"
            value={discordState}
            onChange={(e) => setDiscordState(e.currentTarget.value)}
            size="sm"
          />
          <Button size="sm" variant="light" onClick={updateDiscordPresence}>{t('settings.updatePresence')}</Button>
        </>
      )}
    </Stack>
  );
}
