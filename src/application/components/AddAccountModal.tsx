// Application Component: AddAccountModal — Mantine v7
//
import { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Modal, Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { t } from '../../config/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginBrowser: () => Promise<{ success: boolean; error?: string }>;
}

export function AddAccountModal({ open, onClose, onLoginBrowser }: Props): JSX.Element {
  const [loading, setLoading] = useState(false);

  const handleBrowser = async () => {
    setLoading(true);
    notifications.show({ message: t('modal.openingBrowser'), color: 'blue' });
    try {
      const result = await onLoginBrowser();
      if (result.success) {
        notifications.show({ message: t('modal.accountAdded'), color: 'green' });
      } else {
        const errorMessage = result.error ?? t('common.error');
        notifications.show({ message: t('modal.loginFailed', { error: errorMessage }), color: 'red' });
      }
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal opened={open} onClose={onClose} title={t('modal.addAccountTitle')} size="md" centered>
      <Stack gap="md" pt="md">
        <Text size="xs" c="dimmed">
          {t('modal.browserInfo')}
        </Text>
        <Button
          variant="filled"
          color="primary"
          leftSection={loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
          loading={loading}
          onClick={handleBrowser}
        >
          {t('modal.openBrowser')}
        </Button>
        <Text size="xs" c="dimmed" mt="sm">
          {t('modal.advancedImportNote')}
        </Text>
      </Stack>
    </Modal>
  );
}