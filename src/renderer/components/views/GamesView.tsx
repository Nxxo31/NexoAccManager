import * as React from 'react';
import { Gamepad2, Search, Star, StarOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface GameCardProps {
  game: any;
  t: (key: string | string[], options?: any) => string;
  onToggleFavorite?: (gameId: number) => void;
  isFavorite?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ game, t, onToggleFavorite, isFavorite = false }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
        {game.icon ? (
          <img src={game.icon} alt={game.name} className="w-10 h-10 object-cover" />
        ) : (
          <div className="text-xs font-medium">
            {(game.name || '').substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between w-full">
          <h4 className="text-sm font-medium truncate">{game.name || game.placeId}</h4>
          {game.playerCount !== undefined && game.maxPlayers !== undefined && (
            <span className="text-xs text-muted-foreground">
              {game.playerCount}/{game.maxPlayers}
            </span>
          )}
        </div>
        {game.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{game.description}</p>
        )}
      </div>
      {onToggleFavorite !== undefined && (
        <div className="flex-shrink-0">
          <button
            onClick={() => onToggleFavorite(game.gameId)}
            className="p-1 rounded hover:bg-bg-surface/50 transition-colors"
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isFavorite ? <Star className="h-4 w-4 text-warning" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      )}
    </div>
  );
};

GameCard.displayName = 'GameCard';

export const GamesView: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [recentGamesLoading, setRecentGamesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'favorite'>('search');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const accounts = (window as any).__accounts || [];

  const getAccountId = () => {
    if (!accounts.length) return null;
    return accounts[0]?.id || null;
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    const accountId = getAccountId();
    if (!accountId) return;

    setLoading(true);
    try {
      const api = (window as any).api;
      if (!api?.roblox?.searchGame) return;
      const result = await api.roblox.searchGame(search.trim(), accountId);
      const data = Array.isArray(result) ? result : (result?.data || []);
      setResults(data);
    } catch (e) {
      console.error('Game search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = React.useCallback(async () => {
    const accountId = getAccountId();
    if (!accountId) return;

    setFavoritesLoading(true);
    try {
      const api = (window as any).api;
      if (!api?.games?.getFavorites) return;
      const result = await api.games.getFavorites(accountId);
      if (result && result.success) {
        setFavorites(result.favoriteGames || []);
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  const loadRecentGames = React.useCallback(async () => {
    const accountId = getAccountId();
    if (!accountId) return;

    setRecentGamesLoading(true);
    try {
      const api = (window as any).api;
      if (!api?.presence?.getRecentGames) return;
      const result = await api.presence.getRecentGames(accountId);
      if (result && result.success) {
        setRecentGames(result.recentGames || []);
      }
    } catch (e) {
      console.error('Error loading recent games:', e);
    } finally {
      setRecentGamesLoading(false);
    }
  }, []);

  // Load favorites and recent games when account changes or on mount
  React.useEffect(() => {
    loadFavorites();
    loadRecentGames();
  }, [loadFavorites, loadRecentGames]);

  const timeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.games.title', 'Juegos')}</h2>
      </div>

      {accounts.length === 0 ? (
        <p className="text-muted-foreground">{t('accounts.empty', 'No hay cuentas')}</p>
      ) : (
        <>
          {/* Account selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('views.games.selectAccount', 'Seleccionar cuenta:')}
            </label>
            <div className="relative w-full">
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-md border border-border bg-bg-surface/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">{t('views.games.selectAccountPlaceholder', 'Selecciona una cuenta...')}</option>
                {accounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.username} {acc.displayName ? `(${acc.displayName})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'search' ? 'bg-primary text-white' : 'bg-bg-surface/50 text-muted-foreground hover:bg-bg-surface/100'}`}
            >
              {t('views.games.search', 'Buscar')}
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'recent' ? 'bg-primary text-white' : 'bg-bg-surface/50 text-muted-foreground hover:bg-bg-surface/100'}`}
            >
              {t('views.games.recent', 'Recientes')}
            </button>
            <button
              onClick={() => setActiveTab('favorite')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'favorite' ? 'bg-primary text-white' : 'bg-bg-surface/50 text-muted-foreground hover:bg-bg-surface/100'}`}
            >
              {t('views.games.favorites', 'Favoritos')}
            </button>
          </div>

          {/* Search tab */}
          {activeTab === 'search' && (
            <>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('views.games.searchPlaceholder', 'Buscar por nombre...')}
                    className="w-full h-9 pl-10 pr-4 rounded-md border border-border bg-bg-surface/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    aria-label={t('views.games.searchPlaceholder', 'Buscar juego')}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || !search.trim()}
                  className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-40"
                >
                  {t('common.search', 'Buscar')}
                </button>
              </div>

              {loading && results.length === 0 && (
                <div className="flex min-h-[200px] items-center justify-center px-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}

              {!loading && results.length === 0 && !search && (
                <p className="text-center text-muted-foreground pt-8">{t('views.games.noResults', 'Ingresa un término para buscar juegos')}</p>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-2">
                  {results.map((game: any, index: number) => (
                    <GameCard key={index} game={game} t={t} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Recent tab */}
          {activeTab === 'recent' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('views.games.recentGames', 'Juegos recientes')}</h3>
                <button onClick={loadRecentGames} className="p-1 rounded hover:bg-primary/20 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {recentGamesLoading && recentGames.length === 0 && (
                <div className="flex min-h-[200px] items-center justify-center px-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}

              {!recentGamesLoading && recentGames.length === 0 && (
                <p className="text-center text-muted-foreground pt-8">{t('views.games.noRecentGames', 'No hay juegos recientes')}</p>
              )}

              {!recentGamesLoading && recentGames.length > 0 && (
                <div className="space-y-2">
                  {recentGames.map((game: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors">
                      <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
                        {game.icon ? (
                          <img src={game.icon} alt={game.name} className="w-10 h-10 object-cover" />
                        ) : (
                          <div className="text-xs font-medium">{(game.name || '').substring(0, 2).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between w-full">
                          <h4 className="text-sm font-medium truncate">{game.name}</h4>
                          <time className="text-xs text-muted-foreground">{timeAgo(new Date(game.lastPlayed))}</time>
                        </div>
                        {game.placeName && game.placeName !== game.name && (
                          <p className="text-xs text-muted-foreground truncate">{game.placeName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Favorites tab */}
          {activeTab === 'favorite' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('views.games.favoriteGames', 'Juegos favoritos')}</h3>
                <button onClick={loadFavorites} className="p-1 rounded hover:bg-primary/20 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {favoritesLoading && favorites.length === 0 && (
                <div className="flex min-h-[200px] items-center justify-center px-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}

              {!favoritesLoading && favorites.length === 0 && (
                <p className="text-center text-muted-foreground pt-8">{t('views.games.noFavorites', 'No tienes juegos favoritos')}</p>
              )}

              {!favoritesLoading && favorites.length > 0 && (
                <div className="space-y-2">
                  {favorites.map((game: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors">
                      <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
                        {game.icon ? (
                          <img src={game.icon} alt={game.name} className="w-10 h-10 object-cover" />
                        ) : (
                          <div className="text-xs font-medium">{(game.name || '').substring(0, 2).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between w-full">
                          <h4 className="text-sm font-medium truncate">{game.name}</h4>
                          <time className="text-xs text-muted-foreground">{timeAgo(new Date(game.addedAt))}</time>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

GamesView.displayName = 'GamesView';