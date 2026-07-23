// Application Component: AddAccountModal — Mantine v7

import { useState } from 'react';
import { Globe, Cookie, Upload, Loader2 } from 'lucide-react';
import { Modal, Tabs, TextInput, Textarea, Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAccounts } from '../hooks/useAccounts';

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
    notifications.show({ message: 'Abriendo navegador de login...', color: 'blue' });
    await onLoginBrowser();
    setLoading(false);
    onClose();
  };

  const handleCookie = async () => {
    if (!cookie.trim()) { notifications.show({ message: 'Pega una cookie valida', color: 'red' }); return; }
    setLoading(true);
    const result = await addAccount(cookie.trim());
    if (result.success) { setCookie(''); onClose(); }
    setLoading(false);
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
      notifications.show({ message: 'Formato: usuario:password por linea', color: 'red' });
      setLoading(false);
      return;
    }

    let added = 0;
    for (const a of accounts) {
      try {
        const loginResult = await window.api.account.login(a.username, a.password);
        if (loginResult.success) {
          const cookieResult = (loginResult as { data: { cookie: string } }).data?.cookie;
          if (cookieResult) {
            const addResult = await addAccount(cookieResult);
            if (addResult.success) added++;
          }
        }
      } catch { /* skip */ }
    }
    notifications.show({ message: `${added} cuentas agregadas`, color: added > 0 ? 'green' : 'red' });
    if (added > 0) { setBulkText(''); onClose(); }
    setLoading(false);
  };

  return (
    <Modal opened={open} onClose={onClose} title="Agregar cuenta" size="md" centered>
      <Tabs defaultValue="browser">
        <Tabs.List>
          <Tabs.Tab value="browser" leftSection={<Globe size={14} />}>Navegador</Tabs.Tab>
          <Tabs.Tab value="cookie" leftSection={<Cookie size={14} />}>Cookie</Tabs.Tab>
          <Tabs.Tab value="bulk" leftSection={<Upload size={14} />}>Bulk Import</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="browser" pt="md">
          <Stack gap="md">
            <Text size="xs" c="dimmed">
              Se abrira un navegador para iniciar sesion en Roblox. La cookie se capturara automaticamente.
            </Text>
            <Button variant="filled" color="primary" leftSection={loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} loading={loading} onClick={handleBrowser}>
              Abrir navegador
            </Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="cookie" pt="md">
          <Stack gap="md">
            <Textarea label="Cookie .ROBLOSECURITY" placeholder="Pega la cookie aqui..." value={cookie} onChange={(e) => setCookie(e.target.value)} minRows={4} maxRows={6} />
            <Button variant="filled" color="primary" leftSection={<Cookie size={14} />} loading={loading} onClick={handleCookie} disabled={!cookie.trim()}>
              Agregar cookie
            </Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="bulk" pt="md">
          <Stack gap="md">
            <Text size="xs" c="dimmed">Formato: una cuenta por linea como usuario:password</Text>
            <Textarea label="Cuentas (usuario:password)" placeholder="usuario1:password1&#10;usuario2:password2" value={bulkText} onChange={(e) => setBulkText(e.target.value)} minRows={6} maxRows={8} />
            <Button variant="filled" color="primary" leftSection={<Upload size={14} />} loading={loading} onClick={handleBulk} disabled={!bulkText.trim()}>
              Importar
            </Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
