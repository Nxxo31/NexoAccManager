import * as React from 'react';
import { User, UserPlus, UserCheck, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';

interface Friend {
  userId: number;
  username: string;
  displayName?: string;
  isOnline?: boolean;
  presence?: {
    userPresenceType: number; // 0=Offline, 1=Online, 2=InGame, 3=InStudio, 4=Invisible
    lastLocation?: string;
    placeId?: string;
    gameId?: string;
  };
  avatarUrl?: string;
}

interface FriendRequest {
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

type Tab = 'friends' | 'requests' | 'followers';

export const FriendsHubView: React.FC = () => {
  const { t } = useTranslation();
  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);

  const [activeTab, setActiveTab] = React.useState<Tab>('friends');
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [requests, setRequests] = React.useState<FriendRequest[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  // Account to use for friends operations
  const activeAccount = selectedAccount || accounts[0];

  const refresh = React.useCallback(async () => {
    if (!api?.friends || !activeAccount?.id) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'friends') {
        const result = await api.friends.getFriends(activeAccount.id);
        if (result?.success && Array.isArray(result.data)) {
          setFriends(result.data);
        } else {
          setFriends([]);
        }
      } else if (activeTab === 'requests') {
        const result = await api.friends.getFriendRequests(activeAccount.id);
        if (result?.success && Array.isArray(result.data)) {
          setRequests(result.data);
        } else {
          setRequests([]);
        }
      }
    } catch (e) {
      setError((e as Error).message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [api, activeAccount?.id, activeTab]);

  React.useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  // Presence polling — 30s
  React.useEffect(() => {
    if (!api?.presence || !activeAccount?.id) return;
    const accountIds = accounts.map((a: any) => a.id).filter(Boolean);
    if (accountIds.length > 0) {
      api.presence.startPolling(accountIds, 30000).catch(() => {});
    }
    return () => {
      api.presence?.stopPolling?.().catch(() => {});
    };
  }, [api, accounts, activeAccount?.id]);

  const handleAcceptRequest = async (userId: number) => {
    if (!api?.friends || !activeAccount?.id) return;
    try {
      await api.friends.respondToRequest(activeAccount.id, userId, true);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDeclineRequest = async (userId: number) => {
    if (!api?.friends || !activeAccount?.id) return;
    try {
      await api.friends.respondToRequest(activeAccount.id, userId, false);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleFollowUser = async (userId: number) => {
    if (!api?.friends || !activeAccount?.id) return;
    try {
      await api.friends.followUser(activeAccount.id, userId);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const presenceLabel = (friend: Friend): string => {
    const p = friend.presence?.userPresenceType;
    switch (p) {
      case 1: return t('presence.online', 'En linea');
      case 2: return t('presence.inGame', 'En juego');
      case 3: return t('presence.inStudio', 'En Studio');
      case 4: return t('presence.hidden', 'Oculto');
      default: return t('presence.offline', 'Desconectado');
    }
  };

  const presenceColor = (friend: Friend): string => {
    const p = friend.presence?.userPresenceType;
    switch (p) {
      case 1: return '#2ED573';
      case 2: return '#6347FF';
      case 3: return '#FFA502';
      case 4: return '#4A4D52';
      default: return '#8A8F98';
    }
  };

  if (!activeAccount) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t('views.friends.title', 'Amigos')}</h2>
        </div>
        <p className="text-muted-foreground text-sm py-8 text-center">
          {t('views.friends.noAccount', 'Selecciona una cuenta para ver tus amigos')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t('views.friends.title', 'Amigos')}</h2>
          {activeAccount && (
            <span className="text-xs text-muted-foreground ml-2">
              {t('views.friends.account', 'Cuenta')}: {activeAccount.username}
            </span>
          )}
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-bg-surface transition-colors"
          aria-label={t('common.refresh', 'Actualizar')}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'friends'
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {t('views.friends.tabFriends', 'Amigos')}
            {friends.length > 0 && (
              <span className="ml-1.5 text-xs">({friends.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {t('views.friends.tabRequests', 'Solicitudes')}
            {requests.length > 0 && (
              <span className="ml-1.5 text-xs bg-primary text-white px-1.5 rounded-full">{requests.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'followers'
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {t('views.friends.tabFollowers', 'Seguidores')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-error/10 border border-error text-sm text-error">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Friends tab */}
      {activeTab === 'friends' && !loading && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {t('views.friends.noFriends', 'No tienes amigos o no se pudieron cargar')}
            </p>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.userId}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                  ) : (
                    friend.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{friend.displayName || friend.username}</p>
                  {friend.displayName && friend.displayName !== friend.username && (
                    <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {presenceLabel(friend)}
                    {friend.presence?.lastLocation && ` — ${friend.presence.lastLocation}`}
                  </p>
                </div>

                {/* Presence dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: presenceColor(friend) }}
                  title={presenceLabel(friend)}
                />

                {/* Follow button */}
                <button
                  onClick={() => handleFollowUser(friend.userId)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-accent/20 transition-colors"
                  aria-label={t('views.friends.follow', 'Seguir')}
                >
                  <UserPlus className="h-3 w-3" />
                  <span className="hidden sm:inline">{t('views.friends.follow', 'Seguir')}</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && !loading && (
        <div className="space-y-2">
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {t('views.friends.noRequests', 'No tienes solicitudes de amistad pendientes')}
            </p>
          ) : (
            requests.map((req) => (
              <div
                key={req.userId}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                  {req.avatarUrl ? (
                    <img src={req.avatarUrl} alt={req.username} className="w-full h-full object-cover" />
                  ) : (
                    req.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.displayName || req.username}</p>
                  {req.displayName && req.displayName !== req.username && (
                    <p className="text-xs text-muted-foreground truncate">@{req.username}</p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.userId)}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-success text-white hover:bg-success/90 transition-colors"
                    aria-label={t('views.friends.accept', 'Aceptar')}
                  >
                    <UserCheck className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.userId)}
                    className="px-3 py-1 text-xs rounded border border-error text-error hover:bg-error/10 transition-colors"
                    aria-label={t('views.friends.decline', 'Rechazar')}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Followers tab */}
      {activeTab === 'followers' && !loading && (
        <p className="text-center text-muted-foreground py-8 text-sm">
          {t('views.friends.followersComingSoon', 'Lista de seguidores proximamente')}
        </p>
      )}
    </div>
  );
};

FriendsHubView.displayName = 'FriendsHubView';
