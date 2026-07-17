import * as React from 'react';
import { Server, Search, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ServerBrowser from '../server-browser/ServerBrowser';

export const ServerView: React.FC = () => {
  const { t } = useTranslation();
  const [playerSearch, setPlayerSearch] = React.useState('');
  const [searchResult, setSearchResult] = React.useState<string | null>(null);
  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  // 4.5 — Player Finder: search by username
  const handlePlayerSearch = React.useCallback(async () => {
    if (!playerSearch.trim() || !api) return;
    try {
      const result = await api.roblox?.searchUser?.(playerSearch.trim());
      if (result?.success && result.data) {
        setSearchResult(`${result.data.name} (ID: ${result.data.id})`);
      } else {
        setSearchResult('Usuario no encontrado');
      }
    } catch {
      setSearchResult('Error en la búsqueda');
    }
  }, [playerSearch, api]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Server className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.servers.title', 'Servidores')}</h2>
      </div>

      {/* Player Finder (4.5) */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-card border border-border">
        <User className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePlayerSearch(); }}
          placeholder={t('views.servers.playerFinder', 'Buscar jugador por username...')}
          className="flex-1 h-8 px-2.5 rounded-md border border-border bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={t('views.servers.playerFinder', 'Buscar jugador')}
        />
        <button
          onClick={handlePlayerSearch}
          disabled={!playerSearch.trim()}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
          aria-label={t('views.servers.search', 'Buscar')}
        >
          <Search className="h-3.5 w-3.5" />
          {t('views.servers.search', 'Buscar')}
        </button>
        {searchResult && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{searchResult}</span>
        )}
      </div>

      <ServerBrowser />
    </div>
  );
};

ServerView.displayName = 'ServerView';
