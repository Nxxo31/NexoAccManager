// Application Component: SettingsLogs — recent Roblox logs viewer + clear old
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Button, ScrollArea, Card, Badge } from '@mantine/core';
import { t } from '../../../config/i18n';
// (no icon import — header icon lives in the wrapper Accordion.Control)

type LogEntry = { timestamp: string; level: string; message: string };

export function SettingsLogs(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const loadRecentLogs = async () => {
    const r = await api.byAccount.logsGetRecent(1, 50);
    if (r.success && Array.isArray(r.data)) setLogEntries(r.data as LogEntry[]);
  };

  // Initial load
  useEffect(() => {
    loadRecentLogs();
  }, []);

  const clearOldLogs = async () => {
    const r = await api.byAccount.logsClearOld(7);
    if (r.success) {
      notifications.show({ message: t('settings.oldLogsCleared'), color: 'green' });
      loadRecentLogs();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  return (
    <Stack gap="md" p="xs">
      <Group justify="space-between" align="center">
        <Text size="sm">{t('settings.recentEntries', { count: String(logEntries.length) })}</Text>
        <Button size="xs" variant="light" color="red" onClick={clearOldLogs}>{t('settings.clearOldLogs')}</Button>
      </Group>
      <ScrollArea style={{ maxHeight: 250 }}>
        <Stack gap="xs">
          {logEntries.length === 0 ? (
            <Text size="xs" c="dimmed" ta="center">{t('settings.noLogs')}</Text>
          ) : (
            logEntries.map((entry, i) => (
              <Card key={`${entry.timestamp}-${entry.level}-${i}`} withBorder padding="xs" radius="sm">
                <Group gap="xs" align="start">
                  <Badge
                    size="xs"
                    variant="light"
                    color={entry.level === 'error' ? 'red' : entry.level === 'warning' ? 'yellow' : 'gray'}
                  >
                    {entry.level}
                  </Badge>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">{new Date(entry.timestamp).toLocaleTimeString()}</Text>
                    <Text size="xs" ff="monospace">{entry.message}</Text>
                  </Stack>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
