import * as React from 'react';
import { motion } from 'framer-motion';
import { Circle, Gamepad2, DollarSign, Clock, Activity, Loader2 } from 'lucide-react';
import { Card } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { cn } from '@renderer/lib/utils';

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

const PresenceDashboard: React.FC = () => {
  const [presences, setPresences] = React.useState<PresenceData[]>([]);
  const [isPolling, setIsPolling] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const accounts = useAccountStore((s) => s.accounts);

  // Safe API accessor
  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  const fetchPresence = React.useCallback(async () => {
    if (accounts.length === 0 || !api) return;
    setLoading(true);
    try {
      const accountIds = accounts.map((a) => a.id);
      const result = await api.presence.getPresence(accountIds);
      if (result && result.success) {
        setPresences(result.data || []);
      } else if (Array.isArray(result)) {
        setPresences(result);
      }
    } catch (err) {
      console.error('Presence fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [accounts, api]);

  const handleTogglePolling = async () => {
    if (!api) return;
    if (isPolling) {
      try {
        await api.presence.stopPolling();
      } catch { /* ignore */ }
      setIsPolling(false);
    } else {
      if (accounts.length === 0) return;
      try {
        const accountIds = accounts.map((a) => a.id);
        await api.presence.startPolling(accountIds, 30000);
        setIsPolling(true);
        await fetchPresence();
      } catch (err) {
        console.error('Polling start error:', err);
      }
    }
  };

  const getStatusColor = (status: PresenceData['status']): string => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'in-game': return 'bg-blue-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: PresenceData['status']): string => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-game': return 'En juego';
      case 'offline': return 'Offline';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Presencia</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {presences.length > 0 ? `${presences.length} cuentas monitoreadas` : 'Monitoreo en tiempo real'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPresence}
              disabled={loading || !api}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              <span className="ml-1.5">Actualizar</span>
            </Button>
            <Button
              variant={isPolling ? 'outline' : 'default'}
              size="sm"
              onClick={handleTogglePolling}
              disabled={!api}
            >
              {isPolling ? 'Detener' : 'Iniciar Polling'}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {presences.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Circle className="h-12 w-12 text-muted-foreground/20" />
            <h3 className="font-semibold text-foreground/40 mt-4">Sin datos de presencia</h3>
            <p className="text-sm text-muted-foreground/40 mt-1">
              Actualiza o inicia polling para ver el estado de tus cuentas
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {presences.map((p, idx) => (
              <motion.div
                key={p.accountId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(idx * 0.05, 0.4), duration: 0.2 }}
              >
                <Card className="p-4 space-y-3 border-border hover:border-border-light transition-colors">
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
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                          {p.displayName?.charAt(0) || '?'}
                        </div>
                      )}
                      <span
                        className={cn(
                          'absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-background',
                          getStatusColor(p.status)
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                    </div>
                    <Badge variant={p.status === 'offline' ? 'secondary' : 'default'} className="text-xs">
                      {getStatusLabel(p.status)}
                    </Badge>
                  </div>

                  {/* Info */}
                  {p.status === 'in-game' && p.gameName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/5 px-2 py-1.5 rounded-md border border-blue-500/10">
                      <Gamepad2 className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                      <span className="truncate">{p.gameName}</span>
                    </div>
                  )}

                  {p.lastOnline && p.status === 'offline' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Último acceso: {p.lastOnline}</span>
                    </div>
                  )}

                  {p.robuxBalance !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      <span className="font-mono-data">{p.robuxBalance} Robux</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {loading && presences.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PresenceDashboard;