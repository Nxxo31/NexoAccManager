// SkinEditorModal.tsx — Modal para editar skin/accesorios de la cuenta de Roblox
//
// Flujo:
//  1. Al abrir, llama a `byAccount.outfits(accountId)` y lista los outfits guardados.
//  2. El usuario selecciona uno (o escribe un assetId) y pulsa "Aplicar".
//  3. Llama a `byAccount.applyOutfit(accountId, outfitId)`, que resuelve la
//     cookie internamente (nunca sale del main process) y hace POST a
//     avatar.roblox.com/v1/outfits/{id}/wear.
//  4. Notificación verde si Roblox aceptó; roja si cookie inválida u outfit ajeno.
//
// La cookie cruda nunca cruza el bridge — server-side resolution (audit F-002).

import { useEffect, useState, useCallback } from 'react';
import { Modal, Stack, Group, Text, TextInput, Button, Avatar, Divider, Alert, ScrollArea, Card, Badge } from '@mantine/core';
import { Shirt, Info, Loader2, Check } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { t } from '../../../config/i18n';
import type { Account } from '../../../domain/entities/Account';

interface OutfitInfo {
  assetId: number;
  name: string;
  thumbnailUrl?: string;
  isFree?: boolean;
}

interface SkinEditorModalProps {
  account: Account | null;
  opened: boolean;
  onClose: () => void;
}

export function SkinEditorModal({ account, opened, onClose }: SkinEditorModalProps): JSX.Element | null {
  const [outfits, setOutfits] = useState<OutfitInfo[]>([]);
  const [loadingOutfits, setLoadingOutfits] = useState(false);
  const [manualAssetId, setManualAssetId] = useState('');
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  // Load outfits when the modal opens for a given account
  useEffect(() => {
    if (!opened || !account || !window.api) {
      setOutfits([]);
      setSelectedOutfitId(null);
      return;
    }
    setLoadingOutfits(true);
    window.api.byAccount.outfits(account.id)
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setOutfits(result.data as OutfitInfo[]);
        } else {
          setOutfits([]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!(result as any).success && (result as any).error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            notifications.show({ message: (result as any).error as string, color: 'red' });
          }
        }
      })
      .catch(() => setOutfits([]))
      .finally(() => setLoadingOutfits(false));
  }, [opened, account]);

  const handleApply = useCallback(async () => {
    if (!account || !window.api) return;
    // Prefer selected outfit from list; fall back to manual assetId input
    const outfitId = selectedOutfitId ?? Number(manualAssetId.trim());
    if (!Number.isFinite(outfitId) || outfitId <= 0) {
      notifications.show({ message: t('accounts.skinInvalidId'), color: 'red' });
      return;
    }
    setApplying(true);
    try {
      const result = await window.api.byAccount.applyOutfit(account.id, outfitId);
      if (result.success) {
        notifications.show({
          message: t('accounts.skinApplied', { name: account.username }),
          color: 'green',
          icon: <Check size={14} />,
        });
        onClose();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errMsg = (result as any).error as string | undefined;
        notifications.show({
          message: errMsg ?? t('accounts.skinApplyFailed'),
          color: 'red',
        });
      }
    } catch (e) {
      notifications.show({
        message: e instanceof Error ? e.message : t('accounts.skinApplyFailed'),
        color: 'red',
      });
    } finally {
      setApplying(false);
    }
  }, [account, selectedOutfitId, manualAssetId, onClose]);

  if (!account) return null;

  const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${encodeURIComponent(String(account.robloxUserId))}&width=150&height=150&format=png`;
  const canApply = (selectedOutfitId !== null || /^\d+$/.test(manualAssetId.trim())) && !applying;

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
      size="lg"
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

        {/* Saved outfits list (from byAccount.outfits) */}
        {loadingOutfits ? (
          <Group justify="center" gap="xs"><Loader2 size={14} className="animate-spin" /><Text size="sm">Cargando outfits...</Text></Group>
        ) : outfits.length > 0 ? (
          <ScrollArea h={200}>
            <Stack gap="xs">
              {outfits.map((outfit) => (
                <Card
                  key={outfit.assetId}
                  withBorder
                  padding="xs"
                  radius="sm"
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedOutfitId === outfit.assetId
                      ? 'var(--mantine-color-primary-5)'
                      : undefined,
                    borderWidth: selectedOutfitId === outfit.assetId ? 2 : 1,
                  }}
                  onClick={() => setSelectedOutfitId(outfit.assetId)}
                >
                  <Group gap="sm" align="center" wrap="nowrap">
                    {outfit.thumbnailUrl ? (
                      <Avatar src={outfit.thumbnailUrl} size="sm" radius="sm" />
                    ) : (
                      <Avatar size="sm" radius="sm"><Shirt size={12} /></Avatar>
                    )}
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>{outfit.name}</Text>
                      <Text size="xs" c="dimmed">ID: {outfit.assetId}</Text>
                    </Stack>
                    {outfit.isFree && <Badge size="xs" color="green" variant="light">Free</Badge>}
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        ) : (
          <Alert color="gray" variant="light">
            Esta cuenta no tiene outfits guardados en Roblox. Pega un asset ID abajo.
          </Alert>
        )}

        <Divider label="o asset ID manual" labelPosition="center" />

        {/* Manual asset ID input */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>{t('accounts.skinAssetId')}</Text>
          <TextInput
            placeholder="1234567890"
            value={manualAssetId}
            onChange={(e) => { setManualAssetId(e.currentTarget.value); setSelectedOutfitId(null); }}
            leftSection={<Shirt size={14} />}
          />
          <Text size="xs" c="dimmed">{t('accounts.skinAssetIdHelp')}</Text>
        </Stack>

        <Alert icon={<Info size={16} />} color="blue" variant="light">
          El outfit se aplica en el avatar web de Roblox (no requiere tener el juego abierto).
          La cookie nunca sale de este equipo.
        </Alert>

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose} disabled={applying}>{t('common.cancel')}</Button>
          <Button
            variant="filled"
            color="primary"
            leftSection={applying ? <Loader2 size={14} className="animate-spin" /> : <Shirt size={14} />}
            onClick={handleApply}
            disabled={!canApply}
          >
            {applying ? 'Aplicando...' : t('accounts.skinApply')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}