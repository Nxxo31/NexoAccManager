import { useState, useEffect, useCallback } from 'react';
import { formatDuration } from '../../../main/services/PresenceService';

interface PresenceData {
  accountId: string;
  status: 'online' | 'in-game' | 'offline';
  gameId?: string;
  gameName?: string;
  thumbnail?: string;
  timeInGame?: number;
  robuxBalance?: number;
  robuxPremium?: boolean;
  lastOnline?: Date;
}

interface Account {
  id: string;
  username: string;
  displayName?: string;
  group: string;
  description?: string;
  lastUsed: Date;
  createdAt: Date;
  robloxUserId?: number;
  thumbnail?: string;
}

interface RecentGame {
  name: string;
  thumbnailUrl: string;
  placeId?: number;
  universeId?: number;
}

const PresenceDashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [presenceData, setPresenceData] = useState<Record<string, PresenceData>>({});
  const [recentGames, setRecentGames] = useState<Record<string, RecentGame[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

  // Fetch accounts from backend
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.list();
      if (result && result.success === false) {
        setError(result.error || 'Error al cargar cuentas');
        return;
      }
      setAccounts(result || []);
    } catch (err) {
      setError('Error al cargar cuentas. Asegúrate de que NexoAccManager esté ejecutándose.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch presence data for all accounts
  const fetchPresence = useCallback(async (accountIds: string[]) => {
    if (accountIds.length === 0) return;

    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.presence.getPresence(accountIds);
      if (result && result.success === false) {
        throw new Error(result.error || 'Error al obtener presencia');
      }
      
      const presenceMap: Record<string, PresenceData> = {};
      (result.data || []).forEach((presence: PresenceData) => {
        presenceMap[presence.accountId] = presence;
      });
      
      setPresenceData(presenceMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error al obtener presencia:', err);
      // Don't set error here to avoid spamming UI with polling errors
    }
  }, []);

  // Fetch recent games for a specific account
  const fetchRecentGamesForAccount = useCallback(async (accountId: string) => {
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.presence.getRecentGames(accountId);
      if (result && result.success === false) {
        throw new Error(result.error || 'Error al obtener juegos recientes');
      }
      
      setRecentGames(prev => ({
        ...prev,
        [accountId]: result.data || []
      }));
    } catch (err) {
      console.error(`Error al obtener juegos recientes para cuenta ${accountId}:`, err);
    }
  }, []);

  // Fetch Robux balance for a specific account
  const fetchRobuxBalanceForAccount = useCallback(async (accountId: string) => {
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.presence.getRobuxBalance(accountId);
      if (result && result.success === false) {
        throw new Error(result.error || 'Error al obtener balance de Robux');
      }
      
      // Update presence data with Robux info
      setPresenceData(prev => ({
        ...prev,
        [accountId]: {
          ...prev[accountId],
          robuxBalance: result.data?.balance,
          robuxPremium: result.data?.premium
        }
      }));
    } catch (err) {
      console.error(`Error al obtener balance de Robux para cuenta ${accountId}:`, err);
    }
  }, []);

  // Start polling for presence updates
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await fetchAccounts();
        
        // Get account IDs for polling
        const accountIds = accounts.map(acc => acc.id);
        if (accountIds.length > 0) {
          // @ts-expect-error api existe en window via preload
          await window.api.presence.startPolling(accountIds, 30_000);
          
          // Initial presence fetch
          await fetchPresence(accountIds);
        }
        
        if (isMounted) setLoading(false);
      } catch (err) {
        if (isMounted) {
          setError('Error al inicializar Presence Dashboard');
          setLoading(false);
        }
        console.error('Error initializing Presence Dashboard:', err);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      // Stop polling when component unmounts
      window.api.presence.stopPolling?.();
    };
  }, [accounts.length, fetchAccounts, fetchPresence]);

  // Handle presence updates from polling
  useEffect(() => {
    // Listen for presence updates from the main process
    // @ts-expect-error api existe en window via preload
    window.api.presence.onPresenceUpdate?.((data: Record<string, PresenceData>) => {
      setPresenceData(data);
      setLastUpdate(new Date());
    });

    return () => {
      // Cleanup listener
      window.api.presence.offPresenceUpdate?.();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const accountIds = accounts.map(acc => acc.id);
      if (accountIds.length > 0) {
        await fetchPresence(accountIds);
      }
    } catch (err) {
      setError('Error al actualizar presencia');
      console.error('Error refreshing presence:', err);
    } finally {
      setRefreshing(false);
    }
  }, [accounts, fetchPresence]);

  const handleToggleExpand = (accountId: string) => {
    setExpandedAccountId(
      expandedAccountId === accountId ? null : accountId
    );
    
    // Fetch recent games when expanding
    if (expandedAccountId !== accountId) {
      const accountIds = accounts.map(acc => acc.id);
      if (accountIds.includes(accountId)) {
        fetchRecentGamesForAccount(accountId);
        fetchRobuxBalanceForAccount(accountId);
      }
    }
  };

  // Calculate activity counts
  const activityCounts = {
    online: Object.values(presenceData).filter(p => p.status === 'online').length,
    inGame: Object.values(presenceData).filter(p => p.status === 'in-game').length,
    offline: Object.values(presenceData).filter(p => p.status === 'offline').length,
    total: accounts.length
  };

  // Format time since last update
  const getTimeSinceLastUpdate = (): string => {
    if (!lastUpdate) return 'Nunca';
    
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin w-12 h-12 border-2 border-[#6c5ce7] border-t-transparent rounded-full"></div>
        <p className="mt-4 text-[#a0a0a0]">Cargando Presence Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/50 border border-red-600 rounded text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="dark flex flex-col h-screen bg-[#1e272e] text-[#f5f6fa]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Presence Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-3 py-1.5 bg-[#6347FF] hover:bg-[#8B6FFF] 
                       rounded text-xs font-medium disabled:opacity-50`}
          >
            {refreshing ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.583-8m0 0a8.003 8.003 0 0113.583-8m0 0A8.003 8.003 0 0016.583 8m-6.583 0a5.586 5.586 0 01-5.583 5.583m11.166 3a5.586 5.586 0 01-5.583 5.583m0-11.166a5.586 5.586 0 005.583 5.583m0 0a5.586 5.586 0 015.583 5.583Z" />
              </svg>
            )}
            Actualizar ahora
          </button>
          <span className="text-xs text-[#a0a0a0]">
            Última actualización: {getTimeSinceLastUpdate()}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Activity counters */}
        <div className="px-6 py-4 border-b border-gray-700 bg-[#161616]">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#2ED573] rounded"></div>
              <span>Online: {activityCounts.online}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#FF4500] rounded"></div>
              <span>En juego: {activityCounts.inGame}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#808080] rounded"></div>
              <span>Offline: {activityCounts.offline}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#FFA502] rounded"></div>
              <span>Total: {activityCounts.total}</span>
            </div>
          </div>
        </div>

        {/* Accounts grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-[#a0a0a0]">
              <p>No hay cuentas para mostrar</p>
              <p className="mt-2 text-xs">
                Agrega cuentas desde la pestaña de Cuentas
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts.map(account => {
                const presence = presenceData[account.id] || {
                  accountId: account.id,
                  status: 'offline'
                };
                
                return (
                  <div key={account.id} className="group">
                    {/* Account card */}
                    <div className="bg-[#161616] border border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                      {/* Card header */}
                      <div className="flex items-center px-4 py-3 border-b border-gray-700">
                        {/* Avatar */}
                        {account.thumbnail ? (
                          <img
                            src={account.thumbnail}
                            alt={`${account.username} avatar`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 01-7 7h14a7 7 0 01-7-7z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Username and status */}
                        <div className="flex-1 ml-3">
                          <p className="font-medium">{account.displayName || account.username}</p>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className={`w-2 h-2 rounded-full 
                              ${presence.status === 'online' ? 'bg-[#2ED573]' : 
                                presence.status === 'in-game' ? 'bg-[#FF4500]' : 
                                'bg-[#808080]'}`}></span>
                            <span className="capitalize">
                              {presence.status === 'online' ? 'En línea' : 
                                presence.status === 'in-game' ? 'En juego' : 
                                'Desconectado'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Expand/collapse button */}
                        <button
                          onClick={() => handleToggleExpand(account.id)}
                          className="p-1 text-[#a0a0a0] hover:text-white hover:bg-gray-700 rounded"
                        >
                          {expandedAccountId === account.id ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Game info if in-game */}
                      {presence.status === 'in-game' && presence.gameName && presence.thumbnail && (
                        <div className="flex items-center px-4 py-3 border-t border-gray-700">
                          {presence.thumbnail ? (
                            <img
                              src={presence.thumbnail}
                              alt={`${presence.gameName} thumbnail`}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-600 rounded flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"/>
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 ml-3">
                            <p className="font-medium truncate max-w-[200px]">{presence.gameName}</p>
                            {presence.timeInGame !== undefined && (
                              <p className="text-xs text-[#a0a0a0]">
                                {formatDuration(presence.timeInGame)}
                              </p>
                            )}
                          </div>
                          
                          {/* Join game button (hover effect would be implemented with onMouseEnter/Leave in practice) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => {
                                // Join game logic would go here
                                console.log(`Unirse al juego: ${presence.gameName}`);
                              }}
                              className="px-2 py-1 bg-[#6347FF] hover:bg-[#8B6FFF] text-xs rounded"
                            >
                              Unirse al juego
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Robux balance */}
                      <div className="flex items-center px-4 py-3 border-t border-gray-700">
                        <div className="w-16 h-16 bg-[#FFA502] rounded flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                          </svg>
                        </div>
                        <div className="flex-1 ml-3">
                          <p className="font-medium">
                            {presence.robuxBalance !== undefined ? 
                              presence.robuxBalance.toLocaleString() : 
                              'Cargando...'}
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"/>
                            </svg>
                          </p>
                          {presence.robuxPremium && (
                            <span className="ml-2 text-xs bg-[#6347FF] text-white px-1.5 rounded">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded content - Recent Games */}
                      {expandedAccountId === account.id && (
                        <div className="border-t border-gray-700">
                          <div className="px-4 py-3 font-medium text-[#a0a0a0] border-b border-gray-700">
                            Juegos recientes
                          </div>
                          {recentGames[account.id] && recentGames[account.id].length > 0 ? (
                            <div className="space-y-2">
                              {recentGames[account.id].map((game, index) => (
                                <div key={game.name || index} className="flex items-center px-3 py-2 bg-[#1E1E1E] rounded">
                                  {game.thumbnailUrl ? (
                                    <img
                                      src={game.thumbnailUrl}
                                      alt={`${game.name} thumbnail`}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"/>
                                      </svg>
                                    </div>
                                  )}
                                  <div className="flex-1 ml-3">
                                    <p className="font-mini text-[10px] truncate max-w-[150px]">{game.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-4 text-center text-[10px] text-[#a0a0a0]">
                              No hay juegos recientes disponibles
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresenceDashboard;