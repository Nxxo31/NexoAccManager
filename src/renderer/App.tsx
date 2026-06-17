import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AccountList from './components/AccountList';
import AddAccountForm from './components/AddAccountForm';
import SettingsPanel from './components/SettingsPanel';
import Header from './components/Header';
import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';
import ServerBrowser from './components/ServerBrowser/ServerBrowser';
import PresenceDashboard from './components/PresenceDashboard';
import AuthPage from './components/auth/AuthPage';
import { ThemeProvider } from './context/ThemeContext';

interface Account {
  id: string;
  username: string;
  displayName?: string;
  group: string;
  description?: string;
  lastUsed: Date;
  createdAt: Date;
  robloxUserId?: number;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'accounts' | 'servers' | 'settings' | 'presence' | 'auth'>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  // Verificar estado de autenticación al iniciar la aplicación
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authStatus = await (window as any).api.auth.status();
        if (authStatus && authStatus.success !== false && authStatus.data && authStatus.data.authenticated) {
          // Usuario autenticado, guardar datos en localStorage para modo offline
          localStorage.setItem('nexoLicenseData', JSON.stringify(authStatus.data.license));
          localStorage.setItem('nexoUserId', authStatus.data.userId);
          localStorage.setItem('nexoEmail', authStatus.data.email);
          setActiveView('accounts');
          fetchAccounts();
        } else {
          // Intentar obtener datos de modo offline desde localStorage
          const offlineLicenseData = localStorage.getItem('nexoLicenseData');
          const offlineUserId = localStorage.getItem('nexoUserId');
          const offlineEmail = localStorage.getItem('nexoEmail');
          
          if (offlineLicenseData && offlineUserId && offlineEmail) {
            // Usuario tiene datos guardados para modo offline
            setActiveView('accounts');
            fetchAccounts();
          } else {
          // Usuario no autenticado y no hay datos offline, ir a pantalla de login
          setActiveView('auth');
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        // En caso de error, intentar modo offline
        const offlineLicenseData = localStorage.getItem('nexoLicenseData');
        const offlineUserId = localStorage.getItem('nexoUserId');
        const offlineEmail = localStorage.getItem('nexoEmail');
        
        if (offlineLicenseData && offlineUserId && offlineEmail) {
          // Usuario tiene datos guardados para modo offline
          setActiveView('accounts');
          fetchAccounts();
        } else {
          // Usuario no autenticado y no hay datos offline, ir a pantalla de login
          setActiveView('auth');
        }
        setCheckingAuth(false);
      }
    };

    checkAuthStatus();
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
    <div className="dark flex flex-col h-screen bg-[#1e272e] text-[#f5f6fa]">
      {checkingAuth && (
        <div className="flex flex-col items-center justify-center h-screen bg-[#1e272e]">
          <div className="animate-spin w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm text-gray-400">{t('app.checkingAuth')}</p>
        </div>
      )}
      {!checkingAuth && (
        <>
          <Header activeView={activeView} onViewChange={setActiveView} />

          <main className="flex-1 overflow-hidden">
            {error && (
              <div className="mx-4 mt-4 p-3 bg-red-900/50 border border-red-600 rounded text-sm">
                {error}
              </div>
            )}

            {activeView === 'accounts' && (
              <div className="flex h-full">
                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full" />
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

                <div className="w-80 border-l border-gray-700 p-4 overflow-y-auto">
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

            {activeView === 'auth' && (
              <div className="flex h-full">
                <AuthPage />
              </div>
            )}

            {activeView === "settings" && (<SettingsPanel accounts={accounts} onSelectAccount={handleOpenAccountPanel} />)}
          </main>

          {selectedAccount && (
            <AccountControlPanel
              account={selectedAccount}
              onClose={handleCloseAccountPanel}
            />
          )}
        </>
      )}
    </div>
  );
}