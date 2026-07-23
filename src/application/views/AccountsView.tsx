// Application View: AccountsView — account grid + join bar + detail panel

import { useState, useMemo } from 'react';
import { Shuffle, Plus, Users, LogOut } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { useAccounts } from '../hooks/useAccounts';
import { AccountDetailPanel } from '../components/AccountDetailPanel';
import { Group, Stack, Text, Button, TextInput, ScrollArea, Skeleton, Tooltip, Checkbox } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Account } from '../../domain/entities/Account';

interface AccountsViewProps {
  searchQuery: string;
}

export function AccountsView({ searchQuery }: AccountsViewProps): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const selectedId = useAccountStore((s) => s.selectedId);
  const select = useAccountStore((s) => s.select);
  const update = useAccountStore((s) => s.update);
  const { removeAccount, loginBrowser } = useAccounts();
  const [placeId, setPlaceId] = useState('');
  const [jobId, setJobId] = useState('');
  const [shuffle, setShuffle] = useState(false);

  const selected = useMemo(() => accounts.find((a) => a.id === selectedId) ?? null, [accounts, selectedId]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter((a) =>
      a.username.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const handleLaunch = async () => {
    if (!selected) return;
    let finalJobId = jobId;
    if (shuffle && placeId) {
      finalJobId = Math.random().toString(36).substring(2, 18);
      setJobId(finalJobId);
    }
    const result = await window.api.roblox.launch(selected.id, placeId || undefined, finalJobId || undefined);
    if (result.success) notifications.show({ message: `${selected.username} lanzado`, color: 'green' });
    else notifications.show({ message: result.error ?? 'Error', color: 'red' });
  };

  const handleKillAll = async () => {
    const result = await window.api.roblox.killAll();
    if (result.success) notifications.show({ message: 'Procesos cerrados', color: 'green' });
    else notifications.show({ message: result.error ?? 'Error', color: 'red' });
  };

  const handleRefreshCookie = async () => {
    if (!selected) return;
    const result = await window.api.cookie.refresh(selected.id);
    if (result.success) notifications.show({ message: 'Cookie actualizada', color: 'green' });
    else notifications.show({ message: result.error ?? 'Error', color: 'red' });
  };

  if (accounts.length === 0) {
    return (
      <Stack align="center" justify="center" h="100%" gap="md">
        <Users size={48} style={{ opacity: 0.3 }} />
        <Text size="sm" c="dimmed">No hay cuentas agregadas</Text>
        <Button variant="filled" color="primary" leftSection={<Plus size={16} />} onClick={() => loginBrowser()}>
          Iniciar sesion
        </Button>
      </Stack>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top action bar */}
      <Group h={48} px="md" gap="sm" align="center" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Button variant="light" size="sm" leftSection={<Plus size={14} />} onClick={() => loginBrowser()}>Agregar</Button>
        <Tooltip label="Mezclar Job IDs">
          <Checkbox checked={shuffle} onChange={(e) => setShuffle(e.currentTarget.checked)} label="Shuffle" size="sm" />
        </Tooltip>
        <div style={{ flex: 1 }} />
        <Button variant="light" size="sm" color="red" leftSection={<LogOut size={14} />} onClick={handleKillAll}>Cerrar todos</Button>
      </Group>

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Account grid */}
        <ScrollArea style={{ flex: 1 }} p="md">
          {filtered.length === 0 ? (
            <Stack align="center" justify="center" h={200} gap="sm">
              <Text size="sm" c="dimmed">No se encontraron cuentas</Text>
            </Stack>
          ) : (
            <Stack gap="sm">
              {filtered.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  selected={account.id === selectedId}
                  onSelect={() => select(account.id)}
                  onRemove={() => removeAccount(account.id)}
                  onToggleFavorite={() => {
                    update(account.id, { isFavorite: !account.isFavorite });
                    window.api.account.setFavorite(account.id, !account.isFavorite);
                  }}
                />
              ))}
            </Stack>
          )}
        </ScrollArea>

        {/* Join bar + detail */}
        {selected && (
          <>
            <Group p="md" gap="sm" align="center" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
              <TextInput placeholder="Place ID" value={placeId} onChange={(e) => setPlaceId(e.target.value)} size="sm" style={{ width: 120 }} />
              <TextInput placeholder="Job ID (opcional)" value={jobId} onChange={(e) => setJobId(e.target.value)} size="sm" style={{ width: 120 }} />
              <Button variant="filled" color="primary" size="sm" onClick={handleLaunch} disabled={!placeId.trim()}>
                Unirse
              </Button>
            </Group>
            <AccountDetailPanel
              account={selected}
              onClose={() => select(null)}
              onLaunch={handleLaunch}
              onRefreshCookie={handleRefreshCookie}
              onLogoutAll={() => notifications.show({ message: 'Funcion no disponible', color: 'orange' })}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Inline AccountCard — minimalist with Mantine
import { Card, Badge, ActionIcon, Avatar } from '@mantine/core';
import { Trash2, Star, Play } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => Promise<void>;
  onToggleFavorite: () => void;
}

function AccountCard({ account, selected, onSelect, onRemove, onToggleFavorite }: AccountCardProps): JSX.Element {
  return (
    <Card
      withBorder
      radius="md"
      padding="sm"
      style={{
        cursor: 'pointer',
        borderColor: selected ? 'var(--mantine-color-primary-5)' : undefined,
        borderWidth: selected ? 2 : 1,
      }}
      onClick={onSelect}
    >
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <Avatar size="sm" radius="xl" style={{ backgroundColor: 'var(--mantine-color-gray-4)' }}>
            {account.username.charAt(0).toUpperCase()}
          </Avatar>
          <Stack gap={2}>
            <Text size="sm" fw={500}>{account.username}</Text>
            <Text size="xs" c="dimmed">{account.group}</Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <Badge size="xs" variant="light" color={account.isFavorite ? 'yellow' : 'gray'}>
            {account.cookieExpiresAt ? 'Valida' : 'Expirada'}
          </Badge>
          <ActionIcon variant="subtle" color={account.isFavorite ? 'yellow' : 'gray'} onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
            <Star size={14} fill={account.isFavorite ? 'currentColor' : 'none'} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <Trash2 size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );
}
