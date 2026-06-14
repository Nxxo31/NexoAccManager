interface Account {
  id: string;
  username: string;
  displayName?: string;
  group: string;
  description?: string;
  lastUsed: Date;
  createdAt: Date;
}

interface AccountListProps {
  accounts: Account[];
  onRefresh: () => void;
  onRemove: () => void;
}

export default function AccountList({ accounts, onRefresh, onRemove }: AccountListProps) {
  const handleLaunch = async (accountId: string) => {
    try {
      // @ts-expect-error api existe en window via preload
      await window.api.roblox.launch(accountId);
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
                    onClick={() => handleLaunch(account.id)}
                    className="px-3 py-1.5 bg-[#2ed573] text-white text-sm rounded-md hover:brightness-110 transition-all"
                  >
                    Jugar
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
    </div>
  );
}