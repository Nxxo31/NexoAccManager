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
    <div className={cn('flex flex-col bg-[#0d0d1a] border-r border-[#2a2a4e] transition-all duration-150 flex-shrink-0', collapsed ? 'w-16' : 'w-52')}>
      {/* Logo */}
      <div className="flex items-center h-12 border-b border-[#2a2a4e] px-3">
        {!collapsed && <span className="text-sm font-bold text-[#eee] tracking-tight">NX-Manager</span>}
        <button onClick={() => setCollapsed(!collapsed)} className={cn('p-1 text-[#666] hover:text-[#eee] transition-colors', collapsed ? 'mx-auto' : 'ml-auto')}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV.map(({ key, icon: Icon, label }) => {
          const active = activeView === key;
          return (
            <button key={key} onClick={() => setView(key)} title={collapsed ? label : undefined}
              className={cn('flex items-center gap-3 w-full h-10 px-3 transition-colors duration-150 text-sm',
                active ? 'bg-[#1a1a2e] text-[#eee] border-l-2 border-[#3b82f6]' : 'text-[#aaa] hover:bg-[#1a1a2e]/50 hover:text-[#eee] border-l-2 border-transparent',
                collapsed && 'justify-center')}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>
      {/* Counter */}
      <div className="border-t border-[#2a2a4e] px-3 py-2">
        {!collapsed ? (
          <span className="text-xs text-[#666]">{accountCount} / {MAX_ACCOUNTS} cuentas</span>
        ) : (
          <span className="text-xs text-[#666] text-center block">{accountCount}</span>
        )}
      </div>
    </div>
  );
}
