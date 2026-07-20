import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, LogIn, Play, X } from 'lucide-react';
import { AccountGrid } from '@renderer/components/accounts/AccountGrid';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';
import { useAccountActions } from '@renderer/hooks/useAccountActions';
import type { Account } from '@/types/Account';

export interface AccountsViewProps {
  onShowAccountControl?: (acc: Account) => void;
  onEditAlias?: (acc: Account) => void;
  onEditDescription?: (acc: Account) => void;
}

/**
 * AccountsView — Hub principal de NX-Manager.
 * Todos los servicios (servers/games/friends/launch/join) cuelgan de las cuentas aquí presentes.
 * Contiene:
 *  - Toolbar de acciones: buscador, botón "Iniciar sesión", join a juego (placeId/jobId)
 *  - AccountGrid con todas las cuentas y acciones por cuenta
 *  - Empty state cuando no hay cuentas
 */
export const AccountsView: React.FC<AccountsViewProps> = ({
  onShowAccountControl,
  onEditAlias,
  onEditDescription,
}) => {
  const { t } = useTranslation();
  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);
  const setSelectedAccount = useAccountStore((s) => s.setSelectedAccount);
  const setAccountField = useAccountStore((s) => s.setAccountField);
  const hideUsernames = useUIStore((s) => s.hideUsernames);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const jobIdShuffle = useUIStore((s) => s.jobIdShuffle);

  const {
    handleLoginBrowser,
    handleLaunchApp,
    handleDeleteAccount,
    handleJoinServer,
    handleCopyPlaceId,
    followUser,
  } = useAccountActions();

  // Join to game state
  const [joinPlaceId, setJoinPlaceId] = React.useState('');
  const [joinJobId, setJoinJobId] = React.useState('');
  const [joinAccountId, setJoinAccountId] = React.useState<string>('');

  // Filter accounts by search query
  const filteredAccounts = React.useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.username?.toLowerCase().includes(q) ||
        a.displayName?.toLowerCase().includes(q) ||
        a.group?.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const handleSelectAccount = (acc: Account) => setSelectedAccount(acc);

  const handlePlayAccount = (acc: Account) => {
    handleLaunchApp(acc.id);
  };

  const handleFollowAccount = (acc: Account) => {
    followUser(acc.robloxUserId);
  };

  const handleShowAccountControl = (acc: Account) => {
    setSelectedAccount(acc);
    onShowAccountControl?.(acc);
  };

  const handleEditAlias = (acc: Account) => {
    setSelectedAccount(acc);
    onEditAlias?.(acc);
  };

  const handleEditDescription = (acc: Account) => {
    setSelectedAccount(acc);
    onEditDescription?.(acc);
  };

  const handleToggleFavorite = (acc: Account, isFav: boolean) => {
    setAccountField(acc.id, 'isFavorite', isFav);
    const api = (window as any).api;
    api?.account?.setField?.(acc.id, 'isFavorite', String(isFav));
  };

  const handleChangeGroup = (acc: Account, newGroup: string) => {
    setAccountField(acc.id, 'group', newGroup);
    const api = (window as any).api;
    api?.account?.setField?.(acc.id, 'group', newGroup);
  };

  const handleReorder = (reordered: Account[]) => {
    useAccountStore.getState().setAccounts(reordered);
    const api = (window as any).api;
    if (api?.account?.reorder) {
      api.account.reorder(reordered.map((a) => a.id));
    }
  };

  const handleJoinGame = async () => {
    if (!joinPlaceId) return;
    // Selecciona la cuenta antes de unirse para que handleJoinServer la use
    if (joinAccountId) {
      const acc = accounts.find((a) => a.id === joinAccountId);
      if (acc) setSelectedAccount(acc);
    }
    await handleJoinServer(joinPlaceId, joinJobId || '');
  };

  // Empty state
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('accounts.search', 'Buscar cuentas...')}
                className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-bg-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <button
            onClick={() => handleLoginBrowser()}
            className="flex items-center gap-2 h-10 px-4 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors text-sm font-medium"
            aria-label={t('accounts.login', 'Iniciar sesión')}
          >
            <LogIn className="h-4 w-4" />
            <span>{t('accounts.login', 'Iniciar sesión')}</span>
          </button>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-sm"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('accounts.noAccounts', 'No hay cuentas agregadas')}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t('accounts.noAccountsHint', 'Usa el botón "Iniciar sesión" para agregar una cuenta')}
            </p>
            <button
              onClick={() => handleLoginBrowser()}
              className="inline-flex items-center gap-2 h-10 px-6 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors text-sm font-medium"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('accounts.login', 'Iniciar sesión')}</span>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar - Hub principal */}
      <div className="flex flex-col gap-3 p-4 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('accounts.search', 'Buscar cuentas...')}
              className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-bg-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg-elevated text-muted-foreground"
                aria-label={t('common.clear', 'Limpiar')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Botón Iniciar sesión */}
          <button
            onClick={() => handleLoginBrowser()}
            className="flex items-center gap-2 h-10 px-4 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors text-sm font-medium flex-shrink-0"
            aria-label={t('accounts.login', 'Iniciar sesión')}
          >
            <LogIn className="h-4 w-4" />
            <span>{t('accounts.login', 'Iniciar sesión')}</span>
          </button>
        </div>

        {/* Join to game */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={joinAccountId}
            onChange={(e) => setJoinAccountId(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[160px]"
            aria-label={t('accounts.selectAccount', 'Seleccionar cuenta')}
          >
            <option value="">{t('accounts.selectAccount', 'Seleccionar cuenta...')}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName || a.username || a.id}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={joinPlaceId}
            onChange={(e) => setJoinPlaceId(e.target.value)}
            placeholder={t('accounts.placeId', 'Place ID')}
            className="h-9 w-32 px-3 rounded-md border border-border bg-bg-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            value={joinJobId}
            onChange={(e) => setJoinJobId(e.target.value)}
            placeholder={t('accounts.jobId', 'Job ID (opcional)')}
            className="h-9 w-40 px-3 rounded-md border border-border bg-bg-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleJoinGame}
            disabled={!joinAccountId || !joinPlaceId}
            className="flex items-center gap-2 h-9 px-4 bg-accent text-white hover:bg-accent-dark rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('accounts.joinGame', 'Unirse a juego')}
          >
            <Play className="h-4 w-4" />
            <span>{t('accounts.joinGame', 'Unirse')}</span>
          </button>
        </div>
      </div>

      {/* Grid de cuentas */}
      <div className="flex-1 overflow-y-auto p-4">
        <AccountGrid
          accounts={filteredAccounts}
          selectedAccount={selectedAccount}
          onSelectAccount={handleSelectAccount}
          onDeleteAccount={(acc) => handleDeleteAccount(acc.id)}
          onPlayAccount={handlePlayAccount}
          onFollowAccount={handleFollowAccount}
          onShowAccountControl={handleShowAccountControl}
          onEditAlias={handleEditAlias}
          onEditDescription={handleEditDescription}
          onCopyPlaceId={(acc) => handleCopyPlaceId(acc.savedPlaceId || '')}
          onToggleFavorite={handleToggleFavorite}
          onChangeGroup={handleChangeGroup}
          onReorder={handleReorder}
          hideUsernames={hideUsernames}
          jobIdShuffle={jobIdShuffle}
        />
      </div>
    </div>
  );
};

AccountsView.displayName = 'AccountsView';
export default AccountsView;
