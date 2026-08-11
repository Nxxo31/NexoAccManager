// Application Component: LaunchDock — persistent launch panel
// Replaces the old JoinBar inside AccountsView.
// Sits at the bottom of the main content area, always visible.
// Reads from useLaunchStore (placeId propagated from GamesView) +
// useAccountStore (selected account) + useUIStore (navigate to games).
// No Job ID field — shuffle generates it internally via API.

import { useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Group, TextInput, Button, Select, Stack, Tooltip, Checkbox, Text, ActionIcon } from '@mantine/core';
import { Rocket, Gamepad2, X, Loader2 } from 'lucide-react';
import { useLaunchStore } from '../store/launchStore';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';
import { notifications } from '@mantine/notifications';
import { t } from '../../config/i18n';



export function LaunchDock(): JSX.Element {
  const placeId = useLaunchStore((s) => s.selectedPlaceId);
  const selectedGame = useLaunchStore((s) => s.selectedGame);
  const shuffle = useLaunchStore((s) => s.shuffle);
  const launchStatus = useLaunchStore((s) => s.launchStatus);
  const launchError = useLaunchStore((s) => s.launchError);
  const setShuffle = useLaunchStore((s) => s.setShuffle);
  const setLaunchStatus = useLaunchStore((s) => s.setLaunchStatus);
  const clearSelection = useLaunchStore((s) => s.clearSelection);
  const setSelectedPlaceId = useLaunchStore((s) => s.setSelectedPlaceId);
  const selectedAccountId = useLaunchStore((s) => s.selectedAccountId);
  const setSelectedAccountId = useLaunchStore((s) => s.setSelectedAccountId);

  const accounts = useAccountStore((s) => s.accounts);
  const select = useAccountStore((s) => s.select);
  const setView = useUIStore((s) => s.setView);

  const api = typeof window !== 'undefined' ? window.api : undefined;

  const isLaunching = launchStatus === 'launching';
  const canLaunch = !!placeId.trim() && !!selectedAccountId && !isLaunching;

  const handleLaunch = useCallback(async () => {
    if (!selectedAccountId || !placeId || !api) return;

    setLaunchStatus('launching');
    try {
      // If shuffle, generate random jobId via API (resolves cookie internally)
      let jobId: string | undefined;
      if (shuffle && placeId) {
        const shuffleResult = await api.roblox.shuffleJobIdByAccount(placeId, selectedAccountId);
        if (!shuffleResult.success) {
          setLaunchStatus('error', shuffleResult.error ?? 'No se pudo obtener un servidor aleatorio');
          notifications.show({ message: shuffleResult.error ?? t('common.error'), color: 'red' });
          return;
        }
        jobId = shuffleResult.data as string;
      }

      const result = await api.roblox.launch(selectedAccountId, placeId || undefined, jobId);
      if (result.success) {
        const account = accounts.find((a) => a.id === selectedAccountId);
        setLaunchStatus('success');
        notifications.show({
          message: t('accounts.launched', { name: account?.username ?? '' }),
          color: 'green',
        });
      } else {
        setLaunchStatus('error', result.error ?? t('common.error'));
        notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
      }
    } catch (e) {
      setLaunchStatus('error', String(e));
      notifications.show({ message: t('common.error'), color: 'red' });
    }
  }, [selectedAccountId, placeId, shuffle, api, accounts, setLaunchStatus]);

  const handleGoToGames = useCallback(() => {
    setView('games');
  }, [setView]);

  const handleClear = useCallback(() => {
    clearSelection();
    select(null);
    setSelectedAccountId(null);
  }, [clearSelection, select, setSelectedAccountId]);

  // Sync selectedAccountId with accountStore.selectedId
  const accountSelectedId = useAccountStore((s) => s.selectedId);
  const effectiveAccountId = selectedAccountId ?? accountSelectedId;
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={
        reducedMotion
          ? undefined
          : placeId
            ? { boxShadow: '0 0 0 1px rgba(59,130,246,0.3)' }
            : {}
      }
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        borderTop: '1px solid var(--mantine-color-dark-4)',
        background: 'var(--mantine-color-dark-7)',
        minHeight: 64,
        flexShrink: 0,
      }}
    >
    <Group
      gap="sm"
      align="flex-end"
      p="sm"
    >
      {/* Place ID — readonly when propagated from GamesView */}
      <Stack gap={2} style={{ flex: 1, minWidth: 160, maxWidth: 280 }}>
        <Text size="xs" c="dimmed">{t('accounts.placeId')}</Text>
        <Group gap="xs" align="center">
          <TextInput
            value={placeId}
            onChange={(e) => setSelectedPlaceId(e.currentTarget.value)}
            placeholder={selectedGame ? selectedGame.name : t('accounts.placeIdPlaceholder')}
            size="sm"
            disabled={isLaunching}
          />
          {selectedGame && (
            <Tooltip label={selectedGame.name}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                {selectedGame.name.length > 20 ? `${selectedGame.name.slice(0, 20)}…` : selectedGame.name}
              </Text>
            </Tooltip>
          )}
          {placeId && (
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClear} disabled={isLaunching}>
              <X size={14} />
            </ActionIcon>
          )}
        </Group>
      </Stack>

      {/* Botón "Ir a Juegos" */}
      <Tooltip label={t('games.title')}>
        <Button
          variant="light"
          size="sm"
          leftSection={<Gamepad2 size={14} />}
          onClick={handleGoToGames}
          disabled={isLaunching}
        >
          {t('games.title')}
        </Button>
      </Tooltip>

      {/* Account selector */}
      <Stack gap={2} style={{ width: 180 }}>
        <Text size="xs" c="dimmed">{t('accounts.title')}</Text>
        <Select
          placeholder={t('games.selectAccount')}
          value={effectiveAccountId ?? ''}
          onChange={(val) => {
            setSelectedAccountId(val);
            select(val);
          }}
          data={accounts.map((acc) => ({ value: acc.id, label: acc.username }))}
          size="sm"
          searchable
          disabled={isLaunching || accounts.length === 0}
        />
      </Stack>

      {/* Shuffle checkbox */}
      <Tooltip label={t('accounts.shuffleTooltip')}>
        <Checkbox
          checked={shuffle}
          onChange={(e) => setShuffle(e.currentTarget.checked)}
          label={t('accounts.shuffle')}
          size="sm"
          disabled={isLaunching}
        />
      </Tooltip>

      {/* Launch button */}
      <Button
        variant="filled"
        color="primary"
        size="sm"
        leftSection={isLaunching ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
        onClick={handleLaunch}
        disabled={!canLaunch}
      >
        {isLaunching ? t('accounts.launching') : t('accounts.join')}
      </Button>

      {/* Error display */}
      {launchStatus === 'error' && launchError && (
        <Text size="xs" c="red" style={{ maxWidth: 200 }} truncate>
          {launchError}
        </Text>
      )}
    </Group>
    </motion.div>
  );
}
