import { useState, useEffect } from 'react';
import AccountList from './components/AccountList';
import AddAccountForm from './components/AddAccountForm';
import SettingsPanel from './components/SettingsPanel';
import Header from './components/Header';
import AccountControlPanel from './components/AccountControlPanel/AccountControlPanel';

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'accounts' | 'settings'>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.list();
      if (result && result.success === false) {
        setError(result.error || 'Error al cargar cuentas');
        return;
      }
      setAccounts(result || []);
    } catch (err) {
      setError('Error al cargar cuentas. Asegúrate de que NexoAccManager esté ejecutándose.');
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
    <div className="dark flex flex-col h-screen bg-[#1e272e] text-[#f5f6fa]">
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

        {activeView === 'settings' && <SettingsPanel />}
      </main>

      {selectedAccount && (
        <AccountControlPanel
          account={selectedAccount}
          onClose={handleCloseAccountPanel}
        />
      )}
    </div>
  );
}