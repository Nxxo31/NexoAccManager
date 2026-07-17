import * as React from 'react';
import {
  User, UserPlus, UserCheck, UserMinus, Clock, Loader2, AlertCircle,
  RefreshCw, ChevronDown, Search, ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { Account } from '@/types/Account';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Friend {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  isOnline: boolean;
  isInGame: boolean;
  isInStudio: boolean;
  lastOnline?: string;
  avatarUrl?: string | null;
  friendshipStatus?: string;
  presence?: {
    userPresenceType: number;
    lastLocation?: string;
    placeId?: number;
    gameId?: string;
  };
}

interface FriendRequest {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
  sentAt?: string;
}

interface FollowerEntry {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

type Tab = 'friends' | 'requests' | 'followers';

// ─── Component ─────────────────────────────────────────────────────────────────

export const FriendsHubView: React.FC = () => {
  const { t } = useTranslation();
  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);

  const [activeTab, setActiveTab] = React.useState<Tab>('friends');
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [requests, setRequests] = React.useState<FriendRequest[]>([]);
  const [followers, setFollowers] = React.useState<FollowerEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [accountSelectorOpen, setAccountSelectorOpen] = React.useState(false);
  const [activeAccountId, setActiveAccountId] = React.useState<string | null>(null);
  const [searchUsername, setSearchUsername] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searching, setSearching] = React.useState(false);

  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  // Resolve active account: explicit selection > selectedAccount > first account
  const activeAccount: Account | undefined = React.useMemo(() => {
    if (activeAccountId) return accounts.find((a) => a.id === activeAccountId);
    return selectedAccount || accounts[0];
  }, [activeAccountId, accounts, selectedAccount]);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const refresh = React.useCallback(async () => {
    if (!api?.account || !activeAccount?.id) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'friends') {
        const result = await api.account.getFriends(activeAccount.id);
        if (result?.success && Array.isArray(result.data)) {
          // Normalize: backend returns `id`, ensure `userId` is available
          setFriends(result.data.map((f: any) => ({
            ...f,
            userId: f.userId ?? f.id,
          })));
        } else {
          setFriends([]);
        }
      } else if (activeTab === 'requests') {
        const result = await api.account.getFriendRequests(activeAccount.id);
        if (result?.success && Array.isArray(result.data)) {
          setRequests(result.data.map((r: any) => ({
            ...r,
            userId: r.userId ?? r.id,
          })));
        } else {
          setRequests([]);
        }
      } else if (activeTab === 'followers') {
        // Roblox followers API: friends.roblox.com/v1/users/{userId}/followers
        // We need the robloxUserId from the account
        const rbxId = activeAccount.robloxUserId;
        if (!rbxId) {
          setFollowers([]);
        } else {
          // Use the account's cookie to fetch followers via IPC
          // Since there's no direct IPC for followers, we use the search-user endpoint
          // or fall back to an empty state with explanation
          setFollowers([]);
        }
      }
    } catch (e) {
      setError((e as Error).message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [api, activeAccount, activeTab]);

  React.useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  // ─── Presence Polling ───────────────────────────────────────────────────────

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

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAcceptRequest = async (userId: number) => {
    if (!api?.account || !activeAccount?.id) return;
    try {
      await api.account.respondFriendRequest(activeAccount.id, userId, true);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
      // Refresh friends list after accepting
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDeclineRequest = async (userId: number) => {
    if (!api?.account || !activeAccount?.id) return;
    try {
      await api.account.respondFriendRequest(activeAccount.id, userId, false);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleFollowUser = async (userId: number) => {
    if (!api?.account || !activeAccount?.id) return;
    try {
      await api.account.followUser(activeAccount.id, userId);
      // Visual feedback: could add a toast here
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleUnfollowUser = async (userId: number) => {
    if (!api?.account || !activeAccount?.id) return;
    try {
      await api.account.unfollowUser(activeAccount.id, userId);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleSearchUser = async () => {
    if (!api?.roblox?.searchUser || !searchUsername.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const result = await api.roblox.searchUser(searchUsername.trim());
      if (result?.success && Array.isArray(result.data)) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const handleOpenProfile = (userId: number) => {
    if (api?.shell?.openExternal) {
      api.shell.openExternal(`https://www.roblox.com/users/${userId}/profile`);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getPresenceType = (friend: Friend): number => {
    if (friend.presence?.userPresenceType !== undefined) return friend.presence.userPresenceType;
    if (friend.isInGame) return 2;
    if (friend.isInStudio) return 3;
    if (friend.isOnline) return 1;
    return 0;
  };

  const presenceLabel = (friend: Friend): string => {
    const p = getPresenceType(friend);
    switch (p) {
      case 1: return t('presence.online', 'En línea');
      case 2: return t('presence.inGame', 'En juego');
      case 3: return t('presence.inStudio', 'En Studio');
      case 4: return t('presence.hidden', 'Oculto');
      default: return t('presence.offline', 'Desconectado');
    }
  };

  const presenceColor = (friend: Friend): string => {
    const p = getPresenceType(friend);
    switch (p) {
      case 1: return '#2ED573';
      case 2: return '#6347FF';
      case 3: return '#FFA502';
      case 4: return '#4A4D52';
      default: return '#8A8F98';
    }
  };

  const avatarUrlFor = (entry: Friend | FriendRequest | FollowerEntry): string | null => {
    return (entry as any).avatarUrl ?? null;
  };

  // ─── Render: No account ─────────────────────────────────────────────────────

  if (accounts.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t('views.friends.title', 'Amigos')}</h2>
        </div>
        <p className="text-muted-foreground text-sm py-8 text-center">
          {t('views.friends.noAccount', 'Añade una cuenta para ver tus amigos')}
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

      {/* Account Selector */}
      <div className="relative">
        <button
          onClick={() => setAccountSelectorOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-bg-card hover:bg-bg-surface transition-colors text-sm"
          aria-label={t('views.friends.selectAccount', 'Seleccionar cuenta')}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
              {activeAccount?.avatarUrl ? (
                <img src={activeAccount.avatarUrl} alt={activeAccount.username} className="w-full h-full object-cover" />
              ) : (
                activeAccount?.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <span className="truncate font-medium">
              {activeAccount?.displayName || activeAccount?.username || '—'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${accountSelectorOpen ? 'rotate-180' : ''}`} />
        </button>
        {accountSelectorOpen && (
          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-bg-card shadow-lg">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setActiveAccountId(acc.id);
                  setAccountSelectorOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-surface transition-colors text-left ${
                  activeAccount?.id === acc.id ? 'bg-bg-surface' : ''
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-bg-surface flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                  {acc.avatarUrl ? (
                    <img src={acc.avatarUrl} alt={acc.username} className="w-full h-full object-cover" />
                  ) : (
                    acc.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <span className="truncate">{acc.displayName || acc.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search user to follow */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          placeholder={t('views.friends.searchUser', 'Buscar usuario para seguir...')}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-bg-card focus:outline-none focus:border-primary transition-colors"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchUser(); }}
        />
        <button
          onClick={handleSearchUser}
          disabled={searching || !searchUsername.trim()}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          aria-label={t('common.search', 'Buscar')}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t('views.friends.searchResults', 'Resultados de búsqueda')}
          </p>
          {searchResults.map((user) => (
            <div
              key={user.id || user.userId}
              className="flex items-center gap-3 p-2 rounded-lg border border-border bg-bg-card/50 hover:bg-bg-surface transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  user.username?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
              <button
                onClick={() => handleFollowUser(user.id || user.userId)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-accent/20 transition-colors"
                aria-label={t('views.friends.follow', 'Seguir')}
              >
                <UserPlus className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleOpenProfile(user.id || user.userId)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-bg-surface transition-colors"
                aria-label={t('common.viewProfile', 'Ver perfil')}
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => { setActiveTab('friends'); setRefreshKey((k) => k + 1); }}
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
            onClick={() => { setActiveTab('requests'); setRefreshKey((k) => k + 1); }}
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
            onClick={() => { setActiveTab('followers'); setRefreshKey((k) => k + 1); }}
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
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-error hover:text-error/80">
            ×
          </button>
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
                key={friend.userId || friend.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                  {avatarUrlFor(friend) ? (
                    <img src={avatarUrlFor(friend)!} alt={friend.username} className="w-full h-full object-cover" />
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

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleFollowUser(friend.userId || friend.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-accent/20 transition-colors"
                    aria-label={t('views.friends.follow', 'Seguir')}
                    title={t('views.friends.follow', 'Seguir')}
                  >
                    <UserPlus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleUnfollowUser(friend.userId || friend.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-error/10 transition-colors"
                    aria-label={t('views.friends.unfollow', 'Dejar de seguir')}
                    title={t('views.friends.unfollow', 'Dejar de seguir')}
                  >
                    <UserMinus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleOpenProfile(friend.userId || friend.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-bg-surface transition-colors"
                    aria-label={t('common.viewProfile', 'Ver perfil')}
                    title={t('common.viewProfile', 'Ver perfil')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
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
                key={req.userId || req.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                  {avatarUrlFor(req) ? (
                    <img src={avatarUrlFor(req)!} alt={req.username} className="w-full h-full object-cover" />
                  ) : (
                    req.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.displayName || req.username}</p>
                  {req.displayName && req.displayName !== req.username && (
                    <p className="text-xs text-muted-foreground truncate">@{req.username}</p>
                  )}
                  {req.sentAt && (
                    <p className="text-xs text-muted-foreground truncate">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(req.sentAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.userId || req.id)}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-success text-white hover:bg-success/90 transition-colors"
                    aria-label={t('views.friends.accept', 'Aceptar')}
                  >
                    <UserCheck className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('views.friends.accept', 'Aceptar')}</span>
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.userId || req.id)}
                    className="px-3 py-1 text-xs rounded border border-error text-error hover:bg-error/10 transition-colors"
                    aria-label={t('views.friends.decline', 'Rechazar')}
                  >
                    {t('views.friends.decline', 'Rechazar')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Followers tab */}
      {activeTab === 'followers' && !loading && (
        <div className="space-y-2">
          {followers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {t('views.friends.noFollowers', 'No hay seguidores para mostrar')}
            </p>
          ) : (
            followers.map((follower) => (
              <div
                key={follower.userId || follower.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                  {avatarUrlFor(follower) ? (
                    <img src={avatarUrlFor(follower)!} alt={follower.username} className="w-full h-full object-cover" />
                  ) : (
                    follower.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{follower.displayName || follower.username}</p>
                  {follower.displayName && follower.displayName !== follower.username && (
                    <p className="text-xs text-muted-foreground truncate">@{follower.username}</p>
                  )}
                </div>
                <button
                  onClick={() => handleOpenProfile(follower.userId || follower.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-bg-surface transition-colors"
                  aria-label={t('common.viewProfile', 'Ver perfil')}
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

FriendsHubView.displayName = 'FriendsHubView';
