import { useState } from 'react';

// =============================================================================
// ServerBrowser — Componente base con datos mock (sin IPC)
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

// Mock data para testing
const MOCK_GAME: RobloxGame = {
  name: 'Blox Fruits',
  description: 'Dive into a vast, unique and massively explored sea of islands and islands with a lot of maps to adventure in! Find the grand sea and its secret islands, beat strong sea beasts and become the greatest swordsman!',
  playerCount: 158420,
  maxPlayers: 800000,
  rating: 4.6,
  thumbnail: null,
  placeId: 123456789,
};

interface GameServer {
  jobId: string;
  playerCount: number;
  maxPlayers: number;
  region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN';
}

const MOCK_SERVERS: GameServer[] = [
  { jobId: 'abc123def456', playerCount: 12, maxPlayers: 20, region: 'NA' },
  { jobId: 'def789abc012', playerCount: 5, maxPlayers: 20, region: 'EU' },
  { jobId: 'aabbcc112233', playerCount: 18, maxPlayers: 20, region: 'ASIA' },
  { jobId: 'dd4422557788', playerCount: 1, maxPlayers: 20, region: 'SA' },
  { jobId: '112233445566', playerCount: 9, maxPlayers: 20, region: 'NA' },
];

type Region = 'ALL' | 'NA' | 'EU' | 'ASIA' | 'SA';
type SortBy = 'least-players' | 'most-players';

interface ServerBrowserProps {
  accounts: Account[];
}

export default function ServerBrowser({ accounts }: ServerBrowserProps) {
  const [placeId, setPlaceId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [game, setGame] = useState<RobloxGame | null>(null);
  const [servers, setServers] = useState<GameServer[]>([]);
  const [regionFilter, setRegionFilter] = useState<Region>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('least-players');

  const filteredServers = servers.filter((s) => {
    if (regionFilter === 'ALL') return true;
    return s.region === regionFilter;
  }).sort((a, b) => {
    if (sortBy === 'least-players') return a.playerCount - b.playerCount;
    return b.playerCount - a.playerCount;
  });

  const handleSearch = () => {
    if (!placeId.trim()) return;
    setSearching(true);
    setSearched(true);

    // Simulate search delay with mock data
    setTimeout(() => {
      setGame(placeId.trim() === '123456789' ? MOCK_GAME : { ...MOCK_GAME, name: `Juego ${placeId}`, placeId: Number(placeId) });
      setServers(MOCK_SERVERS);
      setSearching(false);
    }, 800);
  };

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
      </div>

      {/* Game card + filtros + tabla — solo se muestra si hay juego */}
      {game ? (
        <>
          {/* Game card */}
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

          {/* Filtros */}
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
          </div>

          {/* Tabla de servers */}
          <div className="flex-1 overflow-auto p-4">
            {filteredServers.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 py-8">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
                <p className="text-lg font-medium">Lista de servers</p>
                <p className="text-sm mt-1">Proximamente: servers activos con informacion de region y ocupacion</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0D0D0D]">
                  <tr className="border-b border-[#2A2A2A]">
                    <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">JobId</th>
                    <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Jugadores</th>
                    <th className="py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ocupacion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredServers.map((server) => {
                    const occupancy = Math.round((server.playerCount / server.maxPlayers) * 100);
                    const occupancyColor = occupancy > 80 ? 'text-red-400 bg-red-500/20' : occupancy > 50 ? 'text-orange-400' : 'text-green-400';                     
                    return (
                      <tr key={server.jobId} className="hover:bg-[#1E1E1E]/50 transition-colors">
                        <td className="py-3 px-3 text-sm font-mono text-gray-300">{server.jobId}</td>
                        <td className="py-3 px-3 text-sm text-gray-300">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1E1E1E] border border-[#2A2A2A] text-gray-400">
                            {server.region}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-300">{server.playerCount} / {server.maxPlayers}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${occupancyColor}`}>
                            {occupancy}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
          {searched && !game ? (
            <>
              <svg className="w-16 h-16 mb-4 opacity-50 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-lg font-medium text-red-400">Juego no encontrado</p>
              <p className="text-sm mt-1">Verifica el PlaceId e intenta de nuevo</p>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium">Busca un juego por PlaceId</p>
              <p className="text-sm mt-1">Ingresa el PlaceId de un juego de Roblox para ver su informacion</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}