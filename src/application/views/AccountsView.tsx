// Application View: AccountsView — account grid with groups + editable description — Mantine v7

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Users, LogOut, Tag } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { useLaunchStore } from '../store/launchStore';
import { useAccounts } from '../hooks/useAccounts';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountDetailPanel } from '../components/AccountDetailPanel';
import { Group, Stack, Text, Button, TextInput, ScrollArea, Tooltip, Checkbox, Modal, Textarea, FocusTrap } from '@mantine/core';
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
  // Launch state ahora vive en launchStore — propagado desde GamesView
  const placeId = useLaunchStore((s) => s.selectedPlaceId);
  const shuffle = useLaunchStore((s) => s.shuffle);
  const setShuffle = useLaunchStore((s) => s.setShuffle);
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

  const handleLaunch = useCallback(async () => {
    if (!selected || !api) return;
    let finalJobId: string | undefined;
    if (shuffle && placeId) {
      // Shuffle: obtener un jobId aleatorio via API (cookie resuelta en main process)
      const shuffleResult = await api.roblox.shuffleJobIdByAccount(placeId, selected.id);
      if (!shuffleResult.success) {
        notifications.show({ message: shuffleResult.error ?? t('common.error'), color: 'red' });
        return;
      }
      finalJobId = shuffleResult.data as string;
    }
    try {
      const result = await api.roblox.launch(selected.id, placeId || undefined, finalJobId);
      if (result.success) notifications.show({ message: t('accounts.launched', { name: selected.username }), color: 'green' });
      else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
    } catch {
      notifications.show({ message: t('common.error'), color: 'red' });
    }
  }, [selected, api, shuffle, placeId]);

  const handleKillAll = useCallback(async () => {
    modals.openConfirmModal({
      title: t('accounts.killAllConfirmTitle'),
      children: (
        <Text size="sm">
          {t('accounts.killAllConfirmBody')}
        </Text>
      ),
      labels: { confirm: t('accounts.killAll'), cancel: t('accounts.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        if (!api) return;
        try {
          const result = await api.roblox.killAll();
          if (result.success) notifications.show({ message: t('accounts.processesClosed'), color: 'green' });
          else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
        } catch {
          notifications.show({ message: t('common.error'), color: 'red' });
        }
      },
    });
  }, [api]);

  const handleSaveEdit = useCallback(async () => {
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
  }, [editAccount, api, editGroup, editDesc, update]);

  const openEdit = useCallback((account: Account) => {
    setEditAccount(account);
    setEditGroup(account.group ?? '');
    setEditDesc(account.description ?? '');
  }, []);

  // U-002: Confirmation dialog for account deletion
  const handleRemoveAccount = useCallback(async (accountId: string) => {
    setRemovingIds((prev) => new Set([...prev, accountId]));
    try {
      await removeAccount(accountId);
    } catch {
      notifications.show({ message: t('accounts.deleteError'), color: 'red' });
    } finally {
      setRemovingIds((prev) => new Set([...prev].filter((id) => id !== accountId)));
    }
  }, [removeAccount]);

  const confirmRemoveAccount = useCallback((account: Account) => {
    modals.openConfirmModal({
      title: t('accounts.deleteConfirmTitle'),
      children: (
        <Text size="sm">
          {t('accounts.deleteConfirmBody', { name: account.username })}
        </Text>
      ),
      labels: { confirm: t('accounts.delete'), cancel: t('accounts.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => handleRemoveAccount(account.id),
    });
  }, [handleRemoveAccount]);

  // U-006: Handle favorite toggle with error handling
  const handleToggleFavorite = useCallback(async (account: Account) => {
    const newFavoriteState = !account.isFavorite;
    const accountId = account.id;

    // Optimistic update
    update(accountId, { isFavorite: newFavoriteState });
    setTogglingFavorites((prev) => new Set([...prev, accountId]));

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
      setTogglingFavorites((prev) => new Set([...prev].filter((id) => id !== accountId)));
    }
  }, [api, update]);

  // Stable callbacks passed to AccountCard (account arg) so React.memo works.
  const handleCardSelect = useCallback((account: Account) => select(account.id), [select]);
  const handleCardRemove = useCallback((account: Account) => confirmRemoveAccount(account), [confirmRemoveAccount]);

  // P-002: Stable callbacks for AccountDetailPanel — prevents re-renders when
  // AccountsView state changes (removingIds/togglingFavorites Sets) but the
  // selected account hasn't. Enables React.memo on AccountDetailPanel.
  const handleDetailClose = useCallback(() => select(null), [select]);
  const handleDetailRefreshCookie = useCallback(async () => {
    if (!selected || !api) return;
    const result = await api.cookie.refresh(selected.id);
    if (result?.success) notifications.show({ message: t('accounts.cookieRefreshed'), color: 'green' });
    else notifications.show({ message: result?.error ?? t('common.error'), color: 'red' });
  }, [selected, api]);
  const handleDetailLogoutAll = useCallback(
    () => notifications.show({ message: t('accounts.functionUnavailable'), color: 'orange' }),
    [],
  );

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
                  onSelect={handleCardSelect}
                  onRemove={handleCardRemove}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={openEdit}
                  isRemoving={removingIds.has(account.id)}
                  isTogglingFavorite={togglingFavorites.has(account.id)}
                />
              ))}
            </Stack>
          )}
        </ScrollArea>

        {/* Detail panel (no JoinBar here — LaunchDock is global in AppShell) */}
        {selected && (
          <AccountDetailPanel
            account={selected}
            onClose={handleDetailClose}
            onLaunch={handleLaunch}
            onRefreshCookie={handleDetailRefreshCookie}
            onLogoutAll={handleDetailLogoutAll}
          />
        )}
      </div>

      {/* Edit modal — group + description */}
        <Modal opened={editAccount !== null} onClose={() => setEditAccount(null)} title={t('accounts.editTitle')} size="sm">
          <FocusTrap>
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
          </FocusTrap>
        </Modal>
    </div>
  );
}
