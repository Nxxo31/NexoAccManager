import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';
import { ChevronLeft, ChevronRight, Moon, Sun, Settings as SettingsIcon, Users, Server, Gamepad2 } from 'lucide-react';
import { useAccountActions } from '@renderer/hooks/useAccountActions';
import type { Account } from '@/types/Account';

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);
  const setSelectedAccount = useAccountStore((s) => s.setSelectedAccount);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const showAccounts = useUIStore((s) => s.showAccounts);
  const toggleShowAccounts = useUIStore((s) => s.toggleShowAccounts);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const { handleLoginBrowser } = useAccountActions();

  return (
    <motion.aside
      className="flex flex-col h-full bg-bg-surface border-r border-border flex-shrink-0"
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Brand (only when expanded) */}
      {!sidebarCollapsed && (
        <div className="px-4 pb-2 pt-1">
          <h1 className="text-sm font-bold text-foreground tracking-tight">
            N<span className="text-primary">exo</span><span className="text-foreground">Acc</span>
          </h1>
        </div>
      )}

      {/* Toggle to collapse sidebar */}
      <div className="flex h-12 items-center justify-center flex-shrink-0">
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

      {/* Navigation Menu (only when expanded) */}
      {!sidebarCollapsed && (
        <div className="flex flex-col gap-1 p-2">
          <nav className="flex flex-col gap-1">
            {/* Accounts */}
            <button
              onClick={() => setActiveView('accounts')}
              className={`flex items-center gap-2 p-2 rounded hover:bg-bg-elevated transition-colors ${activeView === 'accounts' ? 'bg-primary/20 text-primary' : ''}`}
              aria-label={t('sidebar.nav.accounts', 'Accounts')}
            >
              <Users className="h-4 w-4" />
              <span className="text-xs text-foreground">{t('sidebar.nav.accounts', 'Accounts')}</span>
            </button>
            {/* Servers */}
            <button
              onClick={() => setActiveView('servers')}
              className={`flex items-center gap-2 p-2 rounded hover:bg-bg-elevated transition-colors ${activeView === 'servers' ? 'bg-primary/20 text-primary' : ''}`}
              aria-label={t('sidebar.nav.servers', 'Servers')}
            >
              <Server className="h-4 w-4" />
              <span className="text-xs text-foreground">{t('sidebar.nav.servers', 'Servers')}</span>
            </button>
            {/* Games */}
            <button
              onClick={() => setActiveView('games')}
              className={`flex items-center gap-2 p-2 rounded hover:bg-bg-elevated transition-colors ${activeView === 'games' ? 'bg-primary/20 text-primary' : ''}`}
              aria-label={t('sidebar.nav.games', 'Games')}
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="text-xs text-foreground">{t('sidebar.nav.games', 'Games')}</span>
            </button>
            {/* Friends */}
            <button
              onClick={() => setActiveView('friends')}
              className={`flex items-center gap-2 p-2 rounded hover:bg-bg-elevated transition-colors ${activeView === 'friends' ? 'bg-primary/20 text-primary' : ''}`}
              aria-label={t('sidebar.nav.friends', 'Friends')}
            >
              <Users className="h-4 w-4" />
              <span className="text-xs text-foreground">{t('sidebar.nav.friends', 'Friends')}</span>
            </button>
            {/* Settings */}
            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center gap-2 p-2 rounded hover:bg-bg-elevated transition-colors ${activeView === 'settings' ? 'bg-primary/20 text-primary' : ''}`}
              aria-label={t('sidebar.nav.settings', 'Settings')}
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="text-xs text-foreground">{t('sidebar.nav.settings', 'Settings')}</span>
            </button>
          </nav>
        </div>
      )}

      {/* Search Bar and Login Button (only when expanded) */}
      {!sidebarCollapsed && (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('sidebar.search', 'Search accounts...')}
              className="flex-1 h-9 pl-3 pr-4 rounded-md border border-border bg-bg-surface/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              aria-label={t('sidebar.search', 'Search accounts')}
            />
            <button
              onClick={() => {
                // Call the login browser action without group (direct login)
                handleLoginBrowser();
              }}
              className="flex h-9 w-9 items-center justify-center bg-primary text-white hover:bg-primary-dark transition-colors rounded-md"
              aria-label={t('sidebar.login', 'Login')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            </button>
          </div>
        </div>
      )}

      {/* Account List (only when expanded and showAccounts is true) */}
      {!sidebarCollapsed && showAccounts && (
        <div className="flex-1 flex-col overflow-y-auto px-4 pt-2">
          {accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {t('sidebar.noAccounts', 'No accounts to show')}
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`flex items-center gap-3 p-2 rounded hover:bg-bg-elevated transition-colors cursor-pointer ${selectedAccount?.id === acc.id ? 'border-primary/50' : ''}`}
                  onClick={() => setSelectedAccount(acc)}
                >
                  {/* Status dot (placeholder: green for online, red for offline) */}
                  <div className="flex h-3 w-3 items-center justify-center">
                    <div className="h-2 w-2 rounded-full">
                      {/* TODO: Replace with actual presence status */}
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full" /> {/* Online */}
                    </div>
                  </div>

                  {/* Account info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {acc.displayName || acc.username || 'Unnamed'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {acc.group ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {acc.group}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground">
                          No group
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hide/Show Accounts Toggle (only when expanded) */}
      {!sidebarCollapsed && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showAccounts}
              onChange={(e) => {
                toggleShowAccounts();
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-foreground">{t('sidebar.showAccounts', 'Show accounts')}</span>
          </div>
        </div>
      )}

      {/* Footer (connection status and account count) */}
      <div className="flex h-12 items-center justify-center gap-2 px-3 border-t border-border text-xs text-muted-foreground flex-shrink-0">
        <span
          className="w-2 h-2 rounded-full bg-success"
          aria-label={t('sidebar.connected', 'Connected')}
        />
        {!sidebarCollapsed && showAccounts && (
          <>
            <span>
              {accounts.length}/50
            </span>
          </>
        )}
      </div>
    </motion.aside>
  );
};

Sidebar.displayName = 'Sidebar';
export default Sidebar;