// Application View: FriendsView — friend list, requests, followers

import { useState, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';

interface Friend {
  userId: number;
  username: string;
  displayName: string;
  isOnline: boolean;
}

interface FriendRequest {
  id: number;
  requesterId: number;
  username: string;
  displayName: string;
}

export function FriendsView(): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const notify = useUIStore((s) => s.notify);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId) loadData();
  }, [selectedAccountId, activeTab]);

  const loadData = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const result = await window.api.byAccount.friendsList(selectedAccountId);
        if (result.success) {
          const data = result.data as Friend[];
          setFriends(Array.isArray(data) ? data : []);
        } else {
          notify('error', result.error ?? 'Error');
        }
      } else {
        const result = await window.api.byAccount.friendsRequests(selectedAccountId);
        if (result.success) {
          const data = result.data as FriendRequest[];
          setRequests(Array.isArray(data) ? data : []);
        } else {
          notify('error', result.error ?? 'Error');
        }
      }
    } catch {
      notify('error', 'Error al cargar datos');
    }
    setLoading(false);
  };

  const handleRespond = async (requestId: number, accept: boolean) => {
    const result = await window.api.byAccount.friendsRespond(requestId, accept, selectedAccountId);
    if (result.success) {
      notify('success', accept ? 'Solicitud aceptada' : 'Solicitud rechazada');
      setRequests(requests.filter((r) => r.id !== requestId));
    } else {
      notify('error', result.error ?? 'Error');
    }
  };

  const handleFollowToggle = async (userId: number, isFollowing: boolean) => {
    const fn = isFollowing ? window.api.byAccount.unfollow : window.api.byAccount.follow;
    const result = await fn(userId, selectedAccountId);
    if (result.success) {
      setFriends(friends.map((f) => f.userId === userId
        ? { ...f, isOnline: !isFollowing ? f.isOnline : f.isOnline }
        : f));
      notify('success', isFollowing ? 'Dejaste de seguir' : 'Ahora sigues a este usuario');
    } else {
      notify('error', result.error ?? 'Error');
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <p style={{ color: 'var(--text-tertiary)' }}>Agrega una cuenta primero para ver amigos.</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Amigos</h2>

      {/* Account selector */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="flex-1 px-3 py-2 rounded text-sm border"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
        >
          <option value="">Seleccionar cuenta...</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.username}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['friends', 'requests'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-3 py-1.5 text-sm rounded transition-colors"
            style={{
              background: activeTab === t ? 'var(--primary)' : 'var(--bg-card)',
              color: activeTab === t ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t === 'friends' ? 'Amigos' : 'Solicitudes'}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--text-tertiary)' }}>Cargando...</p>}

      {!loading && !selectedAccountId && (
        <p style={{ color: 'var(--text-tertiary)' }}>Selecciona una cuenta para ver su información.</p>
      )}

      {/* Friends list */}
      {!loading && selectedAccountId && activeTab === 'friends' && (
        <div className="flex flex-col gap-2">
          {friends.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)' }}>Sin amigos para mostrar.</p>
          ) : (
            friends.map((f) => (
              <div
                key={f.userId}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: f.isOnline ? '#22c55e' : 'var(--text-tertiary)' }}
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {f.displayName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      @{f.username}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowToggle(f.userId, true)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                >
                  Dejar de seguir
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests list */}
      {!loading && selectedAccountId && activeTab === 'requests' && (
        <div className="flex flex-col gap-2">
          {requests.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)' }}>Sin solicitudes pendientes.</p>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {r.displayName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    @{r.username}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(r.id, true)}
                    className="text-xs px-3 py-1 rounded"
                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleRespond(r.id, false)}
                    className="text-xs px-3 py-1 rounded"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
