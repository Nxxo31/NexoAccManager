// Application View: ServersView — search servers + join

import { useState, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';

interface ServerInfo {
  id: string;
  placeId: string;
  currentPlayers: number;
  maxPlayers: number;
  ping: number;
  fps: number;
}

export function ServersView(): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const notify = useUIStore((s) => s.notify);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [placeId, setPlaceId] = useState('');
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId && placeId) searchServers();
  }, [selectedAccountId]);

  const searchServers = async () => {
    if (!placeId || !selectedAccountId) return;
    setLoading(true);
    try {
      const result = await window.api.byAccount.serversList(placeId, selectedAccountId, 'Public');
      if (result.success) {
        const data = result.data as ServerInfo[];
        setServers(Array.isArray(data) ? data : []);
      } else {
        notify('error', result.error ?? 'Error');
        setServers([]);
      }
    } catch {
      notify('error', 'Error al buscar servidores');
      setServers([]);
    }
    setLoading(false);
  };

  const handleJoin = async (jobId: string) => {
    const result = await window.api.roblox.serversJoin(selectedAccountId, placeId, jobId);
    if (result.success) {
      notify('success', 'Uniéndose al servidor...');
    } else {
      notify('error', result.error ?? 'Error al unirse');
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <p style={{ color: 'var(--text-tertiary)' }}>Agrega una cuenta primero.</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Servidores</h2>

      {/* Account selector */}
      <div className="flex gap-2 mb-3">
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="flex-1 px-3 py-2 rounded text-sm border"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          <option value="">Seleccionar cuenta...</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.username}</option>
          ))}
        </select>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Place ID..."
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchServers()}
          className="flex-1 px-3 py-2 rounded text-sm border"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        />
        <button
          onClick={searchServers}
          className="px-4 py-2 rounded text-sm"
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Buscar
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-tertiary)' }}>Cargando servidores...</p>}

      {!loading && !selectedAccountId && (
        <p style={{ color: 'var(--text-tertiary)' }}>Selecciona una cuenta para buscar servidores.</p>
      )}

      {/* Server list */}
      {!loading && selectedAccountId && servers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((s) => (
            <div
              key={s.id}
              className="p-3 rounded-lg border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {s.id.substring(0, 12)}...
                </span>
                <span style={{ color: s.ping < 100 ? '#22c55e' : s.ping < 200 ? '#eab308' : '#ef4444' }}>
                  {s.ping}ms
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {s.currentPlayers}/{s.maxPlayers} jugadores
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {s.fps} FPS
                </span>
              </div>
              {/* Player bar */}
              <div className="w-full h-1.5 rounded-full mb-3" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(s.currentPlayers / s.maxPlayers) * 100}%`,
                    background: 'var(--primary)',
                  }}
                />
              </div>
              <button
                onClick={() => handleJoin(s.id)}
                className="w-full text-xs py-1.5 rounded transition-colors"
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Unirse
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && selectedAccountId && placeId && servers.length === 0 && (
        <p style={{ color: 'var(--text-tertiary)' }}>No se encontraron servidores. Verifica el Place ID.</p>
      )}
    </div>
  );
}
