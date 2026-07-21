import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';
import { ChevronLeft, ChevronRight, Users, Server, Gamepad2, Settings as SettingsIcon, UserCircle } from 'lucide-react';
import type { Account } from '@/types/Account';

/**
 * Sidebar — Solo navegación.
 * El hub principal (buscador, login, join-game) está en AccountsView.
 * La Sidebar muestra exclusivamente:
 *   - Brand + toggle de colapso
 *   - Menú de navegación entre vistas (Accounts, Servers, Games, Friends, Settings)
 *   - Lista rápida de cuentas (clic selecciona, pero el resto de acciones viven en AccountsView)
 *   - Footer con estado de conexión y contador 0/50
 */
const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);
  const setSelectedAccount = useAccountStore((s) => s.setSelectedAccount);
  const showAccounts = useUIStore((s) => s.showAccounts);
  const setShowAccounts = useUIStore((s) => s.setShowAccounts);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);

  const navItems: { key: typeof activeView; icon: React.ReactNode; label: string }[] = [
    { key: 'accounts', icon: <Users className="h-4 w-4" />, label: t('sidebar.nav.accounts', 'Accounts') },
    { key: 'servers', icon: <Server className="h-4 w-4" />, label: t('sidebar.nav.servers', 'Servers') },
    { key: 'games', icon: <Gamepad2 className="h-4 w-4" />, label: t('sidebar.nav.games', 'Games') },
    { key: 'friends', icon: <UserCircle className="h-4 w-4" />, label: t('sidebar.nav.friends', 'Friends') },
    { key: 'settings', icon: <SettingsIcon className="h-4 w-4" />, label: t('sidebar.nav.settings', 'Settings') },
  ];

  return (
    <motion.aside
      className="flex flex-col h-full bg-bg-surface border-r border-border flex-shrink-0"
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Brand */}
      {!sidebarCollapsed && (
        <div className="px-4 pb-2 pt-3">
          <h1 className="text-sm font-bold text-foreground tracking-tight">
            N<span className="text-primary">exo</span><span className="text-foreground">Acc</span>
          </h1>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="flex h-10 items-center justify-center flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-bg-elevated transition-colors text-muted-foreground hover:text-foreground"
          aria-label={t('sidebar.toggle', 'Collapse')}
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

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={`flex items-center gap-2 p-2 rounded transition-colors text-left ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-bg-elevated text-foreground'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              aria-label={item.label}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {Icon}
              {!sidebarCollapsed && <span className="text-xs">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      {!sidebarCollapsed && <div className="mx-4 my-2 border-t border-border" />}

      {/* Account list (quick reference, solo cuando está expandido y showAccounts) */}
      {!sidebarCollapsed && showAccounts && (
        <div className="flex-1 flex-col overflow-y-auto px-3 pt-1">
          {accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-xs">
              {t('sidebar.noAccounts', 'No accounts to show')}
            </p>
          ) : (
            <div className="space-y-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  className={`w-full flex items-center gap-2 p-1.5 rounded hover:bg-bg-elevated transition-colors text-left ${
                    selectedAccount?.id === acc.id ? 'bg-bg-elevated' : ''
                  }`}
                  onClick={() => setSelectedAccount(acc)}
                  title={acc.displayName || acc.username || acc.id}
                >
                  <div className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">
                    {acc.displayName || acc.username || 'Unnamed'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show accounts toggle */}
      {!sidebarCollapsed && (
        <div className="px-4 pt-2 pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAccounts}
              onChange={() => setShowAccounts(!showAccounts)}
              className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-foreground">{t('sidebar.showAccounts', 'Show accounts')}</span>
          </label>
        </div>
      )}

      {/* Footer */}
      <div className="flex h-10 items-center justify-center gap-2 px-3 border-t border-border text-xs text-muted-foreground flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-success" aria-label={t('sidebar.connected', 'Connected')} />
        {!sidebarCollapsed && showAccounts && <span>{accounts.length}/50</span>}
      </div>
    </motion.aside>
  );
};

Sidebar.displayName = 'Sidebar';
export default Sidebar;