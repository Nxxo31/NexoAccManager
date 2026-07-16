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
import { Account } from '@/types/Account';
import { 
  Plus, Trash2, EyeOff, AppWindow, Shuffle, Server,
  Settings as SettingsIcon, Gamepad2, X, Copy, Check, Loader2,
  Save, UserPlus, Play
} from 'lucide-react';
import { ModalShell } from './components/modal/ModalShell';

type ModalView = 'servers' | 'settings' | null;

export default function App() {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [activeModal, setActiveModal] = React.useState<ModalView>(null);
  const [hideUsernames, setHideUsernames] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<any>(null);
  const [language, setLanguage] = React.useState('es');
  const [showAccountControl, setShowAccountControl] = React.useState(false);
  const [placeId, setPlaceId] = React.useState('');
  const [jobId, setJobId] = React.useState('');
  const [launching, setLaunching] = React.useState(false);
  const [copiedPlaceId, setCopiedPlaceId] = React.useState(false);
  const [editingAlias, setEditingAlias] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const [aliasDraft, setAliasDraft] = React.useState('');
  const [descDraft, setDescDraft] = React.useState('');
  const [aliasSaving, setAliasSaving] = React.useState(false);
  const [descSaving, setDescSaving] = React.useState(false);

  const accounts = useAccountStore((state) => state.accounts);
  const setStoreAccounts = useAccountStore((state) => state.setAccounts);
  const selectedAccount = useAccountStore((state) => state.selectedAccount);
  const setSelectedAccount = useAccountStore((state) => state.setSelectedAccount);
  const jobIdShuffle = useUIStore((state) => state.jobIdShuffle);
  const toggleJobIdShuffle = useUIStore((state) => state.toggleJobIdShuffle);
  const activeView = useUIStore((state) => state.activeView);
  
  // Get actions from our custom hook
  const {
    fetchAccounts,
    handleLoginBrowser,
    handleAddCookie,
    handleBulkImport,
    handleDeleteAccount,
    handleSaveAlias,
    handleSaveDescription,
    handleFollowUser,
    handleLaunchGame,
    handleJoinServer,
    handleLaunchApp,
    handleCopyPlaceId,
    handleSaveAliasInline,
    handleSaveDescInline,
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
        const result = await api.theme.get();
        if (result?.success && result.data) setTheme(result.data.settings);
        else if (result?.settings) setTheme(result.settings);
      } catch (e) { console.error('Theme load error:', e); }
    })();
    
    (async () => {
      try {
        const result = await api.language.get();
        if (result?.success && result.data) setLanguage(result.data);
        else if (result?.data) setLanguage(result.data);
      } catch (e) { console.error('Language load error:', e); }
    })();
  }, [api]);

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

  // Sync place/job fields when selecting an account
  React.useEffect(() => {
    if (selectedAccount) {
      setPlaceId(selectedAccount.savedPlaceId || '');
      setJobId(selectedAccount.savedJobId || '');
    } else {
      setPlaceId('');
      setJobId('');
    }
    setEditingAlias(false);
    setEditingDesc(false);
  }, [selectedAccount?.id]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppLayout
          hideUsernames={hideUsernames}
          setHideUsernames={setHideUsernames}
          theme={theme}
          setTheme={setTheme}
          onOpenSettings={() => setActiveModal('settings')}
          searchQuery="" // Placeholder - would connect to search store
          setSearchQuery={(q) => {}} // Placeholder
        >
          {/* Main content area - changes based on activeView */}
          {activeView === 'accounts' && (
            <div className="p-4">
              <AccountGrid
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccount}
                onDeleteAccount={handleDeleteAccount}
                onPlayAccount={(acc) => {
                  // Default play action - could be launch or join server based on context
                  setSelectedAccount(acc);
                }}
                onFollowAccount={handleFollowUser}
                onShowAccountControl={(acc) => { 
                  setSelectedAccount(acc); 
                  setShowAccountControl(true); 
                }}
                onEditAlias={(acc) => { 
                  setSelectedAccount(acc); 
                  setAliasDraft(acc.displayName || acc.username || ''); 
                  setEditingAlias(true); 
                }}
                onEditDescription={(acc) => { 
                  setSelectedAccount(acc); 
                  setDescDraft(acc.description || ''); 
                  setEditingDesc(true); 
                }}
                onCopyPlaceId={handleCopyPlaceId}
                hideUsernames={hideUsernames}
                launching={launching}
                jobIdShuffle={jobIdShuffle}
              />
            </div>
          )}
          
          {/* Placeholder views for other sections */}
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
        
        {/* Modals and Overlays */}
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
              theme={theme?.theme}
              primaryColor={theme?.primaryColor}
              accentColor={theme?.accentColor}
              fontSize={theme?.fontSize}
              uiDensity={theme?.uiDensity}
              animationsEnabled={theme?.animationsEnabled}
              language={language}
              onThemeChange={handleThemeChange}
              onLanguageChange={handleLanguageChange}
              onExportData={handleExportData}
              onDeleteAllAccounts={handleDeleteAll}
              onClearCache={handleClearCache}
            />
          </ModalShell>
        )}
        {showAccountControl && (
          <ModalShell isOpen={showAccountControl} onClose={() => setShowAccountControl(false)} className="w-full max-w-md">
            <AccountControlPanel 
              account={selectedAccount!} 
              onClose={() => setShowAccountControl(false)} 
            />
          </ModalShell>
        )}
        {editingAlias && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingAlias(false)}>
            <EditAliasModal 
              isOpen={editingAlias} 
              onClose={() => setEditingAlias(false)} 
              account={selectedAccount!}
              aliasDraft={aliasDraft}
              setAliasDraft={setAliasDraft}
              aliasSaving={aliasSaving}
              handleSaveAlias={handleSaveAliasInline}
            />
          </div>
        )}
        {editingDesc && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingDesc(false)}>
            <EditDescriptionModal 
              isOpen={editingDesc} 
              onClose={() => setEditingDesc(false)} 
              account={selectedAccount!}
              descDraft={descDraft}
              setDescDraft={setDescDraft}
              descSaving={descSaving}
              handleSaveDesc={handleSaveDescInline}
            />
          </div>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}