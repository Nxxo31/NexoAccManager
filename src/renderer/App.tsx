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
import { FriendsHubView } from './components/views/FriendsHubView';
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

  const handleJoin = React.useCallback(async () => {
    if (!api || !joinPlaceId.trim()) return;
    try {
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
      }
    } catch (e) {
      console.error('Kill all error:', e);
    }
  }, [api]);

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

  const handleSelectAccount = React.useCallback((acc: Account) => {
    setSelectedAccount(acc);
    setDetailPanelOpen(true);
  }, [setSelectedAccount]);

  // Pasar killAll a SettingsView
  const handleKillAllCallback = React.useCallback(() => handleKillAll(), [handleKillAll]);

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
          {activeView === 'accounts' && (
            <div className="flex flex-col h-full">
              <JoinBar
                placeId={joinPlaceId}
                jobId={joinJobId}
                onPlaceIdChange={setJoinPlaceId}
                onJobIdChange={setJoinJobId}
                onJoin={handleJoin}
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
                  onToggleFavorite={(acc, isFav) => {
                    useAccountStore.getState().setAccountField(acc.id, "isFavorite", isFav);
                    const api = (window as any).api;
                    api?.account?.setField?.(acc.id, "isFavorite", String(isFav));
                  }}
                  onChangeGroup={(acc, newGroup) => {
                    useAccountStore.getState().setAccountField(acc.id, "group", newGroup);
                    const api = (window as any).api;
                    api?.account?.setField?.(acc.id, "group", newGroup);
                  }}

                  onReorder={(reordered: Account[]) => {
                    useAccountStore.getState().setAccounts(reordered);
                  }}
                  hideUsernames={hideUsernames}
                  jobIdShuffle={useUIStore.getState().jobIdShuffle}
                />
              </div>
            </div>
          )}

          {activeView === 'servers' && <ServerView />}
          {activeView === 'games' && <GamesView />}
          {activeView === 'friends' && <FriendsHubView />}
          {activeView === 'settings' && (
            <SettingsView onOpenModal={() => setActiveModal('settings')} onKillAll={handleKillAllCallback} />
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

        {showAddModal && (
          <ModalShell isOpen={showAddModal} onClose={() => setShowAddModal(false)} className="w-full max-w-md">
            <AddAccountModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onLoginBrowser={handleLoginBrowser}
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
