import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// TIPOS
// =============================================================================
interface Friend {
  id: number;
  username: string;
  displayName: string;
  isOnline: boolean;
  isInGame: boolean;
  isInStudio: boolean;
  lastOnline: string;
  avatarUrl: string | null;
  friendshipStatus: string;
}

interface FriendRequest {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  sentAt: string;
}

interface BlockedUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface FriendsPanelProps {
  accountId: string;
}

type SubTab = 'friends' | 'requests' | 'blocked';

export default function FriendsPanel({ accountId }: FriendsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('friends');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-[#0D0D0D] rounded-lg">
        {([
          { key: 'friends' as SubTab, label: 'Amigos' },
          { key: 'requests' as SubTab, label: 'Solicitudes' },
          { key: 'blocked' as SubTab, label: 'Bloqueados' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all ${
              activeSubTab === tab.key
                ? 'bg-[#DE350D] text-white'
                : 'text-[#A0A0A0] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'friends' && <FriendsTab accountId={accountId} />}
      {activeSubTab === 'requests' && <RequestsTab accountId={accountId} />}
      {activeSubTab === 'blocked' && <BlockedTab accountId={accountId} />}
    </div>
  );
}

// =============================================================================
// TAB: Lista de amigos
// =============================================================================
function FriendsTab({ accountId }: { accountId: string }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.getFriends(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando amigos');
        return;
      }
      setFriends(result.data || []);
    } catch (e) {
      setError((e as Error).message || 'Error al cargar amigos');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-7 h-7 border-2 border-[#DE350D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (friends.length === 0 && !error) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No tienes amigos agregados aun
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {friends.map((friend) => (
        <FriendCard key={friend.id} friend={friend} />
      ))}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#FF4757] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#FF4757]">{error}</p>
        </div>
      )}
      <button
        onClick={loadFriends}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Actualizar
      </button>
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#161616] border border-[#2A2A2A] rounded-lg">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt={friend.username} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
            <span className="text-sm font-medium text-gray-400">
              {friend.displayName?.[0]?.toUpperCase() || friend.username[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {friend.displayName || friend.username}
        </p>
        <p className="text-xs text-gray-500 truncate">@{friend.username}</p>
        {friend.isOnline && (
          <span className="inline-flex items-center gap-1 mt-1">
            <span className="w-2 h-2 bg-[#2ED573] rounded-full" />
            <span className="text-xs text-[#2ED573]">
              {friend.isInGame ? 'En juego' : 'En linea'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB: Solicitudes de amistad
// =============================================================================
function RequestsTab({ accountId }: { accountId: string }) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.getFriendRequests(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando solicitudes');
        return;
      }
      setRequests(result.data || []);
    } catch (e) {
      setError((e as Error).message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRespond = async (userId: number, accept: boolean) => {
    setActionId(userId);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.respondFriendRequest(accountId, userId, accept);
      if (!result.success) {
        setError(result.error || 'Error respondiendo solicitud');
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== userId));
    } catch (e) {
      setError((e as Error).message || 'Error respondiendo solicitud');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-7 h-7 border-2 border-[#DE350D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requests.length === 0 && !error) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No tienes solicitudes de amistad pendientes
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {requests.map((req) => (
        <div key={req.id} className="flex items-center gap-3 p-3 bg-[#161616] border border-[#2A2A2A] rounded-lg">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {req.avatarUrl ? (
              <img src={req.avatarUrl} alt={req.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <span className="text-sm font-medium text-gray-400">
                  {req.displayName?.[0]?.toUpperCase() || req.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {req.displayName || req.username}
            </p>
            <p className="text-xs text-gray-500 truncate">@{req.username}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleRespond(req.id, true)}
              disabled={actionId === req.id}
              className="px-3 py-1.5 bg-[#2ED573] hover:bg-[#27ae60] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              Aceptar
            </button>
            <button
              onClick={() => handleRespond(req.id, false)}
              disabled={actionId === req.id}
              className="px-3 py-1.5 bg-[#FF4757] hover:bg-[#cc3333] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#FF4757] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#FF4757]">{error}</p>
        </div>
      )}
      <button
        onClick={loadRequests}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Actualizar
      </button>
    </div>
  );
}

// =============================================================================
// TAB: Lista de bloqueados
// =============================================================================
function BlockedTab({ accountId }: { accountId: string }) {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const loadBlocked = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.getBlocked(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando bloqueados');
        return;
      }
      setBlocked(result.data || []);
    } catch (e) {
      setError((e as Error).message || 'Error al cargar bloqueados');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadBlocked();
  }, [loadBlocked]);

  const handleUnblock = async (userId: number) => {
    setUnblockingId(userId);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.unblockUser(accountId, userId);
      if (!result.success) {
        setError(result.error || 'Error desbloqueando usuario');
        return;
      }
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      setError((e as Error).message || 'Error desbloqueando usuario');
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-7 h-7 border-2 border-[#DE350D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked.length === 0 && !error) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No tienes usuarios bloqueados
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {blocked.map((user) => (
        <div key={user.id} className="flex items-center gap-3 p-3 bg-[#161616] border border-[#2A2A2A] rounded-lg">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <span className="text-sm font-medium text-gray-400">
                  {user.displayName?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.displayName || user.username}
            </p>
            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
          </div>

          {/* Unblock button */}
          <button
            onClick={() => handleUnblock(user.id)}
            disabled={unblockingId === user.id}
            className="flex-shrink-0 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-300 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {unblockingId === user.id ? 'Desbloqueando...' : 'Desbloquear'}
          </button>
        </div>
      ))}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#FF4757] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#FF4757]">{error}</p>
        </div>
      )}
      <button
        onClick={loadBlocked}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Actualizar
      </button>
    </div>
  );
}
