import * as React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import AccountGrid from './components/accounts/AccountGrid';
import AddAccountModal from './components/accounts/AddAccountModal';
import ServerBrowser from './components/server-browser/ServerBrowser';
import PresenceDashboard from './components/presence/PresenceDashboard';
import SettingsPanel from './components/settings/SettingsPanel';
import { useAccountStore } from './store/useAccountStore';
import { Account } from '@/types/Account';

export default function App() {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<any>(null);
  const [language, setLanguage] = React.useState('es');
  const setStoreAccounts = useAccountStore((s) => s.setAccounts);
  const setSelectedAccount = useAccountStore((s) => s.setSelectedAccount);

  const fetchAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await (window as any).api.account.list();
      if (result && result.success === false) {
        setError(result.error || 'Error loading accounts');
        return;
      }
      const data = result?.data || result || [];
      setAccounts(data);
      setStoreAccounts(data);
    } catch (err) {
      setError('Error loading accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [setStoreAccounts]);

  React.useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Load theme settings
  React.useEffect(() => {
    (async () => {
      try {
        const result = await (window as any).api.theme.get();
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
        const result = await (window as any).api.language.get();
        if (result && result.success && result.data) {
          setLanguage(result.data);
        } else if (result && result.data) {
          setLanguage(result.data);
        }
      } catch (e) {
        console.error('Failed to load language:', e);
      }
    })();
  }, []);

  // Cookie expiry event listeners
  React.useEffect(() => {
    const api = (window as any).api;
    if (api?.cookieEvents?.onExpiring) {
      const cleanupExpiring = api.cookieEvents.onExpiring((accountId: string, hoursLeft: number) => {
        console.warn(`Cookie expiring: account ${accountId}, ${hoursLeft}h left`);
      });
      const cleanupExpired = api.cookieEvents.onExpired((accountId: string) => {
        console.warn(`Cookie expired: account ${accountId}`);
        fetchAccounts(); // Refresh accounts when a cookie expires
      });
      return () => {
        cleanupExpiring?.();
        cleanupExpired?.();
      };
    }
  }, [fetchAccounts]);

  const handleAddAccount = async (cookie: string, group?: string) => {
    const result = await (window as any).api.account.add(cookie, group);
    if (result && result.success === false) {
      throw new Error(result.error || 'Failed to add account');
    }
    await fetchAccounts();
  };

  const handleLoginAccount = async (username: string, password: string, group?: string) => {
    const result = await (window as any).api.account.login(username, password, group);
    if (result && result.success === false) {
      throw new Error(result.error || 'Failed to login');
    }
    await fetchAccounts();
  };

  const handleDeleteAccount = async (id: string) => {
    const result = await (window as any).api.account.remove(id);
    if (result && result.success === false) {
      throw new Error(result.error || 'Failed to remove account');
    }
    await fetchAccounts();
  };

  const handleThemeChange = async (partial: any) => {
    const result = await (window as any).api.theme.set(partial);
    if (result && result.success && result.data) {
      setTheme(result.data.settings);
    } else if (result && result.settings) {
      setTheme(result.settings);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    const result = await (window as any).api.language.set(lang);
    if (result && result.success) {
      setLanguage(lang);
    }
  };

  const handleExportData = async () => {
    const result = await (window as any).api.advanced.exportData();
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
    const result = await (window as any).api.advanced.deleteAllAccounts();
    if (result && result.success) {
      await fetchAccounts();
    }
  };

  const handleClearCache = async () => {
    await (window as any).api.advanced.clearCache();
  };

  // Presence state
  const [presences, setPresences] = React.useState<any[]>([]);
  const [isPolling, setIsPolling] = React.useState(false);

  const handleRefreshPresence = async () => {
    if (accounts.length === 0) return;
    const accountIds = accounts.map((a) => a.id);
    const result = await (window as any).api.presence.getPresence(accountIds);
    if (result && result.success) {
      setPresences(result.data || []);
    }
  };

  const handleTogglePolling = async () => {
    if (isPolling) {
      await (window as any).api.presence.stopPolling();
      setIsPolling(false);
    } else {
      if (accounts.length === 0) return;
      const accountIds = accounts.map((a) => a.id);
      await (window as any).api.presence.startPolling(accountIds, 30000);
      setIsPolling(true);
      handleRefreshPresence();
    }
  };

  // Server browser state
  const [servers, setServers] = React.useState<any[]>([]);

  const handleSelectServer = async (server: any) => {
    console.log('Selected server:', server.jobId);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MemoryRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                path="/accounts"
                element={
                  <div className="p-6 overflow-y-auto h-full">
                    {loading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center h-32 text-destructive">
                        {error}
                      </div>
                    ) : (
                      <AccountGrid
                        accounts={accounts}
                        onAddAccount={() => setShowAddModal(true)}
                        onRefresh={fetchAccounts}
                        onDeleteAccount={handleDeleteAccount}
                        onSelectAccount={(account) => setSelectedAccount(account)}
                      />
                    )}
                    <AddAccountModal
                      isOpen={showAddModal}
                      onClose={() => setShowAddModal(false)}
                      onAddAccount={handleAddAccount}
                      onLoginAccount={handleLoginAccount}
                    />
                  </div>
                }
              />
              <Route
                path="/servers"
                element={
                  <ServerBrowser
                    servers={servers}
                    onSelectServer={handleSelectServer}
                  />
                }
              />
              <Route
                path="/presence"
                element={
                  <PresenceDashboard
                    presences={presences}
                    onRefresh={handleRefreshPresence}
                    isPolling={isPolling}
                    onTogglePolling={handleTogglePolling}
                  />
                }
              />
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
              <Route path="*" element={<div className="p-6">Page not found</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
