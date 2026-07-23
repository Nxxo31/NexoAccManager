// Application View: FriendsView — friends list + requests

import { useState } from 'react';

export function FriendsView(): JSX.Element {
  const [tab, setTab] = useState<'friends' | 'requests' | 'followers'>('friends');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    background: active ? 'var(--primary)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  });

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Amigos</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['friends', 'requests', 'followers'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>
            {t === 'friends' ? 'Amigos' : t === 'requests' ? 'Solicitudes' : 'Seguidores'}
          </button>
        ))}
      </div>
      <p style={{ color: 'var(--text-tertiary)' }}>Selecciona una cuenta para ver su información de amigos.</p>
    </div>
  );
}
