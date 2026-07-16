import * as React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { AccountGrid } from './components/accounts/AccountGrid';
import { JoinBar } from './components/accounts/JoinBar';
import { AccountDetailPanel } from './components/accounts/AccountDetailPanel';
import AddAccountModal from './components/accounts/AddAccountModal';
import ServerBrowser from './components/server-browser/ServerBrowser';
import SettingsPanel from './components/settings/SettingsPanel';
import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';
import { EditAliasModal } from './components/accounts/EditAliasModal';
import { EditDescriptionModal } from './components/accounts/EditDescriptionModal';
import { ServerView } from './components/views/ServerView';
import { GamesView } from './components/views/GamesView';
import { SettingsView } from './components/views/SettingsView';
import { PresenceView } from './components/views/PresenceView';
import { useAccountStore } from './store/useAccountStore';
import { useUIStore } from './store/useUIStore';
import { useAccountActions } from './hooks/useAccountActions';
import { ModalShell } from './components/modal/ModalShell';
import type { Account } from '@/types/Account';

type ModalView = 'servers' | 'settings' | null;

export default function App() {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [activeModal, setActiveModal] = React.useState<ModalView>(null);
  const [showAccountControl, setShowAccountControl] = React.useState(false);
  const [editingAlias, setEditingAlias] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = React.useState(false);
  const [joinPlaceId, setJoinPlaceId] = React.useState('');
  const [joinJobId, setJoinJobId] = React.useState('');

  const accounts = useAccountStore((state) => state.accounts);
  const selectedAccount = useAccountStore((state) => state.selectedAccount);
  const setSelectedAccount = useAccountStore((state) => state.setSelectedAccount);
  const {
    activeView,
    hideUsernames,
    setHideUsernames,
    searchQuery,
    setSearchQuery,
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
    handleFollowUser,
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

  // Sync theme and language
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

  // Cookie expiry events
  React.useEffect(() => {
    if (!api?.cookieEvents?.onExpiring) return;
    const cleanupExpiring = api.cookieEvents.onExpiring((accountId: string, hoursLeft: number) => {
      console.warn(`Cookie expiring: ${accountId}, ${hoursLeft}h left`);
    });
    const cleanupExpired = api.cookieEvents.onExpired((accountId: string) => {
      console.warn(`Cookie expired: ${accountId}`);
      fetchAccounts();
    });
    return () => { cleanupExpiring?.(); cleanupExpired?.(); };
  }, [api, fetchAccounts]);

  // Filter accounts by search query
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

  // Handlers for JoinBar
  const handleJoin = React.useCallback(async () => {
    if (!api || !joinPlaceId.trim()) return;
    try {
      // Launch all accounts to the specified server
      for (const acc of accounts) {
        if (api.roblox?.joinServer) {
          await api.roblox.joinServer(acc.id, joinPlaceId.trim(), joinJobId.trim() || undefined);
        } else {
          await handleLaunchApp(acc.id);
        }
      }
    } catch (e) {
      console.error('Join error:', e);
    }
  }, [api, accounts, joinPlaceId, joinJobId, handleLaunchApp]);

  const handleKillAll = React.useCallback(async () => {
    if (!api) return;
    try {
      if (api.roblox?.killAll) {
        await api.roblox.killAll();
      } else if (api.advanced?.killAllRoblox) {
        await api.advanced.killAllRoblox();
      }
    } catch (e) {
      console.error('Kill all error:', e);
    }
  }, [api]);

  // Handlers for AccountDetailPanel
  const handlePanelLaunch = React.useCallback((acc: Account) => {
    handleLaunchApp(acc.id);
  }, [handleLaunchApp]);

  const handlePanelBrowser = React.useCallback((acc: Account) => {
    if (api?.roblox?.openProfile) {
      api.roblox.openProfile(acc.robloxUserId);
    }
  }, [api]);

  const handlePanelCopyPassword = React.useCallback((_acc: Account) => {
    // TODO: implement when savePasswords feature is ready (Fase 3.1)
    console.log('Copy password not yet implemented');
  }, []);

  const handlePanelCopyRbxPlayer = React.useCallback((acc: Account) => {
    if (api?.roblox?.copyRbxPlayerLink) {
      api.roblox.copyRbxPlayerLink(acc.id, joinPlaceId, joinJobId);
    }
  }, [api, joinPlaceId, joinJobId]);

  const handlePanelQuickLogin = React.useCallback((acc: Account) => {
    if (api?.roblox?.quickLogin) {
      api.roblox.quickLogin(acc.id);
    }
  }, [api]);

  const handleSelectAccount = React.useCallback((acc: Account) => {
    setSelectedAccount(acc);
    setDetailPanelOpen(true);
  }, [setSelectedAccount]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppLayout
          hideUsernames={hideUsernames}
          setHideUsernames={setHideUsernames}
          theme={themeSettings}
          setTheme={useUIStore.getState().setThemeSettings}
          onOpenSettings={() => setActiveModal('settings')}
          onAddAccount={() => setShowAddModal(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        >
          {/* Accounts view with JoinBar */}
          {activeView === 'accounts' && (
            <div className="flex flex-col h-full">
              <JoinBar
                placeId={joinPlaceId}
                jobId={joinJobId}
                onPlaceIdChange={setJoinPlaceId}
                onJobIdChange={setJoinJobId}
                onJoin={handleJoin}
                onKillAll={handleKillAll}
              />
              <div className="flex-1 overflow-y-auto">
                <AccountGrid
                  accounts={filteredAccounts}
                  selectedAccount={selectedAccount}
                  onSelectAccount={handleSelectAccount}
                  onDeleteAccount={(acc) => handleDeleteAccount(acc.id)}
                  onPlayAccount={(acc) => handleLaunchApp(acc.id)}
                  onFollowAccount={(acc) => handleFollowUser(acc.robloxUserId)}
                  onShowAccountControl={(acc) => { setSelectedAccount(acc); setShowAccountControl(true); }}
                  onEditAlias={(acc) => { setSelectedAccount(acc); setEditingAlias(true); }}
                  onEditDescription={(acc) => { setSelectedAccount(acc); setEditingDesc(true); }}
                  onCopyPlaceId={(acc) => handleCopyPlaceId(acc.savedPlaceId || '')}
                  hideUsernames={hideUsernames}
                  jobIdShuffle={useUIStore.getState().jobIdShuffle}
                />
              </div>
            </div>
          )}

          {/* Servers view */}
          {activeView === 'servers' && <ServerView />}

          {/* Games view */}
          {activeView === 'games' && <GamesView />}

          {/* Presence view */}
          {activeView === 'presence' && <PresenceView />}

          {/* Settings view */}
          {activeView === 'settings' && (
            <SettingsView onOpenModal={() => setActiveModal('settings')} />
          )}
        </AppLayout>

        {/* AccountDetailPanel slide-in */}
        <AccountDetailPanel
          account={selectedAccount}
          isOpen={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
          onLaunch={handlePanelLaunch}
          onOpenBrowser={handlePanelBrowser}
          onCopyPassword={handlePanelCopyPassword}
          onCopyRbxPlayer={handlePanelCopyRbxPlayer}
          onQuickLogin={handlePanelQuickLogin}
          onEditAlias={(acc) => { setDetailPanelOpen(false); setSelectedAccount(acc); setEditingAlias(true); }}
          onEditDescription={(acc) => { setDetailPanelOpen(false); setSelectedAccount(acc); setEditingDesc(true); }}
          onCopyPlaceId={handleCopyPlaceId}
        />

        {/* Modals */}
        {showAddModal && (
          <ModalShell isOpen={showAddModal} onClose={() => setShowAddModal(false)} className="w-full max-w-md">
            <AddAccountModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onLoginBrowser={handleLoginBrowser}
              onAddCookie={handleAddCookie}
              onBulkImport={handleBulkImport}
            />
          </ModalShell>
        )}

        {activeModal === 'servers' && (
          <ModalShell isOpen={activeModal === 'servers'} onClose={() => setActiveModal(null)} className="w-full max-w-2xl">
            <ServerBrowser />
          </ModalShell>
        )}

        {activeModal === 'settings' && (
          <ModalShell isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} className="w-full max-w-lg">
            <SettingsPanel
              theme={themeSettings?.theme ?? 'dark'}
              primaryColor={themeSettings?.primaryColor ?? '#DE350D'}
              accentColor={themeSettings?.accentColor ?? '#6347FF'}
              fontSize={themeSettings?.fontSize ?? 'medium'}
              uiDensity={themeSettings?.uiDensity ?? 'normal'}
              animationsEnabled={themeSettings?.animationsEnabled ?? true}
              language={language}
              onThemeChange={handleThemeChange}
              onLanguageChange={handleLanguageChange}
              onExportData={handleExportData}
              onDeleteAllAccounts={handleDeleteAll}
              onClearCache={handleClearCache}
            />
          </ModalShell>
        )}

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
              setDescDraft={(v) => {}}
              descSaving={false}
              handleSaveDesc={handleSaveDescInline}
            />
          </div>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
