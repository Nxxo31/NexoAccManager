import * as React from 'react';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import AccountTable from './components/accounts/AccountTable';
import AccountDetailsPanel from './components/accounts/AccountDetailsPanel';
import ActionBar from './components/accounts/ActionBar';
import AddAccountModal from './components/accounts/AddAccountModal';
import ServerBrowser from './components/server-browser/ServerBrowser';
import PresenceDashboard from './components/presence/PresenceDashboard';
import SettingsPanel from './components/settings/SettingsPanel';
import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';
import { useAccountStore } from './store/useAccountStore';
import { Account } from '@/types/Account';

export default function App() {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [hideUsernames, setHideUsernames] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<any>(null);
  const [language, setLanguage] = React.useState('es');
  const [showAccountControl, setShowAccountControl] = React.useState(false);

  const accounts = useAccountStore((s) => s.accounts);
  const setStoreAccounts = useAccountStore((s) => s.setAccounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);
  const setSelectedAccount = useAccountStore((s) => s.setSelectedAccount);

  // Safe API accessor
  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  const fetchAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!api) {
        setLoading(false);
        return;
      }
      const result = await api.account.list();
      if (result && result.success === false) {
        setError(result.error || 'Error loading accounts');
        return;
      }
      const data = result?.data || result || [];
      setStoreAccounts(data);
    } catch (err) {
      setError('Error loading accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, setStoreAccounts]);

  React.useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Load theme + language
  React.useEffect(() => {
    if (!api) return;
    (async () => {
      try {
        const result = await api.theme.get();
        if (result && result.success && result.data) {
          setTheme(result.data.settings);
        } else if (result && result.settings) {
          setTheme(result.settings);
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      }
    })();

    (async () => {
      try {
        const result = await api.language.get();
        if (result && result.success && result.data) {
          setLanguage(result.data);
        } else if (result && result.data) {
          setLanguage(result.data);
        }
      } catch (e) {
        console.error('Failed to load language:', e);
      }
    })();
  }, [api]);

  // Cookie expiry listeners
  React.useEffect(() => {
    if (!api?.cookieEvents?.onExpiring) return;
    const cleanupExpiring = api.cookieEvents.onExpiring((accountId: string, hoursLeft: number) => {
      console.warn(`Cookie expiring: account ${accountId}, ${hoursLeft}h left`);
    });
    const cleanupExpired = api.cookieEvents.onExpired((accountId: string) => {
      console.warn(`Cookie expired: account ${accountId}`);
      fetchAccounts();
    });
    return () => {
      cleanupExpiring?.();
      cleanupExpired?.();
    };
  }, [api, fetchAccounts]);

  const handleAddAccount = async (cookie: string, group?: string) => {
    const result = await api.account.add(cookie, group);
    if (result && result.success === false) {
      throw new Error(result.error || 'Failed to add account');
    }
    await fetchAccounts();
  };

  const handleLoginBrowser = async (group?: string) => {
    try {
      const result = await api.account.loginBrowser(group);
      if (result && result.success === false) throw new Error(result.error || 'Error desconocido');
      await fetchAccounts();
      setShowAddModal(false);
    } catch (e) {
      setError((e as Error).message || 'Error al iniciar sesión');
    }
  };

  const handleAddCookie = async (cookie: string, group?: string) => {
    const result = await api.account.add(cookie, group);
    if (result && result.success === false) {
      throw new Error(result.error || 'Error al agregar cookie');
    }
    await fetchAccounts();
  };

  const handleBulkImport = async (input: string, format: 'user:pass' | 'cookies') => {
    const result = await api.account.bulkImport(input, format);
    if (result && result.success === false) {
      throw new Error(result.error || 'Error en la importación masiva');
    }
    await fetchAccounts();
    return result.data;
  };

  const handleDeleteAccount = React.useCallback(async (id: string) => {
    const result = await api.account.remove(id);
    if (result && result.success === false) {
      throw new Error(result.error || 'Failed to remove account');
    }
    await fetchAccounts();
  }, [api, fetchAccounts]);

  const handleSaveAlias = React.useCallback(async (accountId: string, alias: string) => {
    const result = await api.account.updateProfile(accountId, { displayName: alias });
    if (result && result.success === false) {
      throw new Error(result.error || 'Error al guardar alias');
    }
    await fetchAccounts();
  }, [api, fetchAccounts]);

  const handleSaveDescription = React.useCallback(async (accountId: string, description: string) => {
    const result = await api.account.setField(accountId, 'description', description);
    if (result && result.success === false) {
      throw new Error(result.error || 'Error al guardar descripción');
    }
    await fetchAccounts();
  }, [api, fetchAccounts]);

  const handleFollowUser = React.useCallback(async (accountId: string, userId: number) => {
    await api.account.followUser(accountId, userId);
  }, [api]);

  const handleLaunchGame = React.useCallback(async (accountId: string, placeId: string, jobId: string) => {
    await api.roblox.launch(accountId, placeId, jobId || undefined);
  }, [api]);

  const handlePlayAccount = React.useCallback((account: Account) => {
    // Select the account and navigate to ServerBrowser
    setSelectedAccount(account);
  }, [setSelectedAccount]);

  const handleLaunchApp = React.useCallback(() => {
    if (!selectedAccount || !api) return;
    // Open Roblox app without specific game — quick launch
    api.roblox.launch(selectedAccount.id).then((result: any) => {
      if (result?.success === false) {
        setError(result.error || 'Error al abrir Roblox');
      }
    });
  }, [api, selectedAccount]);

  const handleEditTheme = React.useCallback(() => {
    // Navigate to settings
    const navEvent = new CustomEvent('navigate', { detail: '/settings' });
    window.dispatchEvent(navEvent);
  }, []);

  const handleAccountControl = React.useCallback(() => {
    if (selectedAccount) {
      setShowAccountControl(true);
    }
  }, [selectedAccount]);

  const handleThemeChange = async (partial: any) => {
    const result = await api.theme.set(partial);
    if (result && result.success && result.data) {
      setTheme(result.data.settings);
    } else if (result && result.settings) {
      setTheme(result.settings);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    const result = await api.language.set(lang);
    if (result && result.success) {
      setLanguage(lang);
    }
  };

  const handleExportData = async () => {
    const result = await api.advanced.exportData();
    if (result && result.success && result.data) {
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
    if (result && result.success) {
      await fetchAccounts();
    }
  };

  const handleClearCache = async () => {
    await api.advanced.clearCache();
  };

  // === Accounts page layout ===
  const AccountsPage = () => {
    const navigate = useNavigate();

    // Listen for navigation events from ActionBar
    React.useEffect(() => {
      const handler = (e: Event) => {
        const { detail } = e as CustomEvent;
        if (detail === '/settings') navigate('/settings');
        if (detail === '/servers') navigate('/servers');
      };
      window.addEventListener('navigate', handler);
      return () => window.removeEventListener('navigate', handler);
    }, [navigate]);

    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div>
            <h2 className="text-xl font-bold text-foreground">Cuentas</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {accounts.length > 0 ? `${accounts.length} de 50 cuentas` : 'Sin cuentas'}
            </p>
          </div>
        </div>

        {/* Main content: table + details panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Account table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32 text-destructive">
                {error}
              </div>
            ) : (
              <AccountTable
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccount}
                onDeleteAccount={handleDeleteAccount}
                onPlayAccount={handlePlayAccount}
                hideUsernames={hideUsernames}
              />
            )}
          </div>

          {/* Details panel */}
          <div className="w-80 flex-shrink-0 border-l border-border/30 bg-background/50">
            <AccountDetailsPanel
              account={selectedAccount}
              onSaveAlias={handleSaveAlias}
              onSaveDescription={handleSaveDescription}
              onFollowUser={handleFollowUser}
              onLaunchGame={handleLaunchGame}
            />
          </div>
        </div>

        {/* Action bar */}
        <ActionBar
          onAddAccount={() => setShowAddModal(true)}
          onRemoveAccount={() => {
            if (selectedAccount) handleDeleteAccount(selectedAccount.id);
          }}
          onLaunchApp={handleLaunchApp}
          onEditTheme={handleEditTheme}
          onAccountControl={handleAccountControl}
          hideUsernames={hideUsernames}
          onToggleHideUsernames={setHideUsernames}
          hasSelectedAccount={!!selectedAccount}
        />

        {/* Add Account Modal */}
        <AddAccountModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onLoginBrowser={handleLoginBrowser}
          onAddCookie={handleAddCookie}
          onBulkImport={handleBulkImport}
        />

        {/* Account Control Panel */}
        {showAccountControl && selectedAccount && (
          <AccountControlPanel
            account={selectedAccount}
            onClose={() => setShowAccountControl(false)}
          />
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MemoryRouter initialEntries={['/accounts']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/accounts" replace />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/servers" element={<ServerBrowser />} />
              <Route path="/presence" element={<PresenceDashboard />} />
              <Route
                path="/settings"
                element={
                  <SettingsPanel
                    theme={theme?.theme || 'dark'}
                    primaryColor={theme?.primaryColor || '#DE350D'}
                    accentColor={theme?.accentColor || '#6347FF'}
                    fontSize={theme?.fontSize || 'medium'}
                    uiDensity={theme?.uiDensity || 'normal'}
                    animationsEnabled={theme?.animationsEnabled ?? true}
                    language={language}
                    onThemeChange={handleThemeChange}
                    onLanguageChange={handleLanguageChange}
                    onExportData={handleExportData}
                    onDeleteAllAccounts={handleDeleteAll}
                    onClearCache={handleClearCache}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/accounts" replace />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}