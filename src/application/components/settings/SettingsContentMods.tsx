// Application Component: SettingsContentMods — content mod backup/restore/install/uninstall
// DT-6: extraído de SettingsView.tsx (SRP)

import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Button, Card, Badge } from '@mantine/core';
import { Download, Upload } from 'lucide-react';
import { t } from '../../../config/i18n';

export function SettingsContentMods(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [modsAvailable, setModsAvailable] = useState<string[]>([]);
  const [modsInstalled, setModsInstalled] = useState<Set<string>>(new Set());

  const loadMods = async () => {
    const r = await api.byAccount.modsListAvailable();
    if (r.success && Array.isArray(r.data)) {
      setModsAvailable(r.data as string[]);
      const installed = new Set<string>();
      for (const mod of r.data as string[]) {
        const check = await api.byAccount.modsIsModInstalled(mod);
        if (check.success && check.data) installed.add(mod);
      }
      setModsInstalled(installed);
    }
  };

  // Initial load
  useEffect(() => {
    loadMods();
  }, []);

  const toggleMod = async (modName: string) => {
    if (modsInstalled.has(modName)) {
      const r = await api.byAccount.modsUninstallMod(modName);
      if (r.success) {
        setModsInstalled(new Set([...modsInstalled].filter((m) => m !== modName)));
        notifications.show({ message: t('settings.modUninstalled', { name: modName }), color: 'green' });
      } else {
        notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
      }
    } else {
      const r = await api.byAccount.modsInstallMod(modName);
      if (r.success) {
        setModsInstalled(new Set([...modsInstalled, modName]));
        notifications.show({ message: t('settings.modInstalled', { name: modName }), color: 'green' });
      } else {
        notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
      }
    }
  };

  const backupMods = async () => {
    const r = await api.byAccount.modsBackupOriginals();
    if (r.success) notifications.show({ message: t('settings.originalsBackedUp'), color: 'green' });
    else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
  };

  const restoreMods = async () => {
    const r = await api.byAccount.modsRestoreOriginals();
    if (r.success) {
      notifications.show({ message: t('settings.originalsRestored'), color: 'green' });
      loadMods();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  return (
    <Stack gap="md" p="xs">
      <Group gap="xs">
        <Button size="sm" variant="light" onClick={backupMods}><Download size={14} /> {t('settings.backupOriginals')}</Button>
        <Button size="sm" variant="light" onClick={restoreMods}><Upload size={14} /> {t('settings.restoreOriginals')}</Button>
      </Group>
      <Stack gap="xs">
        {modsAvailable.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center">{t('settings.noMods')}</Text>
        ) : (
          modsAvailable.map((mod) => (
            <Card key={mod} withBorder padding="xs" radius="sm">
              <Group justify="space-between" align="center">
                <Text size="sm" ff="monospace">{mod}</Text>
                <Group gap="xs">
                  {modsInstalled.has(mod) && <Badge size="xs" variant="light" color="green">{t('settings.installed')}</Badge>}
                  <Button
                    size="xs"
                    variant={modsInstalled.has(mod) ? 'light' : 'filled'}
                    color={modsInstalled.has(mod) ? 'red' : 'primary'}
                    onClick={() => toggleMod(mod)}
                  >
                    {modsInstalled.has(mod) ? t('settings.uninstall') : t('settings.install')}
                  </Button>
                </Group>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}
