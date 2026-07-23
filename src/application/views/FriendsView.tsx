// Application View: FriendsView — friend list, requests, follow/unfollow — Mantine v7

import { useState, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Badge, Button, Select, SegmentedControl, Card, ScrollArea, ActionIcon, Avatar, Skeleton } from '@mantine/core';
import { UserPlus, UserMinus, Check, X } from 'lucide-react';

interface Friend {
  userId: number;
  username: string;
  displayName: string;
  isOnline: boolean;
}

interface FriendRequest {
  id: number;
  requesterId: number;
  username: string;
  displayName: string;
}

export function FriendsView(): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId) loadData();
  }, [selectedAccountId, activeTab]);

  const loadData = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const result = await window.api.byAccount.friendsList(selectedAccountId);
        if (result.success) setFriends(Array.isArray(result.data) ? result.data : []);
        else notifications.show({ message: result.error ?? 'Error', color: 'red' });
      } else {
        const result = await window.api.byAccount.friendsRequests(selectedAccountId);
        if (result.success) setRequests(Array.isArray(result.data) ? result.data : []);
        else notifications.show({ message: result.error ?? 'Error', color: 'red' });
      }
    } catch {
      notifications.show({ message: 'Error al cargar datos', color: 'red' });
    }
    setLoading(false);
  };

  const handleRespond = async (requestId: number, accept: boolean) => {
    const result = await window.api.byAccount.friendsRespond(requestId, accept, selectedAccountId);
    if (result.success) {
      notifications.show({ message: accept ? 'Solicitud aceptada' : 'Solicitud rechazada', color: 'green' });
      setRequests(requests.filter((r) => r.id !== requestId));
    } else {
      notifications.show({ message: result.error ?? 'Error', color: 'red' });
    }
  };

  const handleFollowToggle = async (userId: number, isFollowing: boolean) => {
    const fn = isFollowing ? window.api.byAccount.unfollow : window.api.byAccount.follow;
    const result = await fn(userId, selectedAccountId);
    if (result.success) {
      notifications.show({ message: isFollowing ? 'Dejaste de seguir' : 'Ahora sigues a este usuario', color: 'green' });
    } else {
      notifications.show({ message: result.error ?? 'Error', color: 'red' });
    }
  };

  if (accounts.length === 0) {
    return (
      <Stack align="center" justify="center" h="100%">
        <Text c="dimmed">Agrega una cuenta primero para ver amigos.</Text>
      </Stack>
    );
  }

  const accountData = accounts.map((acc) => ({ value: acc.id, label: acc.username }));

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>Amigos</Text>

      <Select
        placeholder="Seleccionar cuenta..."
        value={selectedAccountId}
        onChange={(val) => setSelectedAccountId(val ?? '')}
        data={accountData}
        size="sm"
        searchable
      />

      <SegmentedControl
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
        data={[
          { value: 'friends', label: 'Amigos' },
          { value: 'requests', label: 'Solicitudes' },
        ]}
        size="sm"
      />

      <ScrollArea style={{ flex: 1 }}>
        {loading && (
          <Stack gap="sm">
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
          </Stack>
        )}

        {!loading && !selectedAccountId && (
          <Text c="dimmed" ta="center" pt="xl">Selecciona una cuenta para ver su informacion.</Text>
        )}

        {/* Friends list */}
        {!loading && selectedAccountId && activeTab === 'friends' && (
          <Stack gap="sm">
            {friends.length === 0 ? (
              <Text c="dimmed" ta="center" pt="xl">Sin amigos para mostrar.</Text>
            ) : (
              friends.map((f) => (
                <Card key={f.userId} withBorder padding="sm" radius="md">
                  <Group justify="space-between" align="center">
                    <Group gap="sm" align="center">
                      <Avatar size="sm" radius="xl" style={{ backgroundColor: f.isOnline ? 'var(--mantine-color-green-2)' : 'var(--mantine-color-gray-3)' }}>
                        {f.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Stack gap={2}>
                        <Text size="sm" fw={500}>{f.displayName}</Text>
                        <Text size="xs" c="dimmed">@{f.username}</Text>
                      </Stack>
                      <Badge size="xs" variant="light" color={f.isOnline ? 'green' : 'gray'}>
                        {f.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </Group>
                    <ActionIcon variant="subtle" color="gray" onClick={() => handleFollowToggle(f.userId, true)}>
                      <UserMinus size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))
            )}
          </Stack>
        )}

        {/* Requests list */}
        {!loading && selectedAccountId && activeTab === 'requests' && (
          <Stack gap="sm">
            {requests.length === 0 ? (
              <Text c="dimmed" ta="center" pt="xl">Sin solicitudes pendientes.</Text>
            ) : (
              requests.map((r) => (
                <Card key={r.id} withBorder padding="sm" radius="md">
                  <Group justify="space-between" align="center">
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>{r.displayName}</Text>
                      <Text size="xs" c="dimmed">@{r.username}</Text>
                    </Stack>
                    <Group gap="xs">
                      <Button size="xs" variant="filled" color="green" leftSection={<Check size={14} />} onClick={() => handleRespond(r.id, true)}>
                        Aceptar
                      </Button>
                      <Button size="xs" variant="light" color="red" leftSection={<X size={14} />} onClick={() => handleRespond(r.id, false)}>
                        Rechazar
                      </Button>
                    </Group>
                  </Group>
                </Card>
              ))
            )}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
}
