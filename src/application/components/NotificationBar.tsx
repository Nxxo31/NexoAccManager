// Application Component: NotificationBar — toast system

import { useUIStore } from '../store/uiStore';

const COLORS: Record<string, { bg: string; border: string }> = {
  info: { bg: '#1e3a5f', border: '#3b82f6' },
  success: { bg: '#1e3f2e', border: '#22c55e' },
  warning: { bg: '#3f3a1e', border: '#eab308' },
  error: { bg: '#3f1e1e', border: '#ef4444' },
};

export function NotificationBar(): JSX.Element | null {
  const notifications = useUIStore((s) => s.notifications);
  const dismiss = useUIStore((s) => s.dismiss);

  if (notifications.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 56, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifications.map((n) => {
        const c = COLORS[n.type] ?? COLORS.info;
        return (
          <div key={n.id} onClick={() => dismiss(n.id)} style={{
            background: c.bg, borderLeft: `4px solid ${c.border}`, padding: '12px 16px',
            borderRadius: 4, color: '#eee', fontSize: 14, cursor: 'pointer', maxWidth: 320,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {n.message}
          </div>
        );
      })}
    </div>
  );
}
