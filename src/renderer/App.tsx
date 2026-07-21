import * as React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { AccountGrid } from './components/accounts/AccountGrid';
import { AccountsView } from './components/views/AccountsView';
import { AccountDetailPanel } from './components/accounts/AccountDetailPanel';

import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';
import { EditAliasModal } from './components/accounts/EditAliasModal';
import { EditDescriptionModal } from './components/accounts/EditDescriptionModal';
import { SettingsView } from './components/views/SettingsView';
import { FriendsHubView } from './components/views/FriendsHubView';
import { GamesView } from './components/views/GamesView';
import { ServerView } from './components/views/ServerView';
import { ModalShell } from './components/modal/ModalShell';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore, type ViewKey } from '@renderer/store/useUIStore';
import { useAccountActions } from './hooks/useAccountActions';
import type { Account } from '@/types/Account';

export default function App() {
  const [activeModal, setActiveModal] = React.useState<ViewKey | null>(null);
  void activeModal; void setActiveModal; // estado reservado para futuros modales
  const [showAccountControl, setShowAccountControl] = React.useState(false);
  const [editingAlias, setEditingAlias] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = React.useState(false);

  const accounts = useAccountStore((state) => state.accounts);
  const selectedAccount = useAccountStore((state) => state.selectedAccount);
  const setSelectedAccount = useAccountStore((state) => state.setSelectedAccount);
  const {
    activeView,
    themeSettings,
    language,
  } = useUIStore();
  const {
    fetchAccounts,
    handleLoginBrowser,
    handleAddCookie,
    handleBulkImport,
    handleDeleteAccount,
    handleSaveAliasInline,
    handleSaveDescInline,
    followUser,
    handleLaunchApp,
    handleCopyPlaceId,
    handleThemeChange,
    handleLanguageChange,
    handleExportData,
    handleDeleteAll,
    handleClearCache,
  } = useAccountActions();

  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  React.useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  React.useEffect(() => {
    if (!api) return;
    (async () => {
      try {
        const themeResult = await api.theme.get();
        if (themeResult?.success && themeResult.data) {
          useUIStore.getState().setThemeSettings(themeResult.data.settings);
        } else if (themeResult?.settings) {
          useUIStore.getState().setThemeSettings(themeResult.settings);
        }
      } catch (e) { console.error('Theme load error:', e); }
    })();
    (async () => {
      try {
        const langResult = await api.language.get();
        if (langResult?.success && langResult.data) {
          useUIStore.getState().setLanguage(langResult.data);
        } else if (langResult?.data) {
          useUIStore.getState().setLanguage(langResult.data);
        }
      } catch (e) { console.error('Language load error:', e); }
    })();
  }, [api]);

  React.useEffect(() => {
    if (!api?.cookieEvents?.onExpiring) return;
    const cleanupExpiring = api.cookieEvents.onExpiring((accountId: string, _hoursLeft: number) => {
      console.warn(`Cookie expiring: ${accountId}`);
    });
    const cleanupExpired = api.cookieEvents.onExpired((accountId: string) => {
      console.warn(`Cookie expired: ${accountId}`);
      fetchAccounts();
    });
    return () => { cleanupExpiring?.(); cleanupExpired?.(); };
  }, [api, fetchAccounts]);

  // Get searchQuery from useUIStore (the canonical location for Sidebar + App filtering)
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);

  const hideUsernames = useUIStore((s) => s.hideUsernames);

  const filteredAccounts = React.useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter((acc: Account) =>
      acc.username?.toLowerCase().includes(q) ||
      acc.displayName?.toLowerCase().includes(q) ||
      acc.description?.toLowerCase().includes(q) ||
      acc.group?.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const handleSelectAccount = React.useCallback((acc: Account) => {
    setSelectedAccount(acc);
    setDetailPanelOpen(true);
  }, [setSelectedAccount]);

  const handlePanelLaunch = React.useCallback((acc: Account) => {
    handleLaunchApp(acc.id);
  }, [handleLaunchApp]);

  const handlePanelBrowser = React.useCallback((acc: Account) => {
    if (api?.roblox?.openProfile) {
      api.roblox.openProfile(acc.robloxUserId);
    }
  }, [api]);

  const handlePanelCopyPassword = React.useCallback(async (acc: Account) => {
    if (!api) return;
    try {
      const result = await api.account.getPassword(acc.id);
      if (result && result.success && result.data) {
        await navigator.clipboard.writeText(result.data);
      }
    } catch (e) {
      console.error('Copy password error:', e);
    }
  }, [api]);

  // Pasar killAll a SettingsView
  const handleKillAllCallback = React.useCallback(() => {
    if (!api) return;
    try {
      if (api.roblox?.killAll) {
        api.roblox.killAll();
      }
    } catch (e) {
      console.error('Kill all error:', e);
    }
  }, [api]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppLayout
          theme={themeSettings}
          setTheme={useUIStore.getState().setThemeSettings}
          onOpenSettings={() => useUIStore.getState().setActiveView('settings')}
          activeView={activeView}
        >
          {activeView === 'accounts' && (
            <AccountsView
              onShowAccountControl={(acc) => { setSelectedAccount(acc); setShowAccountControl(true); }}
              onEditAlias={(acc) => { setSelectedAccount(acc); setEditingAlias(true); }}
              onEditDescription={(acc) => { setSelectedAccount(acc); setEditingDesc(true); }}
            />
          )}
          {activeView === 'servers' && <ServerView />}
          {activeView === 'games' && <GamesView />}
          {activeView === 'friends' && <FriendsHubView />}
          {activeView === 'settings' && (
            <SettingsView onKillAll={handleKillAllCallback} />
          )}
        </AppLayout>

        <AccountDetailPanel
          account={selectedAccount}
          isOpen={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
          onLaunch={handlePanelLaunch}
          onOpenBrowser={handlePanelBrowser}
          onCopyPassword={handlePanelCopyPassword}
          onCopyRbxPlayer={() => {}}
          onQuickLogin={() => {}}
          onEditAlias={(acc) => { setDetailPanelOpen(false); setSelectedAccount(acc); setEditingAlias(true); }}
          onEditDescription={(acc) => { setDetailPanelOpen(false); setSelectedAccount(acc); setEditingDesc(true); }}
          onCopyPlaceId={handleCopyPlaceId}
        />

        {showAccountControl && selectedAccount && (
          <ModalShell isOpen={showAccountControl} onClose={() => setShowAccountControl(false)} className="w-full max-w-md">
            <AccountControlPanel
              account={selectedAccount}
              onClose={() => setShowAccountControl(false)}
            />
          </ModalShell>
        )}

        {editingAlias && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingAlias(false)}>
            <EditAliasModal
              isOpen={editingAlias}
              onClose={() => setEditingAlias(false)}
              account={selectedAccount}
              aliasDraft={selectedAccount.displayName || selectedAccount.username || ''}
              setAliasDraft={() => {}}
              aliasSaving={false}
              handleSaveAlias={handleSaveAliasInline}
            />
          </div>
        )}

        {editingDesc && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingDesc(false)}>
            <EditDescriptionModal
              isOpen={editingDesc}
              onClose={() => setEditingDesc(false)}
              account={selectedAccount}
              descDraft={selectedAccount.description || ''}
              setDescDraft={() => {}}
              descSaving={false}
              handleSaveDesc={handleSaveDescInline}
            />
          </div>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}