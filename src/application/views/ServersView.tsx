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

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#eee', marginBottom: 16 }}>Servidores</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Place ID" value={placeId} onChange={(e) => setPlaceId(e.target.value)} style={{ flex: 1, padding: 8, background: '#1a1a2e', color: '#eee', border: '1px solid #333', borderRadius: 4, fontSize: 13 }} />
        <button onClick={searchServers} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Buscar</button>
      </div>
      {loading && <p style={{ color: '#666' }}>Cargando...</p>}
      {!loading && servers.length === 0 && <p style={{ color: '#666' }}>Ingresa un Place ID para buscar servidores</p>}
    </div>
  );
}
