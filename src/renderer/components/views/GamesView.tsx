import * as React from 'react';
import { Gamepad2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export const GamesView: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  const handleSearch = async () => {
    if (!api || !search.trim()) return;
    const selectedAccount = (window as any).__selectedAccount;
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const result = await api.roblox.searchGame(search.trim(), selectedAccount.id);
      const data = Array.isArray(result) ? result : (result?.data || []);
      setResults(data);
    } catch (e) {
      console.error('Game search error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.games.title', 'Juegos')}</h2>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('views.games.searchPlaceholder', 'Buscar por Place ID...')}
            className="w-full h-9 pl-10 pr-4 rounded-md border border-border bg-bg-surface/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            aria-label={t('views.games.searchPlaceholder', 'Buscar juego')}
          />
        </div>
        <button onClick={handleSearch} disabled={loading || !search.trim()}
          className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-40">
          {t('common.search', 'Buscar')}
        </button>
      </div>
      {loading && <p className="text-muted-foreground">{t('common.loading', 'Cargando...')}</p>}
      {!loading && results.length === 0 && (
        <p className="text-muted-foreground">{t('views.games.empty', 'Busca un juego por Place ID')}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((game: any) => (
          <div key={game.id || game.placeId} className="rounded-lg border border-border bg-bg-card p-4 hover:bg-bg-elevated/50 transition-colors">
            {game.thumbnailUrl && <img src={game.thumbnailUrl} alt={game.name} className="w-full h-32 object-cover rounded-md mb-2" />}
            <h3 className="text-sm font-medium truncate">{game.name}</h3>
            <p className="text-xs text-muted-foreground">{game.playerCount || 0} {t('views.games.players', 'jugadores')}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">ID: {game.placeId || game.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

GamesView.displayName = 'GamesView';
