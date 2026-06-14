import { useState } from 'react';

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

interface AccountListProps {
  accounts: Account[];
  onRefresh: () => void;
  onRemove: () => void;
  onOpenAccountPanel: (account: Account) => void;
}

interface LaunchModalProps {
  account: Account;
  onClose: () => void;
  onLaunch: (accountId: string, placeId: string, jobId?: string) => void;
}

function LaunchModal({ account, onClose, onLaunch }: LaunchModalProps) {
  const [placeId, setPlaceId] = useState('');
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!placeId.trim()) return;
    setLoading(true);
    onLaunch(account.id, placeId.trim(), jobId.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2f3640] rounded-lg p-6 w-96 border border-gray-700">
        <h3 className="text-lg font-semibold mb-2">
          Lanzar {account.displayName || account.username}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Introduce los parámetros del juego
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Place ID</label>
            <input
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="ej. 1818"
              className="w-full bg-[#1e272e] border border-gray-700 rounded px-3 py-2 text-sm focus:border-[#6c5ce7] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Job ID (opcional)</label>
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="ID del servidor"
              className="w-full bg-[#1e272e] border border-gray-700 rounded px-3 py-2 text-sm focus:border-[#6c5ce7] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!placeId.trim() || loading}
            className="flex-1 py-2 bg-[#6c5ce7] text-white rounded text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? 'Lanzando...' : 'Lanzar'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function AccountList({ accounts, onRefresh, onRemove, onOpenAccountPanel }: AccountListProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleLaunchDirect = async (accountId: string, placeId: string, jobId?: string) => {
    try {
      // @ts-expect-error api existe en window via preload
      await window.api.roblox.launch(accountId, placeId, jobId);
    } catch (err) {
      console.error('Error al lanzar:', err);
    }
  };

  const handleRemove = async (accountId: string) => {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    try {
      // @ts-expect-error api existe en window via preload
      await window.api.account.remove(accountId);
      onRemove();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  // Agrupar por grupo
  const grouped = accounts.reduce<Record<string, Account[]>>((acc, a) => {
    const g = a.group || 'Default';
    if (!acc[g]) acc[g] = [];
    acc[g].push(a);
    return acc;
  }, {});

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-4xl mb-3">🎮</div>
        <p className="text-lg font-medium">Sin cuentas</p>
        <p className="text-sm">Agrega una cuenta usando el formulario</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={onRefresh}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ↻ Actualizar
        </button>
      </div>

      {Object.entries(grouped).map(([group, groupAccounts]) => (
        <div key={group} className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {group}
          </h3>

          <div className="space-y-2">
            {groupAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-[#2f3640] rounded-lg p-4 flex items-center justify-between hover:bg-[#363d47] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#6c5ce7]/20 rounded-full flex items-center justify-center text-sm font-semibold text-[#6c5ce7]">
                    {account.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">
                      {account.displayName || account.username}
                    </div>
                    <div className="text-xs text-gray-500">@{account.username}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAccount(account)}
                    className="px-3 py-1.5 bg-[#2ed573] text-white text-sm rounded-md hover:brightness-110 transition-all"
                  >
                    Jugar
                  </button>
                  <button
                    onClick={() => onOpenAccountPanel(account)}
                    className="px-3 py-1.5 bg-[#6347FF]/20 text-[#8B6FFF] text-sm rounded-md hover:bg-[#6347FF]/30 transition-all"
                    title="Account Control Panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemove(account.id)}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-md hover:bg-red-500/30 transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedAccount && (
        <LaunchModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onLaunch={handleLaunchDirect}
        />
      )}
    </div>
  );
}