import * as React from 'react';
import { motion } from 'framer-motion';
import { Server, Users, Signal, MapPin, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { cn } from '@renderer/lib/utils';

interface GameServer {
  jobId: string;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  region: string;
  fps: number;
}

const ServerBrowser: React.FC = () => {
  const [placeId, setPlaceId] = React.useState('');
  const [servers, setServers] = React.useState<GameServer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'ping' | 'players' | 'fps'>('ping');
  const [selectedServerId, setSelectedServerId] = React.useState<string | undefined>();

  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);

  // Safe API accessor
  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  const handleSearch = async () => {
    if (!placeId.trim()) {
      setError('Ingresa un Place ID');
      return;
    }
    if (!selectedAccount) {
      setError('Selecciona una cuenta primero');
      return;
    }
    if (!api) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.roblox.getServers(placeId, selectedAccount.id);
      if (result && result.success === false) {
        setError(result.error || 'Error al buscar servers');
        setServers([]);
      } else {
        const data = Array.isArray(result) ? result : (result?.data || []);
        setServers(data);
      }
    } catch (err) {
      setError('Error de conexión');
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinServer = async (server: GameServer) => {
    if (!selectedAccount || !api) return;
    try {
      await api.roblox.joinServer(placeId, server.jobId, selectedAccount.id);
    } catch (err) {
      console.error('Join server error:', err);
    }
  };

  const filtered = React.useMemo(() => {
    let result = servers;
    if (searchTerm) {
      result = result.filter((s) => s.jobId.includes(searchTerm));
    }
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'ping': return a.ping - b.ping;
        case 'players': return b.playerCount - a.playerCount;
        case 'fps': return b.fps - a.fps;
      }
    });
  }, [servers, searchTerm, sortBy]);

  const getPingColor = (ping: number): string => {
    if (ping < 80) return 'text-green-500';
    if (ping < 150) return 'text-yellow-500';
    if (ping < 250) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Server Browser</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length > 0 ? `${filtered.length} servers disponibles` : 'Busca servers por Place ID'}
            </p>
          </div>
          {selectedAccount && (
            <Badge variant="outline" className="text-xs">
              Cuenta: {selectedAccount.displayName || selectedAccount.username}
            </Badge>
          )}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Place ID (ej: 5315046213)"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="nexo-input pl-10"
            />
          </div>
          <Button variant="default" size="sm" onClick={handleSearch} disabled={loading || !api}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1.5">Buscar</span>
          </Button>
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Filters */}
        {servers.length > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <input
              type="text"
              placeholder="Filtrar por Job ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="nexo-input max-w-xs"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'ping' | 'players' | 'fps')}
              className="nexo-input max-w-[180px]"
            >
              <option value="ping">Ordenar: Ping</option>
              <option value="players">Ordenar: Jugadores</option>
              <option value="fps">Ordenar: FPS</option>
            </select>
          </div>
        )}
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {servers.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Server className="h-12 w-12 text-muted-foreground/20" />
            <h3 className="font-semibold text-foreground/40 mt-4">Sin servers</h3>
            <p className="text-sm text-muted-foreground/40 mt-1">
              Ingresa un Place ID y selecciona una cuenta para buscar
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {filtered.map((server, idx) => (
          <motion.div
            key={server.jobId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.2 }}
          >
            <Card
              className={cn(
                'flex items-center justify-between p-4 cursor-pointer border transition-all',
                selectedServerId === server.jobId
                  ? 'ring-2 ring-primary border-primary'
                  : 'border-border hover:border-border-light hover:bg-muted/20'
              )}
              onClick={() => setSelectedServerId(server.jobId)}
            >
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground font-mono-data">
                    {server.playerCount}/{server.maxPlayers}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className={cn('h-4 w-4', getPingColor(server.ping))} />
                  <span className={cn('text-sm font-medium font-mono-data', getPingColor(server.ping))}>
                    {server.ping}ms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">{server.region || 'N/A'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">FPS:</span>
                  <span className="text-sm font-medium text-foreground font-mono-data">{server.fps}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono-data">
                  {server.jobId.length > 16 ? `${server.jobId.slice(0, 16)}...` : server.jobId}
                </span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleJoinServer(server); }}
                  disabled={!api}
                >
                  Unirse
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ServerBrowser;