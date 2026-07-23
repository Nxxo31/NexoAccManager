// Application View: GamesView — search games + favorites — Mantine v7

import { useState, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Button, Select, TextInput, Card, Badge, ScrollArea, ActionIcon, Skeleton } from '@mantine/core';
import { Star, Search, Plus } from 'lucide-react';

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
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameResult[]>([]);
  const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId) loadFavorites();
  }, [selectedAccountId]);

  const search = async () => {
    if (!query.trim() || !selectedAccountId) return;
    setLoading(true);
    try {
      const result = await window.api.byAccount.gamesSearch(query, selectedAccountId);
      if (result.success) setResults(Array.isArray(result.data) ? result.data : []);
      else notifications.show({ message: result.error ?? 'Error', color: 'red' });
    } catch {
      notifications.show({ message: 'Error al buscar juegos', color: 'red' });
    }
    setLoading(false);
  };

  const loadFavorites = async () => {
    if (!selectedAccountId) return;
    try {
      const result = await window.api.games.getFavorites(selectedAccountId);
      if (result.success) setFavorites(Array.isArray(result.data) ? result.data : []);
    } catch { /* silent */ }
  };

  const addFavorite = async (game: GameResult) => {
    const result = await window.api.games.addFavorite(selectedAccountId, {
      id: String(game.id), gameId: game.id, name: game.name, icon: game.thumbnail ?? '',
    });
    if (result.success) { notifications.show({ message: 'Anadido a favoritos', color: 'green' }); loadFavorites(); }
    else notifications.show({ message: result.error ?? 'Error', color: 'red' });
  };

  const removeFavorite = async (gameId: number) => {
    const result = await window.api.games.removeFavorite(selectedAccountId, gameId);
    if (result.success) { notifications.show({ message: 'Eliminado de favoritos', color: 'green' }); setFavorites(favorites.filter((f) => f.gameId !== gameId)); }
    else notifications.show({ message: result.error ?? 'Error', color: 'red' });
  };

  if (accounts.length === 0) {
    return (<Stack align="center" justify="center" h="100%"><Text c="dimmed">Agrega una cuenta primero.</Text></Stack>);
  }

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>Juegos</Text>

      <Select
        placeholder="Seleccionar cuenta..."
        value={selectedAccountId}
        onChange={(val) => setSelectedAccountId(val ?? '')}
        data={accounts.map((acc) => ({ value: acc.id, label: acc.username }))}
        size="sm"
        searchable
      />

      <Group gap="sm">
        <TextInput
          placeholder="Buscar juego..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          leftSection={<Search size={14} />}
          size="sm"
          style={{ flex: 1 }}
        />
        <Button variant="filled" color="primary" size="sm" onClick={search}>Buscar</Button>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        {loading && (<Stack gap="sm"><Skeleton height={80} radius="md" /><Skeleton height={80} radius="md" /><Skeleton height={80} radius="md" /></Stack>)}

        {selectedAccountId && favorites.length > 0 && (
          <Stack gap="xs" mb="md">
            <Text size="sm" fw={500} c="dimmed">Favoritos</Text>
            <Group gap="xs" wrap="wrap">
              {favorites.map((f) => (
                <Badge key={f.id} variant="light" color="yellow" rightSection={
                  <button onClick={() => removeFavorite(f.gameId)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>x</button>
                }>{f.name}</Badge>
              ))}
            </Group>
          </Stack>
        )}

        {results.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">Resultados</Text>
            {results.map((g) => (
              <Card key={g.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>{g.name}</Text>
                    <Text size="xs" c="dimmed">ID: {g.id}</Text>
                  </Stack>
                  <ActionIcon variant="subtle" color="gray" onClick={() => addFavorite(g)}>
                    <Star size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {!loading && selectedAccountId && !query && results.length === 0 && favorites.length === 0 && (
          <Text c="dimmed" ta="center" pt="xl">Busca un juego por nombre para empezar.</Text>
        )}
      </ScrollArea>
    </Stack>
  );
}
