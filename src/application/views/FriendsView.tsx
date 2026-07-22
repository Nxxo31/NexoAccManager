// Application View: FriendsView — friends list + requests

import { useState } from 'react';

export function FriendsView(): JSX.Element {
  const [tab, setTab] = useState<'friends' | 'requests' | 'followers'>('friends');

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#eee', marginBottom: 16 }}>Amigos</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['friends', 'requests', 'followers'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', background: tab === t ? '#3b82f6' : '#1a1a2e', color: tab === t ? '#fff' : '#888', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            {t === 'friends' ? 'Amigos' : t === 'requests' ? 'Solicitudes' : 'Seguidores'}
          </button>
        ))}
      </div>
      <p style={{ color: '#666' }}>Selecciona una cuenta para ver su información de amigos.</p>
    </div>
  );
}
