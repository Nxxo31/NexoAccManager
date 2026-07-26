// Application Component: SettingsLaunchPresets — presets CRUD + launch
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, TextInput, Button, Card, ActionIcon } from '@mantine/core';
import { Trash } from 'lucide-react';
import { useAccountStore } from '../../store/accountStore';
import { t } from '../../../config/i18n';
import type { LaunchPreset } from '../../../domain/entities/LaunchPreset';

type Preset = { id: string; name: string; placeId: string; accountIds: string[] };

export function SettingsLaunchPresets(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const accounts = useAccountStore((s) => s.accounts);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presetPlaceId, setPresetPlaceId] = useState('');

  const loadPresets = async () => {
    const r = await api.byAccount.presetsGetAll();
    if (r.success && Array.isArray(r.data)) setPresets(r.data as Preset[]);
  };

  // Initial load
  useEffect(() => {
    loadPresets();
  }, []);

  const savePreset = async () => {
    if (!presetName.trim() || !presetPlaceId.trim()) return;
    const r = await api.byAccount.presetsSavePreset({
      name: presetName.trim(),
      placeId: presetPlaceId.trim(),
      accountIds: accounts.map((a) => a.id),
      autoShuffle: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Omit<LaunchPreset, 'id'>);
    if (r.success) {
      notifications.show({ message: t('settings.presetSaved'), color: 'green' });
      setPresetName('');
      setPresetPlaceId('');
      loadPresets();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  const launchPreset = async (id: string) => {
    const r = await api.byAccount.presetsLaunchPreset(id);
    if (r.success) notifications.show({ message: t('settings.presetLaunched'), color: 'green' });
    else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
  };

  const deletePreset = async (id: string) => {
    const r = await api.byAccount.presetsDeletePreset(id);
    if (r.success) {
      notifications.show({ message: t('settings.presetDeleted'), color: 'green' });
      loadPresets();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  return (
    <Stack gap="md" p="xs">
      <Group gap="xs">
        <TextInput
          placeholder={t('settings.presetNamePlaceholder')}
          value={presetName}
          onChange={(e) => setPresetName(e.currentTarget.value)}
          size="sm"
          style={{ flex: 1 }}
        />
        <TextInput
          placeholder={t('accounts.placeId')}
          value={presetPlaceId}
          onChange={(e) => setPresetPlaceId(e.currentTarget.value)}
          size="sm"
          w={140}
        />
        <Button size="sm" variant="filled" color="primary" onClick={savePreset}>{t('common.save')}</Button>
      </Group>
      <Stack gap="xs">
        {presets.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center">{t('settings.noPresets')}</Text>
        ) : (
          presets.map((preset) => (
            <Card key={preset.id} withBorder padding="xs" radius="sm">
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Text size="sm" fw={500}>{preset.name}</Text>
                  <Text size="xs" c="dimmed">{t('settings.presetAccounts', { placeId: preset.placeId, count: String(preset.accountIds.length) })}</Text>
                </Stack>
                <Group gap="xs">
                  <Button size="xs" variant="filled" color="primary" onClick={() => launchPreset(preset.id)}>{t('settings.launch')}</Button>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={() => deletePreset(preset.id)} aria-label={t('settings.presetDeleted')}>
                    <Trash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}
