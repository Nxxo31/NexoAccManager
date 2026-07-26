// Application View: AccountsView — account grid with groups + editable description — Mantine v7

import { useState, useMemo, useEffect } from 'react';
import { Plus, Users, LogOut, Tag } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { useAccounts } from '../hooks/useAccounts';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountDetailPanel } from '../components/AccountDetailPanel';
import { Group, Stack, Text, Button, TextInput, ScrollArea, Tooltip, Checkbox, Modal, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import type { Account } from '../../domain/entities/Account';
import { t } from '../../config/i18n';

interface AccountsViewProps {
  searchQuery: string;
}

export function AccountsView({ searchQuery }: AccountsViewProps): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const selectedId = useAccountStore((s) => s.selectedId);
  const select = useAccountStore((s) => s.select);
  const update = useAccountStore((s) => s.update);
  const { removeAccount, loginBrowser } = useAccounts();
  const api = typeof window !== 'undefined' ? window.api : undefined;
  const [placeId, setPlaceId] = useState('');
  const [jobId, setJobId] = useState('');
  const [shuffle, setShuffle] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editGroup, setEditGroup] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [togglingFavorites, setTogglingFavorites] = useState<Set<string>>(new Set());
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search input — 300ms wait before filtering
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selected = useMemo(() => accounts.find((a) => a.id === selectedId) ?? null, [accounts, selectedId]);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return accounts;
    const q = debouncedQuery.toLowerCase();
    return accounts.filter((a) =>
      a.username.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q)
    );
  }, [accounts, debouncedQuery]);

  const handleLaunch = async () => {
    if (!selected || !api) return;
    let finalJobId = jobId;
    if (shuffle && placeId) {
      finalJobId = Math.random().toString(36).substring(2, 18);
      setJobId(finalJobId);
    }
    try {
      const result = await api.roblox.launch(selected.id, placeId || undefined, finalJobId || undefined);
      if (result.success) notifications.show({ message: t('accounts.launched', { name: selected.username }), color: 'green' });
      else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
    } catch {
      notifications.show({ message: t('common.error'), color: 'red' });
    }
  };

  const handleKillAll = async () => {
    if (!api) return;
    try {
      const result = await api.roblox.killAll();
      if (result.success) notifications.show({ message: t('accounts.processesClosed'), color: 'green' });
      else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
    } catch {
      notifications.show({ message: t('common.error'), color: 'red' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editAccount || !api) return;
    try {
      await api.account.fieldSet(editAccount.id, 'group', editGroup);
      await api.account.fieldSet(editAccount.id, 'description', editDesc);
      update(editAccount.id, { group: editGroup, description: editDesc });
      notifications.show({ message: t('accounts.updated'), color: 'green' });
      setEditAccount(null);
    } catch {
      notifications.show({ message: t('accounts.updateError'), color: 'red' });
    }
  };

  const openEdit = (account: Account) => {
    setEditAccount(account);
    setEditGroup(account.group ?? '');
    setEditDesc(account.description ?? '');
  };

  // U-002: Confirmation dialog for account deletion
  const handleRemoveAccount = async (accountId: string, account: Account) => {
    setRemovingIds(new Set([...removingIds, accountId]));
    try {
      await removeAccount(accountId);
    } catch {
      notifications.show({ message: t('accounts.deleteError'), color: 'red' });
    } finally {
      setRemovingIds(new Set([...removingIds].filter(id => id !== accountId)));
    }
  };

  const confirmRemoveAccount = (account: Account) => {
    modals.openConfirmModal({
      title: t('accounts.deleteConfirmTitle'),
      children: (
        <Text size="sm">
          {t('accounts.deleteConfirmBody', { name: account.username })}
        </Text>
      ),
      labels: { confirm: t('accounts.delete'), cancel: t('accounts.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => handleRemoveAccount(account.id, account),
    });
  };

  // U-006: Handle favorite toggle with error handling
  const handleToggleFavorite = async (account: Account) => {
    const newFavoriteState = !account.isFavorite;
    const accountId = account.id;

    // Optimistic update
    update(accountId, { isFavorite: newFavoriteState });
    setTogglingFavorites(new Set([...togglingFavorites, accountId]));

    try {
      const result = await api?.account.setFavorite(accountId, newFavoriteState);
      if (!result?.success) {
        // Revert on failure
        update(accountId, { isFavorite: account.isFavorite });
        notifications.show({ message: result?.error ?? t('accounts.favoriteToggleError'), color: 'red' });
      }
    } catch {
      // Revert on error
      update(accountId, { isFavorite: account.isFavorite });
      notifications.show({ message: t('accounts.favoriteToggleError'), color: 'red' });
    } finally {
      setTogglingFavorites(new Set([...togglingFavorites].filter(id => id !== accountId)));
    }
  };

  if (accounts.length === 0) {
    return (
      <Stack align="center" justify="center" h="100%" gap="md">
        <Users size={48} style={{ opacity: 0.3 }} />
        <Text size="sm" c="dimmed">{t('accounts.empty')}</Text>
        <Button variant="filled" color="primary" leftSection={<Plus size={16} />} onClick={() => loginBrowser()}>
          {t('accounts.signIn')}
        </Button>
      </Stack>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top action bar */}
      <Group h={48} px="md" gap="sm" align="center" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Button variant="light" size="sm" leftSection={<Plus size={14} />} onClick={() => loginBrowser()}>{t('accounts.add')}</Button>
        <Tooltip label={t('accounts.shuffleTooltip')}>
          <Checkbox checked={shuffle} onChange={(e) => setShuffle(e.currentTarget.checked)} label={t('accounts.shuffle')} size="sm" />
        </Tooltip>
        <div style={{ flex: 1 }} />
        <Button variant="light" size="sm" color="red" leftSection={<LogOut size={14} />} onClick={handleKillAll}>{t('accounts.killAll')}</Button>
      </Group>

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Account grid */}
        <ScrollArea style={{ flex: 1 }} p="md">
          {filtered.length === 0 ? (
            <Stack align="center" justify="center" h={200} gap="sm">
              <Text size="sm" c="dimmed">{t('accounts.noResults')}</Text>
            </Stack>
          ) : (
            <Stack gap="sm">
              {filtered.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  selected={account.id === selectedId}
                  onSelect={() => select(account.id)}
                  onRemove={() => confirmRemoveAccount(account)}
                  onToggleFavorite={() => handleToggleFavorite(account)}
                  onEdit={() => openEdit(account)}
                  isRemoving={removingIds.has(account.id)}
                  isTogglingFavorite={togglingFavorites.has(account.id)}
                />
              ))}
            </Stack>
          )}
        </ScrollArea>

        {/* Join bar + detail */}
        {selected && (
          <>
            <Group p="md" gap="sm" align="center" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
              <TextInput placeholder={t('accounts.placeId')} value={placeId} onChange={(e) => setPlaceId(e.target.value)} size="sm" style={{ width: 120 }} />
              <Button variant="filled" color="primary" size="sm" onClick={handleLaunch} disabled={!placeId.trim()}>
                {t('accounts.join')}
              </Button>
            </Group>
            <AccountDetailPanel
              account={selected}
              onClose={() => select(null)}
              onLaunch={handleLaunch}
              onRefreshCookie={async () => {
                const result = await api?.cookie.refresh(selected.id);
                if (result?.success) notifications.show({ message: t('accounts.cookieRefreshed'), color: 'green' });
                else notifications.show({ message: result?.error ?? t('common.error'), color: 'red' });
              }}
              onLogoutAll={() => notifications.show({ message: t('accounts.functionUnavailable'), color: 'orange' })}
            />
          </>
        )}
      </div>

      {/* Edit modal — group + description */}
      <Modal opened={editAccount !== null} onClose={() => setEditAccount(null)} title={t('accounts.editTitle')} size="sm">
        <Stack gap="md">
          <TextInput
            label={t('accounts.group')}
            placeholder={t('accounts.groupPlaceholder')}
            value={editGroup}
            onChange={(e) => setEditGroup(e.currentTarget.value)}
            leftSection={<Tag size={14} />}
            size="sm"
          />
          <Textarea
            label={t('accounts.description')}
            placeholder={t('accounts.descriptionPlaceholder')}
            value={editDesc}
            onChange={(e) => setEditDesc(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={4}
            size="sm"
          />
          <Button variant="filled" color="primary" size="sm" onClick={handleSaveEdit} fullWidth>
            {t('accounts.save')}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
