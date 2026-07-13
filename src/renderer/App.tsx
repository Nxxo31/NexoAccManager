import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AccountList from './components/AccountList';
import AddAccountForm from './components/AddAccountForm';
import SettingsPanel from './components/SettingsPanel';
import Header from './components/Header';
import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';
import ServerBrowser from './components/ServerBrowser/ServerBrowser';
import PresenceDashboard from './components/PresenceDashboard';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Account } from '@/types/Account';

export default function App() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'accounts' | 'servers' | 'settings' | 'presence'>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await (window as any).api.account.list();
      if (result && result.success === false) {
        setError(result.error || t('app.errorLoadingAccounts'));
        return;
      }
      setAccounts(result || []);
    } catch (err) {
      setError(t('app.errorLoadingAccounts'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAccountAdded = () => {
    fetchAccounts();
  };

  const handleAccountRemoved = () => {
    fetchAccounts();
  };

  const handleOpenAccountPanel = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleCloseAccountPanel = () => {
    setSelectedAccount(null);
  };

  return (
      <ErrorBoundary>
        <ThemeProvider>
          <div className="dark flex flex-col h-screen bg-dark text-primary">
            <Header activeView={activeView} onViewChange={setActiveView} />
            <main className="flex-1 overflow-hidden">
              {error && (
                <div className="mx-4 mt-4 p-3 bg-error/50 border border-error rounded text-sm">
                  {error}
                </div>
              )}
              {activeView === 'accounts' && (
                <div className="flex h-full">
                  <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <AccountList
                        accounts={accounts}
                        onRefresh={fetchAccounts}
                        onRemove={handleAccountRemoved}
                        onOpenAccountPanel={handleOpenAccountPanel}
                      />
                    )}
                  </div>
                  <div className="w-80 border-l border p-4 overflow-y-auto">
                    <AddAccountForm onSuccess={handleAccountAdded} />
                  </div>
                </div>
              )}
              {activeView === 'servers' && (
                <div className="flex h-full">
                  <ServerBrowser accounts={accounts} />
                </div>
              )}
              {activeView === 'presence' && (
                <div className="flex h-full">
                  <PresenceDashboard />
                </div>
              )}
              {activeView === "settings" && (
                <div className="flex h-full">
                  <SettingsPanel accounts={accounts} onSelectAccount={handleOpenAccountPanel} />
                </div>
              )}
              {selectedAccount && (
                <AccountControlPanel
                  account={selectedAccount}
                  onClose={handleCloseAccountPanel}
                />
              )}
            </main>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  };