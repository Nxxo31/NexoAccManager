// Application Component: AccountDetailPanel — slide-in detail with inventory/outfits — Mantine v7

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye } from 'lucide-react';
import { Group, Stack, Text, Badge, Button, ActionIcon, Card, ScrollArea, Skeleton, Image as MantineImage, Avatar } from '@mantine/core';
import type { Account } from '../../domain/entities/Account';

interface Outfit {
  id: number;
  name: string;
  thumbnailUrl?: string;
}

interface AccountDetailPanelProps {
  account: Account;
  onClose: () => void;
  onLaunch: () => void;
  onRefreshCookie: () => void;
  onLogoutAll: () => void;
}

export function AccountDetailPanel({ account, onClose, onLaunch, onRefreshCookie, onLogoutAll }: AccountDetailPanelProps): JSX.Element {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOutfits();
  }, [account.id]);

  const loadOutfits = async () => {
    setLoading(true);
    try {
      const result = await window.api.byAccount.outfits(account.id);
      if (result.success) setOutfits(Array.isArray(result.data) ? result.data : []);
      else setOutfits([]);
    } catch {
      setOutfits([]);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          width: 320,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="sm">
            <Avatar size="md" radius="xl" style={{ backgroundColor: 'var(--mantine-color-gray-4)' }}>
              {account.username.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={2}>
              <Text size="sm" fw={500}>{account.username}</Text>
              {account.group && <Badge size="xs" variant="light" color="blue">{account.group}</Badge>}
            </Stack>
          </Group>
          <ActionIcon variant="subtle" color="gray" onClick={onClose}>
            <X size={16} />
          </ActionIcon>
        </Group>

        {/* Details */}
        <ScrollArea style={{ flex: 1 }} p="md">
          <Stack gap="md">
            {/* Description */}
            {account.description && (
              <Card withBorder padding="sm" radius="md">
                <Text size="xs" c="dimmed" mb={4}>Descripcion</Text>
                <Text size="sm">{account.description}</Text>
              </Card>
            )}

            {/* Actions */}
            <Group gap="xs">
              <Button variant="filled" color="primary" size="xs" fullWidth onClick={onLaunch}>
                Lanzar Roblox
              </Button>
              <Button variant="light" size="xs" fullWidth onClick={onRefreshCookie}>
                Actualizar cookie
              </Button>
            </Group>

            {/* Inventory / Outfits */}
            <div>
              <Group gap="xs" mb="sm">
                <Eye size={14} />
                <Text size="sm" fw={500}>Apariencia / Atuendos</Text>
              </Group>
              {loading ? (
                <Stack gap="xs">
                  <Skeleton height={80} radius="md" />
                  <Skeleton height={80} radius="md" />
                </Stack>
              ) : outfits.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center" pt="md">
                  No se pudieron cargar los atuendos. La cuenta puede no tener atuendos guardados.
                </Text>
              ) : (
                <Stack gap="xs">
                  {outfits.map((outfit) => (
                    <Card key={outfit.id} withBorder padding="sm" radius="md">
                      <Group gap="sm" align="center">
                        {outfit.thumbnailUrl ? (
                          <MantineImage src={outfit.thumbnailUrl} w={48} h={48} radius="md" fit="cover" />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 'var(--mantine-radius-md)', backgroundColor: 'var(--mantine-color-gray-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={20} style={{ opacity: 0.3 }} />
                          </div>
                        )}
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>{outfit.name}</Text>
                          <Text size="xs" c="dimmed">ID: {outfit.id}</Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </div>
          </Stack>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
