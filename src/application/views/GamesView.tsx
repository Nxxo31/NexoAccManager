// Application View: GamesView — search games + favorites — Mantine v7

import { useState, useEffect, useCallback } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useLaunchStore } from '../store/launchStore';
import { useUIStore } from '../store/uiStore';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Button, Select, TextInput, Card, Badge, ScrollArea, ActionIcon, Skeleton } from '@mantine/core';
import { Star, Search, Rocket } from 'lucide-react';
import { t } from '../../config/i18n';

interface GameResult {
  id: number;
  name: string;
  thumbnail?: string;
}

interface FavoriteGame {
  id: string;
  gameId: number;
  name: string;
  icon: string;
  addedAt: string;
}

export function GamesView(): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const select = useAccountStore((s) => s.select);
  const setView = useUIStore((s) => s.setView);
  const setSelectedGame = useLaunchStore((s) => s.setSelectedGame);
  const api = typeof window !== 'undefined' ? window.api : undefined;
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameResult[]>([]);
  const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
  const [loading, setLoading] = useState(false);

  // Propagar Place ID de un juego seleccionado al LaunchDock
  const handleSelectGame = useCallback((game: GameResult) => {
    const placeId = String(game.id);
    setSelectedGame({
      placeId,
      name: game.name,
      thumbnail: game.thumbnail,
    });
    notifications.show({
      message: `Place ID copiado: ${placeId}`,
      color: 'blue',
      autoClose: 2000,
    });
    // Navegar a AccountsView donde el LaunchDock está visible
    setView('accounts');
  }, [setSelectedGame, setView]);

  // Lanzar un juego directamente desde un favorito
  const handleLaunchFavorite = useCallback((fav: FavoriteGame) => {
    setSelectedGame({
      placeId: String(fav.gameId),
      name: fav.name,
      thumbnail: fav.icon,
    });
    // Si hay una cuenta seleccionada, marcamos ready
    if (accounts.length > 0 && !selectedAccountId) {
      // Seleccionar la primera cuenta automáticamente
      select(accounts[0].id);
    }
    setView('accounts');
    notifications.show({ message: `Place ID copiado: ${fav.gameId}`, color: 'blue', autoClose: 2000 });
  }, [setSelectedGame, setView, accounts, selectedAccountId, select]);

  useEffect(() => {
    if (selectedAccountId && api) loadFavorites();
  }, [selectedAccountId]);

  const search = useCallback(async () => {
      if (!query.trim() || !selectedAccountId || !api) return;
      setLoading(true);
      try {
        const result = await api.byAccount.gamesSearch(query, selectedAccountId);
        if (result.success) setResults(Array.isArray(result.data) ? result.data : []);
        else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
      } catch {
        notifications.show({ message: t('games.searchError'), color: 'red' });
      } finally {
        setLoading(false);
      }
    }, [api, query, selectedAccountId]);

    const loadFavorites = useCallback(async () => {
      if (!selectedAccountId || !api) return;
      try {
        const result = await api.games.getFavorites(selectedAccountId);
        if (result.success) setFavorites(Array.isArray(result.data) ? result.data : []);
      } catch { /* silent */ }
    }, [api, selectedAccountId]);

    const addFavorite = useCallback(async (game: GameResult) => {
      if (!api) return;
      try {
        const result = await api.games.addFavorite(selectedAccountId, {
          id: String(game.id),
          gameId: game.id,
          name: game.name,
          icon: game.thumbnail ?? '',
        });
        if (result.success) {
          notifications.show({ message: t('games.addedToFavorites'), color: 'green' });
          loadFavorites();
        } else {
          notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
        }
      } catch {
        notifications.show({ message: t('common.error'), color: 'red' });
      }
    }, [api, selectedAccountId, loadFavorites]);

    const removeFavorite = useCallback(async (gameId: number) => {
      if (!api) return;
      try {
        const result = await api.games.removeFavorite(selectedAccountId, gameId);
        if (result.success) {
          notifications.show({ message: t('games.removedFromFavorites'), color: 'green' });
          loadFavorites();
        } else {
          notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
        }
      } catch {
        notifications.show({ message: t('common.error'), color: 'red' });
      }
    }, [api, selectedAccountId, loadFavorites]);

    if (accounts.length === 0) {
    return (
      <Stack align="center" justify="center" h="100%">
        <Text c="dimmed">{t('games.addAccountFirst')}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>{t('games.title')}</Text>

      <Select
        placeholder={t('games.selectAccount')}
        value={selectedAccountId}
        onChange={(val) => setSelectedAccountId(val ?? '')}
        data={accounts.map((acc) => ({ value: acc.id, label: acc.username }))}
        size="sm"
        searchable
      />

      <Group gap="sm">
        <TextInput
          placeholder={t('games.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          leftSection={<Search size={14} />}
          size="sm"
          style={{ flex: 1 }}
        />
        <Button variant="filled" color="primary" size="sm" onClick={search}>{t('games.search')}</Button>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        {loading && (
          <Stack gap="sm">
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </Stack>
        )}

        {selectedAccountId && favorites.length > 0 && (
          <Stack gap="xs" mb="md">
            <Text size="sm" fw={500} c="dimmed">{t('games.favorites')}</Text>
            <Group gap="xs" wrap="wrap">
              {favorites.map((f) => (
                <Badge
                  key={f.id}
                  variant="light"
                  color="yellow"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleLaunchFavorite(f)}
                  rightSection={
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFavorite(f.gameId); }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}
                      aria-label={t('games.removeFromFavorites')}
                    >
                      x
                    </button>
                  }
                >
                  {f.name}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}

        {results.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">{t('games.results')}</Text>
            {results.map((g) => (
              <Card key={g.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" align="center">
                  <Stack gap={2} style={{ cursor: 'pointer' }} onClick={() => handleSelectGame(g)}>
                    <Text size="sm" fw={500}>{g.name}</Text>
                    <Text size="xs" c="dimmed">ID: {g.id}</Text>
                  </Stack>
                  <Group gap="xs">
                    <ActionIcon variant="filled" color="primary" size="sm" onClick={() => handleSelectGame(g)} aria-label={t('accounts.join')}>
                      <Rocket size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="gray" onClick={() => addFavorite(g)} aria-label={t('games.addToFavorites')}>
                      <Star size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {!loading && selectedAccountId && !query && results.length === 0 && favorites.length === 0 && (
          <Text c="dimmed" ta="center" pt="xl">
            {t('games.searchToStart')}
          </Text>
        )}
      </ScrollArea>
    </Stack>
  );
}
