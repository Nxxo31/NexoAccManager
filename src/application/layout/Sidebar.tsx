// Application Layout: Sidebar — navigation + counter

import { useUIStore } from '../store/uiStore';
import { PAGES } from '../../config/constants';

const NAV_ITEMS = [
  { key: PAGES.ACCOUNTS, label: 'Cuentas', icon: '👥' },
  { key: PAGES.SERVERS, label: 'Servidores', icon: '🌐' },
  { key: PAGES.GAMES, label: 'Juegos', icon: '🎮' },
  { key: PAGES.FRIENDS, label: 'Amigos', icon: '📧' },
  { key: PAGES.SETTINGS, label: 'Ajustes', icon: '⚙️' },
];

export function Sidebar({ accountCount }: { accountCount: number }): JSX.Element {
  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);

  return (
    <div style={{ width: 200, background: '#1a1a2e', color: '#eee', display: 'flex', flexDirection: 'column', padding: 0, flexShrink: 0 }}>
      <div style={{ padding: '20px 16px', fontWeight: 700, fontSize: 16, borderBottom: '1px solid #2a2a4e' }}>
        NexoAccManager
      </div>
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 16px', background: activeView === item.key ? '#2a2a4e' : 'transparent',
              border: 'none', color: activeView === item.key ? '#fff' : '#aaa', cursor: 'pointer',
              textAlign: 'left', fontSize: 14,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a4e', fontSize: 12, color: '#666' }}>
        {accountCount} / 50 cuentas
      </div>
    </div>
  );
}
