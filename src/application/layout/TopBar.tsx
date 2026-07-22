// Application Layout: TopBar — theme toggle + settings

import type { ThemeId } from '../../infrastructure/external/ThemeService';

export function TopBar({ theme, onToggleTheme }: { theme: ThemeId; onToggleTheme: () => void }): JSX.Element {
  return (
    <div style={{
      height: 48, background: 'var(--bg-surface)', display: 'flex',
      alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      <button
        onClick={onToggleTheme}
        style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 18,
        }}
        aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
