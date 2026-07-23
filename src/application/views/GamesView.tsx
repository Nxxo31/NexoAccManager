// Application View: GamesView — search games + favorites

import { useState, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';

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
  const notify = useUIStore((s) => s.notify);
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
      if (result.success) {
        const data = result.data as GameResult[];
        setResults(Array.isArray(data) ? data : []);
      } else {
        notify('error', result.error ?? 'Error');
        setResults([]);
      }
    } catch {
      notify('error', 'Error al buscar juegos');
      setResults([]);
    }
    setLoading(false);
  };

  const loadFavorites = async () => {
    if (!selectedAccountId) return;
    try {
      const result = await window.api.games.getFavorites(selectedAccountId);
      if (result.success) {
        const data = result.data as FavoriteGame[];
        setFavorites(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silent fail for favorites
    }
  };

  const addFavorite = async (game: GameResult) => {
    const result = await window.api.games.addFavorite(selectedAccountId, {
      id: String(game.id),
      gameId: game.id,
      name: game.name,
      icon: game.thumbnail ?? '',
    });
    if (result.success) {
      notify('success', 'Añadido a favoritos');
      loadFavorites();
    } else {
      notify('error', result.error ?? 'Error');
    }
  };

  const removeFavorite = async (gameId: number) => {
    const result = await window.api.games.removeFavorite(selectedAccountId, gameId);
    if (result.success) {
      notify('success', 'Eliminado de favoritos');
      setFavorites(favorites.filter((f) => f.gameId !== gameId));
    } else {
      notify('error', result.error ?? 'Error');
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <p style={{ color: 'var(--text-tertiary)' }}>Agrega una cuenta primero.</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Juegos</h2>

      {/* Account selector */}
      <div className="flex gap-2 mb-3">
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="flex-1 px-3 py-2 rounded text-sm border"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          <option value="">Seleccionar cuenta...</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.username}</option>
          ))}
        </select>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Buscar juego..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="flex-1 px-3 py-2 rounded text-sm border"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        />
        <button
          onClick={search}
          className="px-4 py-2 rounded text-sm"
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Buscar
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-tertiary)' }}>Buscando...</p>}

      {/* Favorites section */}
      {selectedAccountId && favorites.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Favoritos</h3>
          <div className="flex flex-wrap gap-2">
            {favorites.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 px-2 py-1 rounded-lg border text-xs"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <span style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                <button
                  onClick={() => removeFavorite(f.gameId)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 14 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Resultados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((g) => (
              <div
                key={g.id}
                className="p-3 rounded-lg border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{g.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ID: {g.id}</span>
                  <button
                    onClick={() => addFavorite(g)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                  >
                    + Favorito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && selectedAccountId && !query && results.length === 0 && favorites.length === 0 && (
        <p style={{ color: 'var(--text-tertiary)' }}>Busca un juego por nombre para empezar.</p>
      )}
    </div>
  );
}
