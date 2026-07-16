import * as React from 'react';
import { Play, Settings as SettingsIcon, Copy, Trash2, UserPlus, Lock } from 'lucide-react';
import { Account } from '@/types/Account';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AccountGridProps {
  accounts: Account[];
  selectedAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  onPlayAccount: (account: Account) => void;
  onFollowAccount: (account: Account) => void;
  onShowAccountControl: (account: Account) => void;
  onEditAlias: (account: Account) => void;
  onEditDescription: (account: Account) => void;
  onCopyPlaceId: (account: Account) => void;
  hideUsernames: boolean;
  jobIdShuffle: boolean;
}

export const AccountGrid: React.FC<AccountGridProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  onDeleteAccount,
  onPlayAccount,
  onFollowAccount,
  onShowAccountControl,
  onEditAlias,
  onEditDescription,
  onCopyPlaceId,
  hideUsernames,
  jobIdShuffle: _jobIdShuffle,
}) => {
  const { t } = useTranslation();

  if (accounts.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">{t('accounts.empty', 'No hay cuentas agregadas')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const isSelected = selectedAccount?.id === account.id;
          return (
            <div
              key={account.id}
              className={cn(
                'group relative flex h-[120px] w-full flex-col items-start gap-2 rounded-lg border p-4',
                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-bg-elevated/50 transition-colors cursor-pointer'
              )}
              onClick={() => onSelectAccount(account)}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 h-10 w-10 rounded bg-primary/20 flex items-center justify-center">
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt={account.username} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="text-xs font-medium">
                    {(account.displayName || account.username).substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 w-full space-y-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {hideUsernames ? '••••••' : account.username}
                    </p>
                    {account.displayName && (
                      <p className="text-xs text-muted-foreground truncate">{account.displayName}</p>
                    )}
                  </div>
                  {/* Status dot */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      account.cookieExpiresAt ? 'bg-success' : 'bg-gray-400'
                    )} />
                  </div>
                </div>

                {account.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{account.description}</p>
                )}

                {/* Action buttons */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlayAccount(account); }}
                    className="btn btn-sm btn-ghost hover:bg-primary/20"
                    aria-label={t('accounts.play', 'Jugar')}
                    title="Jugar"
                  >
                    <Play className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onShowAccountControl(account); }}
                    className="btn btn-sm btn-ghost hover:bg-primary/20"
                    aria-label={t('accounts.control', 'Control de cuenta')}
                    title="Control de cuenta"
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onCopyPlaceId(account); }}
                    disabled={!account.savedPlaceId}
                    className="btn btn-sm btn-ghost hover:bg-primary/20 disabled:opacity-30"
                    aria-label={t('accounts.copyPlaceId', 'Copiar Place ID')}
                    title="Copiar Place ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onEditAlias(account); }}
                    className="btn btn-sm btn-ghost hover:bg-primary/20"
                    aria-label={t('accounts.editAlias', 'Editar alias')}
                    title="Editar alias"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onEditDescription(account); }}
                    className="btn btn-sm btn-ghost hover:bg-primary/20"
                    aria-label={t('accounts.editDescription', 'Editar descripción')}
                    title="Editar descripción"
                  >
                    <Lock className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onFollowAccount(account); }}
                    className="btn btn-sm btn-ghost hover:bg-primary/20"
                    aria-label={t('accounts.follow', 'Seguir usuario')}
                    title="Seguir usuario"
                  >
                    <UserPlus className="h-3 w-3" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteAccount(account); }}
                    className="btn btn-sm btn-ghost hover:bg-error/20 text-error"
                    aria-label={t('accounts.delete', 'Eliminar cuenta')}
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

AccountGrid.displayName = 'AccountGrid';
