// Application Component: SettingsPlaytime — playtime tracking viewer + clear history
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Select, Button, ScrollArea, Card, Badge } from '@mantine/core';
import { Trash } from 'lucide-react';
import { useAccountStore } from '../../store/accountStore';
import { t } from '../../../config/i18n';

type PlaytimeEntry = { placeName: string; durationMinutes: number; startTime: string };

export function SettingsPlaytime(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const accounts = useAccountStore((s) => s.accounts);
  const accountData = accounts.map((acc) => ({ value: acc.id, label: acc.username }));

  const [playtimeAccountId, setPlaytimeAccountId] = useState<string>('');
  const [totalPlaytime, setTotalPlaytime] = useState<number>(0);
  const [playtimeHistory, setPlaytimeHistory] = useState<PlaytimeEntry[]>([]);

  const loadPlaytime = async () => {
    const r = await api.byAccount.playtimeGetTotalPlaytime(playtimeAccountId);
    if (r.success && r.data) setTotalPlaytime(Number(r.data));
    const hist = await api.byAccount.playtimeGetSessionHistory(playtimeAccountId, 10);
    if (hist.success && Array.isArray(hist.data)) setPlaytimeHistory(hist.data as PlaytimeEntry[]);
  };

  // Auto-load when account selected
  useEffect(() => {
    if (playtimeAccountId) loadPlaytime();
  }, [playtimeAccountId]);

  const clearPlaytime = async () => {
    const r = await api.byAccount.playtimeClearHistory(playtimeAccountId);
    if (r.success) {
      notifications.show({ message: t('settings.historyCleared'), color: 'green' });
      loadPlaytime();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  return (
    <Stack gap="md" p="xs">
      <Select
        placeholder={t('servers.selectAccount')}
        value={playtimeAccountId}
        onChange={(val) => setPlaytimeAccountId(val ?? '')}
        data={accountData}
        size="sm"
        searchable
      />
      {playtimeAccountId && (
        <>
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>{t('settings.totalPlaytime', { hours: (totalPlaytime / 60).toFixed(1) })}</Text>
            <Button size="xs" variant="light" color="red" onClick={clearPlaytime}><Trash size={12} /> {t('settings.clearHistory')}</Button>
          </Group>
          <ScrollArea style={{ maxHeight: 200 }}>
            <Stack gap="xs">
              {playtimeHistory.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center">{t('settings.noSessions')}</Text>
              ) : (
                playtimeHistory.map((entry, i) => (
                  <Card key={`${entry.startTime}-${entry.placeName}-${i}`} withBorder padding="xs" radius="sm">
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Text size="sm" fw={500}>{entry.placeName || t('settings.unknownGame')}</Text>
                        <Text size="xs" c="dimmed">{new Date(entry.startTime).toLocaleDateString()}</Text>
                      </Stack>
                      <Badge size="sm" variant="light">{t('settings.minutes', { minutes: String(entry.durationMinutes) })}</Badge>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </ScrollArea>
        </>
      )}
    </Stack>
  );
}
