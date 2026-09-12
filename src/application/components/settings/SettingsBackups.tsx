// Application Component: SettingsBackups — backup management UI
// Integrates with existing SettingsData accordion

import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { Stack, Group, Text, Button, Badge, Divider, Select, Switch, TextInput } from '@mantine/core';
import { Download, Trash, Shield, Clock, Folder, RotateCcw, CheckCircle } from 'lucide-react';
import { t } from '../../../config/i18n';
import type { BackupMetadata, BackupSchedule, BackupFolderConfig } from '../../../domain/entities/BackupMetadata';

export function SettingsBackups(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [nextRun, setNextRun] = useState<string | null>(null);
  const [folder, setFolder] = useState<BackupFolderConfig | null>(null);
  const [stats, setStats] = useState<{ totalBackups: number; totalSize: number; oldestBackup: string | null; newestBackup: string | null }>({
    totalBackups: 0,
    totalSize: 0,
    oldestBackup: null,
    newestBackup: null,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [scheduleTime, setScheduleTime] = useState('03:00');
  const [includeSecret, setIncludeSecret] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [backupsR, scheduleR, folderR, statsR] = await Promise.allSettled([
        api.backup.list(),
        api.backup.scheduleGet(),
        api.backup.folderGet(),
        api.backup.stats(),
      ]);

      if (backupsR.status === 'fulfilled' && backupsR.value.success) {
        setBackups(backupsR.value.data || []);
      }
      if (scheduleR.status === 'fulfilled' && scheduleR.value.success) {
        setNextRun(scheduleR.value.data?.nextRun ?? null);
        if (scheduleR.value.data?.schedule) {
          setScheduleEnabled(scheduleR.value.data.schedule.enabled);
          setScheduleFrequency(scheduleR.value.data.schedule.frequency);
          setScheduleTime(scheduleR.value.data.schedule.time);
        }
      }
      if (folderR.status === 'fulfilled' && folderR.value.success) {
        setFolder(folderR.value.data);
      }
      if (statsR.status === 'fulfilled' && statsR.value.success) {
        setStats(statsR.value.data);
      }
    } catch (e) {
      console.error('[SettingsBackups] loadAll failed:', e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const r = await api.backup.create(undefined, includeSecret);
      if (r.success) {
        notifications.show({ message: t('settings.backupCreated'), color: 'green' });
        loadAll();
} else if (!r.success) {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
    } catch {
      notifications.show({ message: t('common.error'), color: 'red' });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backup: BackupMetadata) => {
    modals.openConfirmModal({
      title: t('settings.backupRestoreConfirm'),
      children: (
        <Stack gap="sm">
          <Text size="sm">{t('settings.backupRestoreWarning')}</Text>
          <Text size="xs" c="dimmed">{t('settings.backupRestoreDetails', { date: formatDate(backup.createdAt), accounts: backup.metadata.accountCount })}</Text>
        </Stack>
      ),
      labels: { confirm: t('settings.backupRestore'), cancel: t('accounts.cancel') },
      confirmProps: { color: 'orange' },
      onConfirm: async () => {
        const r = await api.backup.restore(backup.id, true);
        if (r.success) {
          notifications.show({ message: t('settings.backupRestored'), color: 'green' });
          // App will reload with restored data
          setTimeout(() => window.location.reload(), 1500);
        } else {
          notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
        }
      },
    });
  };

  const handleDelete = async (backup: BackupMetadata) => {
    modals.openConfirmModal({
      title: t('settings.backupDeleteConfirm'),
      children: (
        <Stack gap="sm">
          <Text size="sm">{t('settings.backupDeleteWarning')}</Text>
          <Text size="xs" c="dimmed">{formatDate(backup.createdAt)} · {formatBytes(backup.encryptedSize)}</Text>
        </Stack>
      ),
      labels: { confirm: t('accounts.delete'), cancel: t('accounts.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const r = await api.backup.delete(backup.id);
        if (r.success) {
          notifications.show({ message: t('settings.backupDeleted'), color: 'green' });
          loadAll();
        } else {
          notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
        }
      },
    });
  };

  const handleVerify = async (backup: BackupMetadata) => {
    const r = await api.backup.verify(backup.id);
    if (r.success) {
      notifications.show({ message: r.data ? t('settings.backupVerifiedOk') : t('settings.backupVerifiedFail'), color: r.data ? 'green' : 'red' });
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  const handleSelectFolder = async () => {
    const r = await api.backup.selectFolder();
    if (r.success && r.data) {
      setFolder(r.data);
      notifications.show({ message: t('settings.backupFolderSet'), color: 'green' });
    } else if (r.success && !r.data) {
      // User cancelled
    } else if (!r.success) {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  const handleSaveSchedule = async () => {
    const newSchedule: BackupSchedule = {
      enabled: scheduleEnabled,
      frequency: scheduleFrequency,
      time: scheduleTime,
    };
    const r = await api.backup.scheduleSet(newSchedule.enabled, newSchedule.frequency, newSchedule.time);
    if (r.success) {
      notifications.show({ message: t('settings.backupScheduleSaved'), color: 'green' });
      loadAll();
    } else {
      notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
    }
  };

  if (loading) {
    return (
      <Stack gap="md" p="xs">
        <Text size="sm" c="dimmed" ta="center">{t('common.loading')}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md" p="xs">
      {/* Stats */}
      <Group gap="md">
        <Badge variant="filled" size="lg">
          <Group gap="xs">
            <Download size={14} />
            <Text fw={500}>{stats.totalBackups}</Text>
            <Text size="sm" c="dimmed">{t('settings.backupsTotal')}</Text>
          </Group>
        </Badge>
        <Badge variant="outline" size="lg">
          <Group gap="xs">
            <Shield size={14} />
            <Text fw={500}>{formatBytes(stats.totalSize)}</Text>
            <Text size="sm" c="dimmed">{t('settings.backupsTotalSize')}</Text>
          </Group>
        </Badge>
        <Badge variant={scheduleEnabled ? 'filled' : 'outline'} size="lg" color={scheduleEnabled ? 'green' : 'gray'}>
          <Group gap="xs">
            <Clock size={14} />
            <Text fw={500}>{scheduleEnabled ? t('settings.backupAutoOn') : t('settings.backupAutoOff')}</Text>
          </Group>
        </Badge>
      </Group>

      {/* Create Backup */}
      <Divider label={t('settings.backupCreate')} labelPosition="left" />
      <Stack gap="md">
        <Group gap="md">
          <Button
            size="lg"
            variant="filled"
            leftSection={<Download size={16} />}
            onClick={handleCreateBackup}
            loading={creating}
          >
            {creating ? t('settings.backupCreating') : t('settings.backupCreateNow')}
          </Button>
          <Group gap="xs">
            <Switch
              checked={includeSecret}
              onChange={(e) => setIncludeSecret(e.currentTarget.checked)}
              size="sm"
              label={t('settings.backupIncludeSecret')}
              description={t('settings.backupIncludeSecretDesc')}
            />
          </Group>
        </Group>
        <Text size="xs" c="dimmed">{t('settings.backupCreateDesc')}</Text>
      </Stack>

      {/* Schedule */}
      <Divider label={t('settings.backupSchedule')} labelPosition="left" />
      <Stack gap="md">
        <Group gap="md">
          <Switch
            checked={scheduleEnabled}
            onChange={(e) => setScheduleEnabled(e.currentTarget.checked)}
            label={t('settings.backupAutoEnable')}
            description={t('settings.backupAutoEnableDesc')}
            size="md"
          />
        </Group>
        {scheduleEnabled && (
              <Stack gap="md" mt="sm" ml={4}>
                <Group gap="md">
                  <Select
                    label={t('settings.backupFrequency')}
                    placeholder={t('settings.backupFrequency')}
                    value={scheduleFrequency}
                    onChange={(val) => setScheduleFrequency(val as 'daily' | 'weekly' | 'monthly')}
                    data={[
                      { value: 'daily', label: t('settings.backupDaily') },
                      { value: 'weekly', label: t('settings.backupWeekly') },
                      { value: 'monthly', label: t('settings.backupMonthly') },
                    ]}
                    w={200}
                  />
                  <TextInput
                    label={t('settings.backupTime')}
                    placeholder="HH:mm"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.currentTarget.value)}
                    w={160}
                  />
                  <Button size="sm" variant="filled" onClick={handleSaveSchedule}>
                    {t('settings.save')}
                  </Button>
                </Group>
                {nextRun && (
                  <Text size="xs" c="dimmed">
                    {t('settings.backupNextRun', { time: formatDate(nextRun) })}
                  </Text>
                )}
              </Stack>
            )}
      </Stack>

      {/* Folder Selection */}
      <Divider label={t('settings.backupFolder')} labelPosition="left" />
      <Stack gap="md">
        <Group gap="md">
          <Button
            size="sm"
            variant="outline"
            leftSection={<Folder size={14} />}
            onClick={handleSelectFolder}
          >
            {t('settings.backupSelectFolder')}
          </Button>
          {folder && (
            <Text size="sm" c="dimmed" style={{ alignSelf: 'center', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.path}
            </Text>
          )}
        </Group>
        {!folder && <Text size="xs" c="dimmed">{t('settings.backupDefaultFolder')}</Text>}
      </Stack>

      {/* Backups List */}
      <Divider label={t('settings.backupsList')} labelPosition="left" />
      {backups.length === 0 ? (
        <Stack gap="sm" p="md" ta="center">
          <Shield size={48} style={{ color: 'var(--mantine-color-gray-4)' }} />
          <Text size="sm" c="dimmed">{t('settings.backupsEmpty')}</Text>
          <Text size="xs" c="dimmed">{t('settings.backupsEmptyDesc')}</Text>
        </Stack>
      ) : (
        <Stack gap="xs">
          {backups
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((backup) => (
              <Group key={backup.id} justify="space-between" align="center" p="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs">
                    <Text size="sm" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatDate(backup.createdAt)}
                    </Text>
                    <Badge variant="light" size="xs">{formatBytes(backup.encryptedSize)}</Badge>
                    <Badge variant="light" size="xs" color="blue">{backup.metadata.accountCount} {t('accounts.accounts')}</Badge>
                    {backup.includesSecret && <Badge variant="light" size="xs" color="orange"><Shield size={10} /> {t('settings.backupWithSecret')}</Badge>}
                  </Group>
                  <Text size="xs" c="dimmed">{t('settings.backupVersion', { version: backup.version })} · {t('settings.backupAppVersion', { version: backup.metadata.appVersion })}</Text>
                </Stack>
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<RotateCcw size={12} />}
                    onClick={() => handleRestore(backup)}
                  >
                    {t('settings.backupRestore')}
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<CheckCircle size={12} />}
                    onClick={() => handleVerify(backup)}
                  >
                    {t('settings.backupVerify')}
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    color="red"
                    leftSection={<Trash size={12} />}
                    onClick={() => handleDelete(backup)}
                  >
                    {t('accounts.delete')}
                  </Button>
                </Group>
              </Group>
            ))}
        </Stack>
      )}
    </Stack>
  );
}