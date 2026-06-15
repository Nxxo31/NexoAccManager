import { useState, useMemo } from 'react';

// =============================================================================
// ServerBrowser — Datos reales via IPC (roblox:games:*, roblox:servers:*)
// =============================================================================

interface Account {
  id: string;
  username: string;
  displayName?: string;
}

interface RobloxGame {
  name: string;
  description: string;
  playerCount: number;
  maxPlayers: number;
  rating: number;
  thumbnail: string | null;
  placeId: number;
}

interface GameServer {
  jobId: string;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN';
}

type Region = 'ALL' | 'NA' | 'EU' | 'ASIA' | 'SA';
type SortBy = 'least-players' | 'most-players';

interface ServerBrowserProps {
  accounts: Account[];
}

declare global {
  interface Window {
    api: {
      account: { list: () => Promise<{ success: boolean; data: any[]; error?: string }> };
      roblox: {
        searchGame: (placeId: string, accountId: string) => Promise<any>;
        getServers: (placeId: string, accountId: string) => Promise<any>;
        joinServer: (placeId: string, jobId: string, accountId: string) => Promise<any>;
        distributeAccounts: (placeId: string, accountIds: string[]) => Promise<any>;
      };
    };
  }
}

export default function ServerBrowser({ accounts }: ServerBrowserProps) {
  // -- state --
  const [placeId, setPlaceId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [game, setGame] = useState<RobloxGame | null>(null);
  const [servers, setServers] = useState<GameServer[]>([]);
  const [regionFilter, setRegionFilter] = useState<Region>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('least-players');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [distributing, setDistributing] = useState(false);

  // -- derived --
  const filteredServers = useMemo(() => {
    let data = [...servers];
    if (regionFilter !== 'ALL') {
      data = data.filter((s) => s.region === regionFilter);
    }
    data.sort((a, b) => {
      if (sortBy === 'least-players') return a.playerCount - b.playerCount;
      return b.playerCount - a.playerCount;
    });
    return data;
  }, [servers, regionFilter, sortBy]);

  // -- actions --
  const handleSearch = async () => {
    if (!placeId.trim()) return;
    if (accounts.length === 0) {
      setError('Agrega al menos una cuenta para buscar juegos');
      return;
    }
    setSearching(true);
    setSearched(true);
    setError(null);
    setGame(null);
    setServers([]);

    try {
      const accountId = accounts[0].id;
      const result = await window.api.roblox.searchGame(placeId.trim(), accountId);
      if (!result || !result.success) {
        setError(result?.error || 'No se pudo encontrar el juego');
        setSearching(false);
        return;
      }
      setGame(result.data);
      // Auto-load servers
      await loadServers(placeId.trim());
    } catch (e: any) {
      setError(e.message || 'Error buscando juego');
    } finally {
      setSearching(false);
    }
  };

  const loadServers = async (pid: string) => {
    if (accounts.length === 0) return;
    try {
      const accountId = accounts[0].id;
      const result = await window.api.roblox.getServers(pid, accountId);
      if (result?.success) {
        setServers(result.data || []);
      }
    } catch (e: any) {
      console.error('Error cargando servers:', e);
    }
  };

  const handleJoin = async (server: GameServer) => {
    if (!game || !accounts[0]) return;
    setJoining(true);
    try {
      const accountId = accounts[0].id;
      const result = await window.api.roblox.joinServer(String(game.placeId), server.jobId, accountId);
      if (result?.success) {
        alert(`Uniendo a ${game.name} — Server ${server.jobId.slice(0, 8)}...`);
      } else {
        alert(result?.error || 'Error uniendose al server');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setJoining(false);
    }
  };

  const handleAutoJoin = async () => {
    if (!game || !accounts[0] || filteredServers.length === 0) return;
    const leastPopulated = [...filteredServers].sort((a, b) => a.playerCount - b.playerCount)[0];
    await handleJoin(leastPopulated);
  };

  const handleDistribute = async () => {
    if (!game || !accounts[0] || filteredServers.length === 0) return;
    setDistributing(true);
    try {
      const accountIds = accounts.map((a) => a.id);
      const result = await window.api.roblox.distributeAccounts(String(game.placeId), accountIds);
      if (result?.success) {
        const successCount = Object.values(result.data).filter(Boolean).length;
        alert(`Distribucion completada: ${successCount}/${accountIds.length} cuentas`);
      } else {
        alert(result?.error || 'Error distribuyendo cuentas');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setDistributing(false);
    }
  };

  const getOccupancyBadge = (current: number, max: number) => {
    const pct = max > 0 ? Math.round((current / max) * 100) : 0;
    if (pct >= 90) return { label: 'Alta', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (pct >= 60) return { label: 'Media', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { label: 'Baja', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
  };

  // -- render --
  return (
    <div className="flex flex-col h-full bg-[#0D0D0D]">
      {/* Search bar */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ingresa el PlaceId del juego..."
              className="flex-1 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DE350D] transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !placeId.trim()}
              className="px-5 py-2.5 bg-[#DE350D] hover:bg-[#B22A0A] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all flex items-center gap-2"
            >
              {searching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Buscando...
                </>
              ) : (
                <>Buscar</>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Game card */}
      {game && (
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="flex items-start gap-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
            {game.thumbnail ? (
              <img src={game.thumbnail} alt={game.name} className="w-24 h-24 rounded-lg object-cover bg-[#2A2A2A]" />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-[#2A2A2A] flex items-center justify-center text-gray-500 text-xs">
                Sin thumbnail
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{game.name}</h3>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{game.description || 'Sin descripcion'}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-[#DE350D]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  {game.playerCount.toLocaleString()} jugando
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.26.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.55-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {game.rating > 0 ? `${game.rating.toFixed(1)} *` : 'N/A'}
                </span>
                <span className="text-gray-500">Max: {game.maxPlayers}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {game && (
        <div className="px-4 py-3 border-b border-[#2A2A2A] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Region:</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as Region)}
              className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#DE350D]"
            >
              <option value="ALL">Todas</option>
              <option value="NA">North America</option>
              <option value="EU">Europe</option>
              <option value="ASIA">Asia</option>
              <option value="SA">South America</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Ordenar:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#DE350D]"
            >
              <option value="least-players">Menos jugadores</option>
              <option value="most-players">Mas jugadores</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleAutoJoin}
              disabled={filteredServers.length === 0}
              className="px-3 py-1.5 bg-[#6347FF] hover:bg-[#8B6FFF] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Auto-join menos jugadores
            </button>
            <button
              onClick={handleDistribute}
              disabled={filteredServers.length === 0 || accounts.length < 2}
              className="px-3 py-1.5 bg-[#2ED573] hover:bg-[#26af61] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Distribuir cuentas
            </button>
          </div>
        </div>
      )}

      {/* Servers table */}
      <div className="flex-1 overflow-auto p-4">
        {!game && !searching && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium">Busca un juego por PlaceId</p>
            <p className="text-sm mt-1">Ingresa el PlaceId de un juego de Roblox para ver sus servers</p>
          </div>
        )}

        {game && filteredServers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg font-medium">No hay servers disponibles</p>
            <p className="text-sm mt-1">Intenta ajustar los filtros o buscar otro juego</p>
          </div>
        )}

        {game && filteredServers.length > 0 && (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#0D0D0D]">
              <tr className="border-b border-[#2A2A2A]">
                <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">JobId</th>
                <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                  <span className="ml-1 text-[10px] text-gray-600" title="Region estimada basada en lat hardware de Roblox">(estimada)</span>
                </th>
                <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Jugadores</th>
                <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ping
                  <span className="ml-1 text-[10px] text-gray-600" title="Ping estimado, no medido directamente">(estimado)</span>
                </th>
                <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ocupacion</th>
                <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredServers.map((server) => {
                const badge = getOccupancyBadge(server.playerCount, server.maxPlayers);
                return (
                  <tr key={server.jobId} className="hover:bg-[#1E1E1E]/50 transition-colors">
                    <td className="py-3 px-3 text-sm font-mono text-gray-300 truncate max-w-[150px]" title={server.jobId}>
                      {server.jobId.slice(0, 12)}...
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1E1E1E] border border-[#2A2A2A] text-gray-400">
                        {server.region}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-300">
                      {server.playerCount} / {server.maxPlayers}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-300">
                      {server.ping}ms
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badge.className}`}>
                        {badge.label} ({Math.round((server.playerCount / Math.max(server.maxPlayers, 1)) * 100)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleJoin(server)}
                        disabled={joining}
                        className="px-3 py-1.5 bg-[#DE350D] hover:bg-[#B22A0A] disabled:opacity-50 rounded text-xs font-medium text-white transition-all"
                      >
                        {joining ? 'Uniendo...' : 'Unirse'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
