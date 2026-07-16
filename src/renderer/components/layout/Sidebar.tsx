import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore, type ViewKey } from '@renderer/store/useUIStore';
import {
  Users, Server, Gamepad2, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, Wifi,
} from 'lucide-react';

const navItems: { key: ViewKey; icon: React.ElementType; labelKey: string }[] = [
  { key: 'accounts', icon: Users, labelKey: 'sidebar.accounts' },
  { key: 'servers', icon: Server, labelKey: 'sidebar.servers' },
  { key: 'games', icon: Gamepad2, labelKey: 'sidebar.games' },
  { key: 'presence', icon: Wifi, labelKey: 'sidebar.presence' },
  { key: 'settings', icon: SettingsIcon, labelKey: 'sidebar.settings' },
];

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const accounts = useAccountStore((s) => s.accounts);
  const MAX_ACCOUNTS = 50;

  return (
    <motion.aside
      className="flex flex-col h-full bg-bg-surface border-r border-border flex-shrink-0"
      animate={{ width: sidebarCollapsed ? 64 : 224 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Toggle */}
      <div className="flex h-12 items-center justify-center flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-bg-elevated transition-colors text-muted-foreground hover:text-foreground"
          aria-label={t('sidebar.toggle', 'Colapsar')}
        >
          <AnimatePresence mode="wait">
            {sidebarCollapsed ? (
              <motion.span key="right" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChevronRight className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span key="left" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChevronLeft className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Brand */}
      {!sidebarCollapsed && (
        <div className="px-4 pb-2 pt-1">
          <h1 className="text-sm font-bold text-foreground tracking-tight">
            NexoAccManager <span className="text-primary">v3.0</span>
          </h1>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 pt-4 overflow-y-auto">
        {navItems.map(({ key, icon: Icon, labelKey }) => {
          const isActive = activeView === key;
          return (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors border-l-2 ${
                isActive
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-bg-elevated'
              }`}
              aria-label={t(labelKey, key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{t(labelKey, key)}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex h-12 items-center justify-center gap-2 px-3 border-t border-border text-xs text-muted-foreground flex-shrink-0">
        <span
          className="w-2 h-2 rounded-full bg-success"
          aria-label={t('sidebar.connected', 'Conectado')}
        />
        {!sidebarCollapsed && (
          <>
            <span>{accounts.length}/{MAX_ACCOUNTS}</span>
          </>
        )}
      </div>
    </motion.aside>
  );
};

Sidebar.displayName = 'Sidebar';
export default Sidebar;
