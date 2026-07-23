// Application View: GamesView — search games + favorites

import { useState } from 'react';
import { useUIStore } from '../store/uiStore';

export function GamesView(): JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const notify = useUIStore((s) => s.notify);

  const search = async () => {
    if (!query) return;
    setLoading(true);
    const result = await window.api.roblox.gamesSearch(query, '');
    if (result.success) setResults((result.data as { id: number; name: string }[]) ?? []);
    else notify('error', result.error ?? 'Error');
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = { flex: 1, padding: 8, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 };
  const btnStyle: React.CSSProperties = { padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
  const cardStyle: React.CSSProperties = { padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 };

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Juegos</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Buscar juego..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} style={inputStyle} />
        <button onClick={search} style={btnStyle}>Buscar</button>
      </div>
      {loading && <p style={{ color: 'var(--text-tertiary)' }}>Cargando...</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {results.map((g) => (
          <div key={g.id} style={cardStyle}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>{g.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ID: {g.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
