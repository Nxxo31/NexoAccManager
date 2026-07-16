import * as React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { AccountGrid } from './components/accounts/AccountGrid';
import AddAccountModal from './components/accounts/AddAccountModal';
import ServerBrowser from './components/server-browser/ServerBrowser';
import SettingsPanel from './components/settings/SettingsPanel';
import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';
import { EditAliasModal } from './components/accounts/EditAliasModal';
import { EditDescriptionModal } from './components/accounts/EditDescriptionModal';
import { useAccountStore } from './store/useAccountStore';
import { useUIStore } from './store/useUIStore';
import { useAccountActions } from './hooks/useAccountActions';
import { ModalShell } from './components/modal/ModalShell';

type ModalView = 'servers' | 'settings' | null;

export default function App() {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [activeModal, setActiveModal] = React.useState<ModalView>(null);
  const [showAccountControl, setShowAccountControl] = React.useState(false);
  const [editingAlias, setEditingAlias] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);

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
    language
  } = useUIStore();
  const jobIdShuffle = useUIStore((state) => state.jobIdShuffle);

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

  // Sync theme and language to store
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
          {/* Main content area */}
          {activeView === 'accounts' && (
            <AccountGrid
              accounts={accounts}
              selectedAccount={selectedAccount}
              onSelectAccount={setSelectedAccount}
              onDeleteAccount={(acc) => handleDeleteAccount(acc.id)}
              onPlayAccount={(acc) => handleLaunchApp(acc.id)}
              onFollowAccount={(acc) => handleFollowUser(acc.robloxUserId)}
              onShowAccountControl={(acc) => { setSelectedAccount(acc); setShowAccountControl(true); }}
              onEditAlias={(acc) => { setSelectedAccount(acc); setEditingAlias(true); }}
              onEditDescription={(acc) => { setSelectedAccount(acc); setEditingDesc(true); }}
              onCopyPlaceId={(acc) => handleCopyPlaceId(acc.savedPlaceId || '')}
              hideUsernames={hideUsernames}
              jobIdShuffle={jobIdShuffle}
            />
          )}

          {activeView === 'servers' && (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Servers Browser</h2>
              <p className="text-muted-foreground">Servers view coming soon...</p>
            </div>
          )}

          {activeView === 'games' && (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Games Browser</h2>
              <p className="text-muted-foreground">Games view coming soon...</p>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              <p className="text-muted-foreground">Settings panel via modal...</p>
            </div>
          )}
        </AppLayout>

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