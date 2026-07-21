import * as React from 'react';
import { Gamepad2, Search, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';
import { Account } from '@/types/Account';

interface RobloxGame {
  placeId: number;
  name: string;
  description?: string;
  thumbnail?: string;
  playerCount?: number;
  maxPlayers?: number;
  creator?: string;
  universeId?: number;
}

interface SearchHit {
  placeId: number;
  name: string;
  thumbnail?: string;
  playerCount?: number;
  maxPlayers?: number;
  description?: string;
  creator?: string;
  universeId?: number;
}

// Resultado de búsqueda fusionado a través de N cuentas. Cada juego se marca con
// los accountIds que lo devolvieron, para que laSelectionBar pueda repartir.
interface MergedGame extends RobloxGame {
  foundBy: string[]; // accountIds que lo encontraron
}

export const GamesView: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<MergedGame[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);
  const setSelectedAccount = useAccountStore((s) => s.setSelectedAccount);
  const selectedIds = useAccountStore((s) => s.selectedIds);

  const setSelectedPlaceId = useUIStore((s) => s.setSelectedPlaceId);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const addNotification = useUIStore((s) => s.addNotification);

  const api = React.useMemo(
    () => (typeof window !== 'undefined' ? (window as any).api : null),
    []
  );

  // Para la búsqueda: usar las seleccionadas (si hay ≥2) o un solo selector.
  const hasMultiSelection = selectedIds.length >= 2;

  // Cuenta "activa" para el selector individual (fallback / single mode)
  const activeAccount: Account | undefined = React.useMemo(
    () => selectedAccount || accounts[0],
    [selectedAccount, accounts]
  );

  // Cuentas a usar para la búsqueda
  const searchAccounts: Account[] = React.useMemo(() => {
    if (hasMultiSelection) return accounts.filter((a) => selectedIds.includes(a.id));
    return activeAccount ? [activeAccount] : [];
  }, [hasMultiSelection, selectedIds, accounts, activeAccount]);

  const handleSearch = async () => {
    if (!search.trim() || searchAccounts.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // Buscar con la primera cuenta (los resultados de Roblox son los mismos
      // sin importar la cuenta; el placeId es canónico). Para verificar conexión,
      // si hay multi-selección, iteramos la búsqueda con cada cuenta y marcamos
      // qué cuentas devolvieron el juego (foundBy).
      const merged = new Map<number, MergedGame>();

      for (const acc of searchAccounts) {
        if (!api?.roblox?.searchGame) continue;
        try {
          const result = await api.roblox.searchGame(search.trim(), acc.id);
          const hits: SearchHit[] = Array.isArray(result)
            ? result
            : result?.data || [];
          for (const hit of hits) {
            const key = hit.placeId;
            const existing = merged.get(key);
            if (existing) {
              existing.foundBy.push(acc.id);
            } else {
              merged.set(key, {
                placeId: hit.placeId,
                name: hit.name,
                description: hit.description,
                thumbnail: hit.thumbnail,
                playerCount: hit.playerCount,
                maxPlayers: hit.maxPlayers,
                creator: hit.creator,
                universeId: hit.universeId,
                foundBy: [acc.id],
              });
            }
          }
        } catch (e) {
          // Silencioso para una cuenta; reportamos solo error global si todas fallan
          if (searchAccounts.length === 1) {
            setError((e as Error).message || 'Error en búsqueda');
          }
        }
      }

      setResults(Array.from(merged.values()));
      if (hasMultiSelection && merged.size > 0) {
        addNotification({
          type: 'info',
          title: t('views.games.multiSearched', 'Búsqueda multi-cuenta'),
          message: `${merged.size} juegos · ${searchAccounts.length} ${t('common.accounts', 'cuentas')}`,
          durationMs: 3000,
        });
      }
    } catch (e) {
      setError((e as Error).message || 'Error en búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = (placeId: number) => {
    setSelectedPlaceId(placeId.toString());
    setActiveView('servers');
  };

  const timeAgo = (date: Date): string => {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'Ahora mismo';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.round(diffMs / 3600000);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.round(diffMs / 86400000);
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t('views.games.title', 'Juegos')}</h2>
        </div>
      </div>

      {accounts.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          {t('accounts.empty', 'No hay cuentas')}
        </p>
      ) : (
        <>
          {/* Banner multi-selección */}
          {hasMultiSelection && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
              <Layers className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <p className="font-medium text-primary">
                  {t('views.games.multiMode', 'Modo multi-cuenta activado')}
                </p>
                <p className="text-muted-foreground">
                  {t(
                    'views.games.multiModeDesc',
                    'Buscando con {{count}} cuentas. Los resultados muestran qué cuentas encontraron cada juego.',
                    { count: selectedIds.length }
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Account selector (solo en modo single) */}
          {!hasMultiSelection && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('views.games.selectAccount', 'Seleccionar cuenta:')}
            </label>
            <div className="relative w-full max-w-md">
              <select
                value={activeAccount?.id ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const acc = accounts.find((a) => a.id === id);
                  if (acc) setSelectedAccount(acc);
                }}
                className="w-full pl-3 pr-10 py-2 rounded-md border border-border bg-bg-surface/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">
                  {t('views.games.selectAccountPlaceholder', 'Selecciona una cuenta...')}
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.username}
                    {acc.displayName ? ` (${acc.displayName})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          )}

          {/* Search bar */}
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
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
              disabled={loading || !search.trim() || searchAccounts.length === 0}
              className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {t('common.search', 'Buscar')}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-error/10 border border-error text-sm text-error">
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-error hover:text-error/80"
                aria-label="Cerrar error"
              >
                ×
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {/* Empty states */}
          {!loading && results.length === 0 && !error && (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {!search
                ? t('views.games.noResults', 'Ingresa un término para buscar juegos')
                : t('views.games.emptySearch', 'No se encontraron juegos')}
            </p>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((game, index) => (
                <div
                  key={game.placeId || index}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors cursor-pointer"
                  onClick={() => handleGameSelect(game.placeId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleGameSelect(game.placeId);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/20 flex items-center justify-center overflow-hidden">
                    {game.thumbnail ? (
                      <img
                        src={game.thumbnail}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {(game.name || '').substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between w-full">
                      <h4 className="text-sm font-medium truncate">{game.name}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {hasMultiSelection && game.foundBy.length > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                            title={t('views.games.foundBy', 'Encontrado por {{n}} cuenta(s)', { n: game.foundBy.length })}
                          >
                            {game.foundBy.length}/{selectedIds.length}
                          </span>
                        )}
                        {game.playerCount !== undefined &&
                          game.maxPlayers !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {game.playerCount}/{game.maxPlayers}
                            </span>
                          )}
                      </div>
                    </div>
                    {game.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {game.description}
                      </p>
                    )}
                    {game.creator && (
                      <p className="text-xs text-muted-foreground">
                        {t('views.games.creator', 'Por')} {game.creator}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

GamesView.displayName = 'GamesView';
