// Application Layout: Sidebar — navigation + counter using i18n + CSS vars

import { useUIStore } from '../store/uiStore';
import { PAGES } from '../../config/constants';
import { t } from '../../config/i18n';

const NAV_ITEMS = [
  { key: PAGES.ACCOUNTS, icon: '👥', labelKey: 'nav.accounts' },
  { key: PAGES.SERVERS, icon: '🌐', labelKey: 'nav.servers' },
  { key: PAGES.GAMES, icon: '🎮', labelKey: 'nav.games' },
  { key: PAGES.FRIENDS, icon: '📧', labelKey: 'nav.friends' },
  { key: PAGES.SETTINGS, icon: '⚙️', labelKey: 'nav.settings' },
];

export function Sidebar({ accountCount }: { accountCount: number }): JSX.Element {
  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);

  return (
    <div style={{
      width: 200, background: 'var(--bg-card)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{
        padding: '20px 16px', fontWeight: 700, fontSize: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        NexoAccManager
      </div>
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 16px', background: activeView === item.key ? 'var(--bg-elevated)' : 'transparent',
              border: 'none', color: activeView === item.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', textAlign: 'left' as const, fontSize: 14,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        fontSize: 12, color: 'var(--text-tertiary)',
      }}>
        {t('accounts.count', { count: accountCount })}
      </div>
    </div>
  );
}
