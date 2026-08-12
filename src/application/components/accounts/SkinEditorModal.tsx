// SkinEditorModal.tsx — Modal para editar skin/accesorios de la cuenta de Roblox
// Placeholder: muestra el avatar actual y permite cargar outfit desde URL/asset ID
// TODO: integrar con Roblox API para obtener/editar avatar assets

import { useState } from 'react';
import { Modal, Stack, Group, Text, TextInput, Button, Avatar, Divider, Alert } from '@mantine/core';
import { Shirt, Info, Download, RefreshCw } from 'lucide-react';
import { t } from '../../../config/i18n';
import type { Account } from '../../../domain/entities/Account';

interface SkinEditorModalProps {
  account: Account | null;
  opened: boolean;
  onClose: () => void;
}

export function SkinEditorModal({ account, opened, onClose }: SkinEditorModalProps): JSX.Element | null {
  const [assetId, setAssetId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!account) return null;

  const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${account.id}&width=150&height=150&format=png`;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Shirt size={18} />
          <Text fw={600}>{t('accounts.skinEditor')} — {account.username}</Text>
        </Group>
      }
      size="md"
      centered
    >
      <Stack gap="md">
        {/* Current avatar preview */}
        <Group justify="center">
          <Avatar
            size={120}
            radius="md"
            src={avatarUrl}
            style={{ border: '2px solid var(--mantine-color-primary-5)' }}
          >
            {account.username.charAt(0).toUpperCase()}
          </Avatar>
        </Group>

        <Divider label={t('accounts.skinLoadOutfit')} labelPosition="center" />

        {/* Asset ID input */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>{t('accounts.skinAssetId')}</Text>
          <TextInput
            placeholder="1234567890"
            value={assetId}
            onChange={(e) => setAssetId(e.currentTarget.value)}
            leftSection={<Shirt size={14} />}
          />
          <Text size="xs" c="dimmed">{t('accounts.skinAssetIdHelp')}</Text>
        </Stack>

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            leftSection={<Download size={14} />}
            loading={loading}
            onClick={() => {
              setLoading(true);
              // TODO: call IPC handler to apply outfit via Roblox API
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            {t('accounts.skinApply')}
          </Button>
        </Group>

        <Alert icon={<Info size={16} />} color="blue" variant="light">
          {t('accounts.skinComingSoon')}
        </Alert>
      </Stack>
    </Modal>
  );
}
