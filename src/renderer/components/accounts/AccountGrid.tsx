import * as React from 'react';
import { Reorder } from 'framer-motion';
import { Play, Settings as SettingsIcon, Copy, Trash2, UserPlus, Lock, GripVertical } from 'lucide-react';
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
  onReorder: (reorderedAccounts: Account[]) => void;
  hideUsernames: boolean;
  jobIdShuffle: boolean;
}

// Group accounts by group field, preserving order within groups
function groupAccounts(accounts: Account[]): { group: string; accounts: Account[] }[] {
  const groups: { group: string; accounts: Account[] }[] = [];
  const groupMap = new Map<string, Account[]>();

  for (const acc of accounts) {
    const groupName = acc.group || '';
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
      groups.push({ group: groupName, accounts: [] });
    }
    const entry = groups.find(g => g.group === groupName);
    if (entry) entry.accounts.push(acc);
  }

  // Move empty group to end
  const emptyIdx = groups.findIndex(g => g.group === '');
  if (emptyIdx > -1 && emptyIdx !== groups.length - 1) {
    const [empty] = groups.splice(emptyIdx, 1);
    groups.push(empty);
  }

  return groups;
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
  onReorder,
  hideUsernames,
  jobIdShuffle: _jobIdShuffle,
}) => {
  const { t } = useTranslation();

  if (accounts.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center px-4 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground">{t('accounts.empty', 'No hay cuentas agregadas')}</p>
          <p className="text-xs text-muted-foreground">{t('accounts.emptyHint', 'Usa el botón + para agregar una cuenta')}</p>
        </div>
      </div>
    );
  }

  const groupedAccounts = groupAccounts(accounts);

  const handleReorder = (reordered: Account[]) => {
    onReorder(reordered);
  };

  return (
    <Reorder.Group axis="y" values={accounts} onReorder={handleReorder} className="space-y-6 p-4">
      {groupedAccounts.map(({ group, accounts: groupAccounts }) => (
        <div key={group || 'ungrouped'} className="space-y-2">
          {/* Group Header */}
          <div className="flex items-center gap-2 px-1">
            <div className="h-1 w-1 rounded-full bg-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group || t('accounts.ungrouped', 'Sin grupo')}
            </h3>
            <span className="text-xs text-muted-foreground/60">({groupAccounts.length})</span>
            <div className="flex-1 h-px bg-border ml-2" />
          </div>

          {/* Cards in this group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupAccounts.map((account) => {
              const isSelected = selectedAccount?.id === account.id;
              return (
                <Reorder.Item
                  key={account.id}
                  value={account}
                  className={cn(
                    'group relative flex h-[120px] w-full flex-col items-start gap-2 rounded-lg border p-4 cursor-grab active:cursor-grabbing',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-bg-elevated/50 hover:border-accent/30 transition-colors',
                    'shadow-sm hover:shadow-md active:shadow-lg active:scale-[1.02] transition-shadow'
                  )}
                  onClick={() => onSelectAccount(account)}
                  whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                >
                  {/* Drag handle */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>

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
                    <div className="mt-2 flex flex-wrap gap-1.5">
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
                        <Lock className="h-3 w-3" />
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
                        aria-label={t('accounts.delete', 'Eliminar')}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </div>
        </div>
      ))}
    </Reorder.Group>
  );
};
