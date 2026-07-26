// Application Component: AddAccountModal — Mantine v7

import { useState } from 'react';
import { Globe, Cookie, Upload, Loader2 } from 'lucide-react';
import { Modal, Tabs, Textarea, Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAccounts } from '../hooks/useAccounts';
import { t } from '../../config/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginBrowser: () => Promise<{ success: boolean; error?: string }>;
}

export function AddAccountModal({ open, onClose, onLoginBrowser }: Props): JSX.Element {
  const { addAccount } = useAccounts();
  const [cookie, setCookie] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBrowser = async () => {
    setLoading(true);
    notifications.show({ message: t('modal.openingBrowser'), color: 'blue' });
    try {
      await onLoginBrowser();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleCookie = async () => {
      if (!cookie.trim()) { notifications.show({ message: t('modal.pasteValidCookie'), color: 'red' }); return; }
      setLoading(true);
      try {
        const result = await addAccount(cookie.trim());
        if (result.success) { setCookie(''); onClose(); }
      } finally {
        setLoading(false);
      }
    };

  const handleBulk = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const accounts = lines.map((line) => {
      const [username, password] = line.split(':');
      return { username: username?.trim() ?? '', password: password?.trim() ?? '' };
    }).filter((a) => a.username && a.password);

    if (accounts.length === 0) {
      notifications.show({ message: t('modal.bulkFormatError'), color: 'red' });
      setLoading(false);
      return;
    }

    let added = 0;
    for (const a of accounts) {
      try {
        const loginResult = await window.api.account.login(a.username, a.password);
        if (loginResult.success) {
          // login IPC handler already created and stored the account internally
          added++;
        }
      } catch { /* skip */ }
    }
    notifications.show({ message: t('modal.accountsAdded', { count: String(added) }), color: added > 0 ? 'green' : 'red' });
    if (added > 0) { setBulkText(''); onClose(); }
    setLoading(false);
  };

  return (
    <Modal opened={open} onClose={onClose} title={t('modal.addAccountTitle')} size="md" centered>
      <Tabs defaultValue="browser">
        <Tabs.List>
          <Tabs.Tab value="browser" leftSection={<Globe size={14} />}>{t('modal.browser')}</Tabs.Tab>
          <Tabs.Tab value="cookie" leftSection={<Cookie size={14} />}>{t('modal.cookie')}</Tabs.Tab>
          <Tabs.Tab value="bulk" leftSection={<Upload size={14} />}>{t('modal.bulkImport')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="browser" pt="md">
          <Stack gap="md">
            <Text size="xs" c="dimmed">
              {t('modal.browserInfo')}
            </Text>
            <Button variant="filled" color="primary" leftSection={loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} loading={loading} onClick={handleBrowser}>
              {t('modal.openBrowser')}
            </Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="cookie" pt="md">
          <Stack gap="md">
            <Textarea label={t('modal.cookieLabel')} placeholder={t('modal.cookiePlaceholder')} value={cookie} onChange={(e) => setCookie(e.target.value)} minRows={4} maxRows={6} />
            <Button variant="filled" color="primary" leftSection={<Cookie size={14} />} loading={loading} onClick={handleCookie} disabled={!cookie.trim()}>
              {t('modal.addCookie')}
            </Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="bulk" pt="md">
          <Stack gap="md">
            <Text size="xs" c="dimmed">{t('modal.bulkFormat')}</Text>
            <Textarea label={t('modal.bulkLabel')} placeholder={t('modal.bulkPlaceholder')} value={bulkText} onChange={(e) => setBulkText(e.target.value)} minRows={6} maxRows={8} />
            <Button variant="filled" color="primary" leftSection={<Upload size={14} />} loading={loading} onClick={handleBulk} disabled={!bulkText.trim()}>
              {t('modal.import')}
            </Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
