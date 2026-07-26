// Application Component: SettingsFastFlags — FastFlags CRUD + import/export
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Group, Stack, Text, Select, TextInput, Button, ScrollArea, Card, ActionIcon,
} from '@mantine/core';
import { Flag, Trash, Download } from 'lucide-react';
import { useAccountStore } from '../../store/accountStore';
import { t } from '../../../config/i18n';

export function SettingsFastFlags(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const accounts = useAccountStore((s) => s.accounts);
  const accountData = accounts.map((acc) => ({ value: acc.id, label: acc.username }));

  const [fflagsAccountId, setFflagsAccountId] = useState<string>('');
  const [fflags, setFflags] = useState<Record<string, unknown>>({});
  const [fflagKey, setFflagKey] = useState('');
  const [fflagValue, setFflagValue] = useState('');

  const loadFflags = async () => {
    const r = await api.byAccount.fflagsGetAll(fflagsAccountId);
    if (r.success && r.data) setFflags(r.data as Record<string, unknown>);
    else setFflags({});
  };

  // Auto-load fflags when account selected
  useEffect(() => {
    if (fflagsAccountId) loadFflags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fflagsAccountId]);

  const setFflag = async () => {
    if (!fflagKey.trim() || !fflagsAccountId) return;
    let value: string | number | boolean = fflagValue;
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(Number(value))) value = Number(value);
    const r = await api.byAccount.fflagsSetFlag(fflagsAccountId, fflagKey.trim(), value);
    if (r.success) {
      notifications.show({ message: t('settings.flagSaved'), color: 'green' });
      setFflagKey('');
      setFflagValue('');
      loadFflags();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  const deleteFflag = async (key: string) => {
    const r = await api.byAccount.fflagsDeleteFlag(fflagsAccountId, key);
    if (r.success) {
      notifications.show({ message: t('settings.flagDeleted'), color: 'green' });
      loadFflags();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  const exportFflags = async () => {
    if (!fflagsAccountId) return;
    const r = await api.byAccount.fflagsExportFlags(fflagsAccountId);
    if (r.success) notifications.show({ message: t('settings.flagsExported'), color: 'green' });
    else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
  };

  return (
    <Stack gap="md" p="xs">
      <Select
        placeholder={t('servers.selectAccount')}
        value={fflagsAccountId}
        onChange={(val) => setFflagsAccountId(val ?? '')}
        data={accountData}
        size="sm"
        searchable
      />
      {fflagsAccountId && (
        <>
          <Group gap="xs">
            <TextInput
              placeholder={t('settings.flagNamePlaceholder')}
              value={fflagKey}
              onChange={(e) => setFflagKey(e.currentTarget.value)}
              size="sm"
              style={{ flex: 1 }}
            />
            <TextInput
              placeholder={t('settings.value')}
              value={fflagValue}
              onChange={(e) => setFflagValue(e.currentTarget.value)}
              size="sm"
              w={120}
            />
            <Button size="sm" variant="filled" color="primary" onClick={setFflag}>{t('settings.set')}</Button>
            <Button size="sm" variant="light" onClick={exportFflags}><Download size={14} /></Button>
          </Group>
          <ScrollArea style={{ maxHeight: 250 }}>
            <Stack gap="xs">
              {Object.entries(fflags).length === 0 ? (
                <Text size="xs" c="dimmed" ta="center">{t('settings.noFlags')}</Text>
              ) : (
                Object.entries(fflags).map(([key, val]) => (
                  <Card key={key} withBorder padding="xs" radius="sm">
                    <Group justify="space-between" align="center">
                      <Stack gap={2}>
                        <Text size="xs" ff="monospace" fw={500}>{key}</Text>
                        <Text size="xs" c="dimmed">= {String(val)}</Text>
                      </Stack>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => deleteFflag(key)} aria-label={t('settings.flagDeleted')}>
                        <Trash size={12} />
                      </ActionIcon>
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
