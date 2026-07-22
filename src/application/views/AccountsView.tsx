// Application View: AccountsView — main hub with grid + login button

import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';

export function AccountsView(): JSX.Element {
  const { accounts, loading, loginBrowser, removeAccount, select, selectedId } = useAccounts();
  const [showLogin, setShowLogin] = useState(false);
  const [cookieInput, setCookieInput] = useState('');

  if (accounts.length === 0 && !loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ fontSize: 64, opacity: 0.3 }}>👥</div>
        <p style={{ color: '#888', fontSize: 16 }}>No hay cuentas agregadas</p>
        <button onClick={() => setShowLogin(true)} style={{ padding: '10px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          Iniciar sesión
        </button>
        {showLogin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 400 }}>
            <textarea placeholder="Pegar cookie .ROBLOSECURITY..." value={cookieInput} onChange={(e) => setCookieInput(e.target.value)} style={{ padding: 8, fontSize: 13, height: 80, background: '#1a1a2e', color: '#eee', border: '1px solid #333', borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => useAccounts().addAccount(cookieInput)} style={{ flex: 1, padding: 8, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Agregar cookie</button>
              <button onClick={async () => { await loginBrowser(); }} style={{ flex: 1, padding: 8, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Login browser</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#eee' }}>Cuentas ({accounts.length}/50)</h2>
        <button onClick={() => setShowLogin(!showLogin)} style={{ padding: '6px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          + Agregar
        </button>
      </div>
      {showLogin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="Cookie .ROBLOSECURITY" value={cookieInput} onChange={(e) => setCookieInput(e.target.value)} style={{ flex: 1, padding: 8, background: '#1a1a2e', color: '#eee', border: '1px solid #333', borderRadius: 4, fontSize: 13 }} />
          <button onClick={async () => { await useAccounts().addAccount(cookieInput); setCookieInput(''); setShowLogin(false); }} style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Agregar</button>
          <button onClick={loginBrowser} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Browser</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {accounts.map((acc) => (
          <div key={acc.id} onClick={() => select(acc.id)} style={{
            padding: 12, background: selectedId === acc.id ? '#2a3a5e' : '#1a1a2e',
            border: selectedId === acc.id ? '2px solid #3b82f6' : '1px solid #2a2a4e',
            borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {acc.avatarUrl && <img src={acc.avatarUrl} alt={acc.username} style={{ width: 40, height: 40, borderRadius: '50%' }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#eee', fontSize: 14, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{acc.username}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{acc.group}</div>
            </div>
            {acc.isFavorite && <span style={{ fontSize: 14 }}>⭐</span>}
            <button onClick={(e) => { e.stopPropagation(); removeAccount(acc.id); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
