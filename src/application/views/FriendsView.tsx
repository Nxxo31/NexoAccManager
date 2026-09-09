// Application View: FriendsView — friends, requests, send requests, follow/unfollow — Mantine v7

import { useState, useEffect, useCallback } from 'react';
import { useAccountStore } from '../store/accountStore';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Badge, Button, Select, SegmentedControl, Card, ScrollArea, ActionIcon, Avatar, Skeleton, TextInput } from '@mantine/core';
import { UserPlus, UserMinus, Check, X, Send } from 'lucide-react';
import { t } from '../../config/i18n';

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
  const api = typeof window !== 'undefined' ? window.api : undefined;
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');

  useEffect(() => {
    if (selectedAccountId && api) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, api, activeTab]);

  const loadData = useCallback(async () => {
      if (!selectedAccountId || !api) return;
      setLoading(true);
      try {
        if (activeTab === 'friends') {
          const result = await api.byAccount.friendsList(selectedAccountId);
          if (result.success) setFriends(Array.isArray(result.data) ? result.data : []);
          else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
        } else {
          const result = await api.byAccount.friendsRequests(selectedAccountId);
          if (result.success) setRequests(Array.isArray(result.data) ? result.data : []);
          else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
        }
      } catch {
        notifications.show({ message: t('friends.loadError'), color: 'red' });
      } finally {
        setLoading(false);
      }
  }, [selectedAccountId, api, activeTab]);

  const handleRespond = useCallback(async (requestId: number, accept: boolean) => {
    if (!api) return;
    try {
      const result = await api.byAccount.friendsRespond(requestId, accept, selectedAccountId);
      if (result.success) {
        notifications.show({ message: accept ? t('friends.requestAccepted') : t('friends.requestRejected'), color: 'green' });
        setRequests(requests.filter((r) => r.id !== requestId));
      } else {
        notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
      }
    } catch {
      notifications.show({ message: t('friends.loadError'), color: 'red' });
    }
  }, [api, selectedAccountId, requests]);

  const handleFollowToggle = useCallback(async (userId: number, isFollowing: boolean) => {
    if (!api) return;
    try {
      const fn = isFollowing ? api.byAccount.unfollow : api.byAccount.follow;
      const result = await fn(userId, selectedAccountId);
      if (result.success) {
        notifications.show({ message: isFollowing ? t('friends.unfollowed') : t('friends.nowFollowing'), color: 'green' });
      } else {
        notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
      }
    } catch {
      notifications.show({ message: t('friends.loadError'), color: 'red' });
    }
  }, [api, selectedAccountId]);

  const handleSendRequest = useCallback(async () => {
    if (!api) return;
    try {
      const userIdNum = parseInt(searchUserId, 10);
      if (!userIdNum || isNaN(userIdNum)) {
        notifications.show({ message: t('friends.invalidUserId'), color: 'red' });
        return;
      }
      const result = await api.byAccount.sendFriendRequest(userIdNum, selectedAccountId);
      if (result.success) {
        notifications.show({ message: t('friends.requestSent'), color: 'green' });
        setSearchUserId('');
      } else {
        notifications.show({ message: result.error ?? t('friends.requestSendError'), color: 'red' });
      }
    } catch {
      notifications.show({ message: t('friends.loadError'), color: 'red' });
    }
  }, [api, selectedAccountId, searchUserId]);

  if (accounts.length === 0) {
     return (
      <Stack align="center" justify="center" h="100%">
        <Text c="dimmed">{t('friends.addAccountFirst')}</Text>
      </Stack>
    );
  }

  const accountData = accounts.map((acc) => ({ value: acc.id, label: acc.username }));

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>
        {t('friends.title')}
        {selectedAccountId && activeTab === 'friends' && (
          <span> ({t('friends.onlineCount', { count: friends.filter(f => f.isOnline).length })})</span>
        )}
      </Text>
      <Select
        placeholder={t('friends.selectAccount')}
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
          { value: 'friends', label: t('friends.tabFriends') },
          { value: 'requests', label: t('friends.tabRequests') },
          { value: 'send', label: t('friends.tabSend') },
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
          <Text c="dimmed" ta="center" pt="xl">
            {t('friends.selectToView')}
          </Text>
        )}

        {/* Send friend request tab */}
        {!loading && selectedAccountId && activeTab === 'send' && (
          <Stack gap="md" p="sm">
            <Text size="sm" c="dimmed">
              {t('friends.sendRequestInfo')}
            </Text>
            <Group gap="sm">
              <TextInput
                placeholder={t('friends.userIdPlaceholder')}
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.currentTarget.value)}
                leftSection={<UserPlus size={14} />}
                size="sm"
                style={{ flex: 1 }}
              />
              <Button variant="filled" color="primary" size="sm" leftSection={<Send size={14} />} onClick={handleSendRequest}>
                {t('friends.send')}
              </Button>
            </Group>
          </Stack>
        )}

        {/* Friends list */}
        {!loading && selectedAccountId && activeTab === 'friends' && (
          <Stack gap="sm">
            {friends.length === 0 ? (
              <Text c="dimmed" ta="center" pt="xl">{t('friends.noFriends')}</Text>
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
                      {/* A-003: Color como unico indicador - anadir texto a online/offline badge */}
                      <Badge size="xs" variant="light" color={f.isOnline ? 'green' : 'gray'}>
                        {f.isOnline ? t('friends.online') : t('friends.offline')}
                      </Badge>
                    </Group>
                    <ActionIcon variant="subtle" color="gray" onClick={() => handleFollowToggle(f.userId, true)} aria-label={t('friends.unfollow')}>
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
              <Text c="dimmed" ta="center" pt="xl">{t('friends.noRequests')}</Text>
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
                        {t('friends.accept')}
                      </Button>
                      <Button size="xs" variant="light" color="red" leftSection={<X size={14} />} onClick={() => handleRespond(r.id, false)}>
                        {t('friends.reject')}
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
