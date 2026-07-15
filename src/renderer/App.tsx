import * as React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import AccountTable from './components/accounts/AccountTable';
import AddAccountModal from './components/accounts/AddAccountModal';
import ServerBrowser from './components/server-browser/ServerBrowser';
import SettingsPanel from './components/settings/SettingsPanel';
import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';
import { useAccountStore } from './store/useAccountStore';
import { useUIStore } from './store/useUIStore';
import { Account } from '@/types/Account';
import { 
  Plus, Trash2, EyeOff, AppWindow, Shuffle, Server,
  Settings as SettingsIcon, Gamepad2, X, Copy, Check, Loader2,
  Save, UserPlus, Play
} from 'lucide-react';
import { Header } from './components/layout/Header';
import { Dock } from './components/layout/Dock';
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

  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  const fetchAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!api) { setLoading(false); return; }
      const result = await api.account.list();
      if (result && result.success === false) {
        setError(result.error || 'Error loading accounts');
        return;
      }
      const data = result?.data || result || [];
      setStoreAccounts(data);
    } catch (err) {
      setError('Error loading accounts');
    } finally {
      setLoading(false);
    }
  }, [api, setStoreAccounts]);

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

  // === Handlers ===
  const handleLoginBrowser = async (group?: string) => {
    try {
      const result = await api.account.loginBrowser(group);
      if (result?.success === false) throw new Error(result.error || 'Error desconocido');
      await fetchAccounts();
      setShowAddModal(false);
    } catch (e) {
      setError((e as Error).message || 'Error al iniciar sesión');
    }
  };

  const handleAddCookie = async (cookie: string, group?: string) => {
    const result = await api.account.add(cookie, group);
    if (result?.success === false) throw new Error(result.error || 'Error al agregar cookie');
    await fetchAccounts();
  };

  const handleBulkImport = async (input: string, format: 'user:pass' | 'cookies') => {
    const result = await api.account.bulkImport(input, format);
    if (result?.success === false) throw new Error(result.error || 'Error en importación masiva');
    await fetchAccounts();
    return result.data;
  };

  const handleDeleteAccount = React.useCallback(async (id: string) => {
    const result = await api.account.remove(id);
    if (result?.success === false) throw new Error(result.error || 'Error al eliminar');
    await fetchAccounts();
  }, [api, fetchAccounts]);

  const handleSaveAlias = React.useCallback(async (accountId: string, alias: string) => {
    const result = await api.account.updateProfile(accountId, { displayName: alias });
    if (result?.success === false) throw new Error(result.error || 'Error al guardar alias');
    await fetchAccounts();
  }, [api, fetchAccounts]);

  const handleSaveDescription = React.useCallback(async (accountId: string, description: string) => {
    const result = await api.account.setField(accountId, 'description', description);
    if (result?.success === false) throw new Error(result.error || 'Error al guardar descripción');
    await fetchAccounts();
  }, [api, fetchAccounts]);

  const handleFollowUser = React.useCallback(async (userId: number) => {
    if (selectedAccount) {
      await api.account.followUser(selectedAccount.id, userId);
    }
  }, [api, selectedAccount]);

  const handleLaunchGame = React.useCallback(async (accountId: string, pId: string, jId: string) => {
    await api.roblox.launch(accountId, pId, jId || undefined);
  }, [api]);

  const handleJoinServer = async () => {
    if (!selectedAccount || !placeId) return;
    setLaunching(true);
    try {
      let finalJobId = jobId;
      if (jobIdShuffle && !jobId) {
        // Shuffle: get servers and pick random
        const result = await api.roblox.getServers(placeId, selectedAccount.id);
        const servers = Array.isArray(result) ? result : (result?.data || []);
        if (servers.length > 0) {
          finalJobId = servers[Math.floor(Math.random() * servers.length)].jobId;
        }
      }
      await handleLaunchGame(selectedAccount.id, placeId, finalJobId);
    } catch (e) {
      setError((e as Error).message || 'Error al unirse al servidor');
    } finally {
      setLaunching(false);
    }
  };

  const handleLaunchApp = React.useCallback(() => {
    if (!selectedAccount || !api) return;
    api.roblox.launch(selectedAccount.id).then((result: any) => {
      if (result?.success === false) setError(result.error || 'Error al abrir Roblox');
    });
  }, [api, selectedAccount]);

  const handleCopyPlaceId = () => {
    if (placeId) {
      navigator.clipboard.writeText(placeId);
      setCopiedPlaceId(true);
      setTimeout(() => setCopiedPlaceId(false), 2000);
    }
  };

  const handleSaveAliasInline = async () => {
    if (!selectedAccount) return;
    setAliasSaving(true);
    try {
      await handleSaveAlias(selectedAccount.id, aliasDraft);
      setEditingAlias(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAliasSaving(false);
    }
  };

  const handleSaveDescInline = async () => {
    if (!selectedAccount) return;
    setDescSaving(true);
    try {
      await handleSaveDescription(selectedAccount.id, descDraft);
      setEditingDesc(false);
    } catch (e) {
      console.error(e);
    } finally {
      setDescSaving(false);
    }
  };

  const handleThemeChange = async (partial: any) => {
    const result = await api.theme.set(partial);
    if (result?.success && result.data) setTheme(result.data.settings);
    else if (result?.settings) setTheme(result.settings);
  };

  const handleLanguageChange = async (lang: string) => {
    const result = await api.language.set(lang);
    if (result?.success) setLanguage(lang);
  };

  const handleExportData = async () => {
    const result = await api.advanced.exportData();
    if (result?.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexoacc-export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteAll = async () => {
    const result = await api.advanced.deleteAllAccounts();
    if (result?.success) await fetchAccounts();
  };

  const handleClearCache = async () => { await api.advanced.clearCache(); };

  // === Button component ===
  const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    variant?: 'primary' | 'default' | 'ghost';
  }> = ({ icon, label, onClick, disabled, active, variant = 'ghost' }) => {
    let btnClass = '';
    if (variant === 'primary') {
      btnClass = 'bg-primary text-white hover:bg-primary-dark';
    } else if (variant === 'default') {
      btnClass = 'bg-bg-surface text-foreground hover:bg-bg-elevated border border-border';
    } else {
      btnClass = active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-bg-surface';
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${btnClass} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <>
          <div className="flex h-screen bg-background">
            {/* Main content — no sidebar in v2.4.0+ */}
            <div className="flex-1 flex-col overflow-hidden">
              {/* Header */}
              <Header 
                accountsLength={accounts.length}
                hideUsernames={hideUsernames}
                setHideUsernames={setHideUsernames}
                theme={theme}
                setTheme={setTheme}
                setActiveModal={setActiveModal}
              />
              
              {/* Account Table */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full text-sm text-destructive">
                    {error}
                  </div>
                ) : (
                  <AccountTable
                    accounts={accounts}
                    selectedAccount={selectedAccount}
                    onSelectAccount={setSelectedAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onPlayAccount={(acc) => setSelectedAccount(acc)}
                    onFollowAccount={handleFollowUser}
                    hideUsernames={hideUsernames}
                  />
                )}
              </div>
              
              {/* Dock */}
              <Dock
                placeId={placeId}
                setPlaceId={setPlaceId}
                jobId={jobId}
                setJobId={setJobId}
                jobIdShuffle={jobIdShuffle}
                toggleJobIdShuffle={toggleJobIdShuffle}
                launching={launching}
                selectedAccount={selectedAccount}
                handleJoinServer={handleJoinServer}
                handleLaunchApp={handleLaunchApp}
                setActiveModal={setActiveModal}
                onAddAccount={() => setShowAddModal(true)}
                hideUsernames={hideUsernames}
                setHideUsernames={setHideUsernames}
                accounts={accounts}
                setSelectedAccount={setSelectedAccount}
                onPlayAccount={handleJoinServer} // Note: In the dock, the play button is for joining server or launching app
                onEditAlias={(acc: Account) => {
                  setSelectedAccount(acc);
                  setAliasDraft(acc.displayName || acc.username || '');
                  setEditingAlias(true);
                }}
                onEditDescription={(acc: Account) => {
                  setSelectedAccount(acc);
                  setDescDraft(acc.description || '');
                  setEditingDesc(true);
                }}
                onCopyPlaceId={handleCopyPlaceId}
                onCopyRbxlLink={(acc: Account) => {
                  // Placeholder for copying rbx-player link
                  console.log('Copy rbx-player link for:', acc);
                }}
                onToggleAutoRelaunch={(acc: Account) => {
                  // Placeholder for auto relaunch toggle
                  console.log('Toggle auto relaunch for:', acc);
                }}
                onToggleConnectionWatcher={(acc: Account) => {
                  // Placeholder for connection watcher toggle
                  console.log('Toggle connection watcher for:', acc);
                }}
              />
            </div>
          </div>

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
              <div className="w-full max-w-sm rounded-lg border border-border bg-bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar alias" tabIndex={-1}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" id="edit-alias-title">Editar Alias</h3>
                  <button onClick={() => setEditingAlias(false)} className="text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Cerrar">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <input
                  type="text"
                  value={aliasDraft}
                  onChange={(e) => setAliasDraft(e.target.value)}
                  className="nexo-input mb-3"
                  autoFocus
                  aria-labelledby="edit-alias-title"
                />
                <button
                  onClick={handleSaveAliasInline}
                  disabled={aliasSaving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={aliasSaving ? "Guardando alias" : "Guardar alias"}
                >
                  {aliasSaving ? (
                    <>
                      <X className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Guardando...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" aria-hidden="true" />Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          {editingDesc && selectedAccount && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingDesc(false)}>
              <div className="w-full max-w-sm rounded-lg border border-border bg-bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar descripción" tabIndex={-1}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" id="edit-desc-title">Editar Descripción</h3>
                  <button onClick={() => setEditingDesc(false)} className="text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Cerrar">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  className="nexo-input mb-3 min-h-[80px]"
                  rows={3}
                  autoFocus
                  aria-labelledby="edit-desc-title"
                />
                <button
                  onClick={handleSaveDescInline}
                  disabled={descSaving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={descSaving ? "Guardando descripción" : "Guardar descripción"}
                >
                  {descSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Guardando...
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4" aria-hidden="true" />Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      </ThemeProvider>
    </ErrorBoundary>
  );
}