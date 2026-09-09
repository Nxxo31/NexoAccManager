// Application Component: SettingsData — export data + delete all accounts (with confirm modal)
// DT-6: extraído de SettingsView.tsx (SRP)

import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { Stack, Text, Button, Checkbox } from '@mantine/core';
import { Download, Trash } from 'lucide-react';
import { t } from '../../../config/i18n';

export function SettingsData(): JSX.Element | null {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (!api) return null;

  // U-001: Mantine modal for delete confirmation
  const confirmDeleteAllAccounts = () => {
    modals.openConfirmModal({
      title: t('accounts.deleteConfirmTitle'),
      children: (
        <Stack gap="sm">
          <Text size="sm">{t('settings.deleteAllConfirm')}</Text>
          <Checkbox label={t('settings.deleteAllAccounts')} />
        </Stack>
      ),
      labels: { confirm: t('accounts.delete'), cancel: t('accounts.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const r = await api.advanced.deleteAllAccounts();
        if (r.success) notifications.show({ message: t('settings.allAccountsDeleted'), color: 'green' });
        else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
      },
    });
  };

  const handleExport = async () => {
    const r = await api.advanced.exportData();
    if (r.success) notifications.show({ message: t('settings.dataExported'), color: 'green' });
    else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
  };

  return (
    <Stack gap="md" p="xs">
      <Button size="sm" variant="light" onClick={handleExport}>
        <Download size={14} /> {t('settings.exportData')}
      </Button>
      <Button size="sm" variant="light" color="red" onClick={confirmDeleteAllAccounts}>
        <Trash size={14} /> {t('settings.deleteAllAccounts')}
      </Button>
    </Stack>
  );
}
