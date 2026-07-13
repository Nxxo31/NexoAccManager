import * as React from 'react';
import { motion } from 'framer-motion';
import { Server, Users, Signal, MapPin } from 'lucide-react';
import { Card } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';

interface GameServer {
  jobId: string;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN';
  fps: number;
}

interface ServerBrowserProps {
  servers: GameServer[];
  onSelectServer: (server: GameServer) => void;
  selectedServerId?: string;
}

const ServerBrowser: React.FC<ServerBrowserProps> = ({ servers, onSelectServer, selectedServerId }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'ping' | 'players' | 'fps'>('ping');

  const filtered = React.useMemo(() => {
    let result = servers;
    if (searchTerm) {
      result = result.filter((s) => s.jobId.includes(searchTerm));
    }
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'ping':
          return a.ping - b.ping;
        case 'players':
          return b.playerCount - a.playerCount;
        case 'fps':
          return b.fps - a.fps;
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
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Server Browser</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} servers available
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by Job ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'ping' | 'players' | 'fps')}
          className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
        >
          <option value="ping">Sort: Ping</option>
          <option value="players">Sort: Players</option>
          <option value="fps">Sort: FPS</option>
        </select>
      </div>

      {/* Server List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Server className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="font-semibold text-foreground/60 mt-4">No servers found</h3>
            <p className="text-sm text-muted-foreground/50 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          filtered.map((server, idx) => (
            <motion.div
              key={server.jobId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
            >
              <Card
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                  selectedServerId === server.jobId ? 'ring-2 ring-ring' : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelectServer(server)}
              >
                <div className="flex items-center gap-6">
                  {/* Players */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {server.playerCount}/{server.maxPlayers}
                    </span>
                  </div>

                  {/* Ping */}
                  <div className="flex items-center gap-2">
                    <Signal className={`h-4 w-4 ${getPingColor(server.ping)}`} />
                    <span className={`text-sm font-medium ${getPingColor(server.ping)}`}>
                      {server.ping}ms
                    </span>
                  </div>

                  {/* Region */}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{server.region}</Badge>
                  </div>

                  {/* FPS */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">FPS:</span>
                    <span className="text-sm font-medium text-foreground">{server.fps}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {server.jobId.slice(0, 12)}...
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectServer(server);
                    }}
                  >
                    Join
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServerBrowser;