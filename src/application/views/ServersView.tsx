// Application View: ServersView — search servers + join

import { useState } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';

export function ServersView(): JSX.Element {
  const [placeId, setPlaceId] = useState('');
  const [servers, setServers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const accounts = useAccountStore((s) => s.accounts);
  const notify = useUIStore((s) => s.notify);

  const searchServers = async () => {
    if (!placeId) return;
    setLoading(true);
    const acc = accounts[0];
    if (!acc) { notify('error', 'No hay cuentas'); setLoading(false); return; }
    const result = await window.api.roblox.serversList(placeId, '', 'Public');
    if (result.success) setServers((result.data as { data: unknown[] })?.data ?? []);
    else notify('error', result.error ?? 'Error');
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = { flex: 1, padding: 8, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 };
  const btnStyle: React.CSSProperties = { padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Servidores</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Place ID" value={placeId} onChange={(e) => setPlaceId(e.target.value)} style={inputStyle} />
        <button onClick={searchServers} style={btnStyle}>Buscar</button>
      </div>
      {loading && <p style={{ color: 'var(--text-tertiary)' }}>Cargando...</p>}
      {!loading && servers.length === 0 && <p style={{ color: 'var(--text-tertiary)' }}>Ingresa un Place ID para buscar servidores</p>}
    </div>
  );
}
