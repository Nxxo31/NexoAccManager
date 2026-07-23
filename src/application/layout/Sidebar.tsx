// Application Layout: Sidebar — Tailwind + lucide-react + collapsible

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, Gamepad2, Mail, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { PAGES, type PageKey, MAX_ACCOUNTS } from '../../config/constants';
import { cn } from '../../lib/utils';

const NAV: { key: PageKey; icon: typeof Users; label: string }[] = [
  { key: PAGES.ACCOUNTS, icon: Users, label: 'Cuentas' },
  { key: PAGES.SERVERS, icon: Globe, label: 'Servidores' },
  { key: PAGES.GAMES, icon: Gamepad2, label: 'Juegos' },
  { key: PAGES.FRIENDS, icon: Mail, label: 'Amigos' },
  { key: PAGES.SETTINGS, icon: Settings, label: 'Ajustes' },
];

export function Sidebar({ accountCount }: { accountCount: number }): JSX.Element {
  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn('flex flex-col border-r transition-all duration-150 flex-shrink-0', collapsed ? 'w-16' : 'w-52')}
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center h-12 border-b px-3" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>NX-Manager</span>}
        <button onClick={() => setCollapsed(!collapsed)} className={cn('p-1 transition-colors', collapsed ? 'mx-auto' : 'ml-auto')}
          style={{ color: 'var(--text-tertiary)' }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV.map(({ key, icon: Icon, label }) => {
          const active = activeView === key;
          return (
            <button key={key} onClick={() => setView(key)} title={collapsed ? label : undefined}
              className={cn('flex items-center gap-3 w-full h-10 px-3 transition-colors duration-150 text-sm border-l-2',
                collapsed && 'justify-center')}
              style={{
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderColor: active ? 'var(--primary)' : 'transparent',
              }}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>
      {/* Counter */}
      <div className="border-t px-3 py-2" style={{ borderColor: 'var(--border)' }}>
        {!collapsed ? (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{accountCount} / {MAX_ACCOUNTS} cuentas</span>
        ) : (
          <span className="text-xs text-center block" style={{ color: 'var(--text-tertiary)' }}>{accountCount}</span>
        )}
      </div>
    </div>
  );
}
