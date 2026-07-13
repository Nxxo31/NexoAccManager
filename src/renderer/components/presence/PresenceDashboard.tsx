import * as React from 'react';
import { motion } from 'framer-motion';
import { Circle, Gamepad2, DollarSign, Clock } from 'lucide-react';
import { Card } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';

interface PresenceData {
  accountId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'in-game';
  gameName?: string;
  lastOnline?: string;
  robuxBalance?: number;
}

interface PresenceDashboardProps {
  presences: PresenceData[];
  onRefresh: () => void;
  isPolling: boolean;
  onTogglePolling: () => void;
}

const PresenceDashboard: React.FC<PresenceDashboardProps> = ({
  presences,
  onRefresh,
  isPolling,
  onTogglePolling,
}) => {
  const getStatusColor = (status: PresenceData['status']): string => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'in-game':
        return 'bg-blue-500';
      case 'offline':
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: PresenceData['status']): string => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'in-game':
        return 'In Game';
      case 'offline':
        return 'Offline';
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Presence Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of {presences.length} accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePolling}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isPolling
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
            }`}
          >
            {isPolling ? 'Stop Polling' : 'Start Polling'}
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {presences.map((p, idx) => (
          <motion.div
            key={p.accountId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <Card className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {p.displayName.charAt(0)}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-background ${getStatusColor(p.status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                </div>
                <Badge variant={p.status === 'offline' ? 'secondary' : 'default'}>
                  {getStatusLabel(p.status)}
                </Badge>
              </div>

              {/* Info */}
              {p.status === 'in-game' && p.gameName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  <span className="truncate">{p.gameName}</span>
                </div>
              )}

              {p.lastOnline && p.status === 'offline' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last seen: {p.lastOnline}</span>
                </div>
              )}

              {p.robuxBalance !== undefined && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>{p.robuxBalance} Robux</span>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {presences.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Circle className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="font-semibold text-foreground/60 mt-4">No presence data</h3>
          <p className="text-sm text-muted-foreground/50 mt-1">Start polling to see real-time status</p>
        </div>
      )}
    </div>
  );
};

export default PresenceDashboard;