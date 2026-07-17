import * as React from 'react';
import { Play, Settings as SettingsIcon, Copy, Trash2, UserPlus, Lock, GripVertical, Star, StarHalf } from 'lucide-react';
import { Account } from '@/types/Account';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useUIStore } from '@renderer/store/useUIStore';

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
  onReorder?: (reorderedAccounts: Account[]) => void;
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

function calcAgingColor(expireDate: Date): string {
  const daysLeft = (expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return 'bg-error';
  if (daysLeft < 7) return 'bg-error';
  if (daysLeft <= 20) return 'bg-warning';
  return 'bg-success';
}

function calcAgingDays(expireDate: Date): number {
  return Math.max(0, Math.floor((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
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
  jobIdShuffle,
}) => {
  const { t } = useTranslation();
  const { disableAgingAlert } = useUIStore();

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

  return (
    <div className="space-y-6 p-4">
      {groupedAccounts.map(({ group, accounts: groupAccounts }) => (
        <div key={group || 'ungrouped'} className="space-y-2">
          {/* Group Header */}
          <div className="flex items-center gap-2 px-1">
            <div className="h-1 w-1 rounded-full bg-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group || t('accounts.ungrouped', 'Sin grupo')}
            </h3>
            <span className="text-xs text-muted-foreground/60">({groupAccounts.length})</span>
            <div className="flex-1 h-px bg-border ml-2" />
          </div>

          {/* Cards in this group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupAccounts.map((account) => {
              const isSelected = selectedAccount?.id === account.id;
              const isFavorite = account.isFavorite || false;
              const agingColor = account.cookieExpiresAt ? calcAgingColor(account.cookieExpiresAt) : null;
              const agingDays = account.cookieExpiresAt ? calcAgingDays(account.cookieExpiresAt) : null;

              return (
                <div
                  key={account.id}
                  className={cn(
                    'relative flex h-[120px] w-full flex-col items-start',
                    isSelected ? 'border-primary/50' : '',
                    !disableAgingAlert && agingColor ? `bg-[${agingColor}]/10` : ''
                  )}
                >
                  <div className="flex w-full p-4 space-x-4">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-full bg-bg-surface flex items-center justify-center">
                        {account.avatarUrl ? (
                          <img src={account.avatarUrl} alt={account.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-sm font-medium">{account.username?.charAt(0).toUpperCase() || '?'}</div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{account.username}</p>
                          {account.displayName && (
                            <p className="text-xs text-muted-foreground truncate">{account.displayName}</p>
                          )}
                        </div>
                        {/* Favorite star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement toggle favorite via IPC
                            console.log('Toggle favorite for', account.id);
                          }}
                          className="p-1 rounded hover:bg-primary/20 transition-colors"
                          aria-label={isFavorite ? t('accounts.unfavorite', 'Quitar de favoritos') : t('accounts.favorite', 'Marcar como favorito')}
                        >
                          {isFavorite ? (
                            <Star className="h-4 w-4 text-warning" />
                          ) : (
                            <Star className="h-4 w-4 text-muted-foreground hover:text-warning" />
                          )}
                        </button>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {account.group ? (
                          <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium">{account.group}</span>
                        ) : (
                          <span className="italic">{t('accounts.ungrouped', 'Sin grupo')}</span>
                        )}
                        {account.description && (
                          <span className="ml-2 text-xs text-muted-foreground">{account.description}</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => onPlayAccount(account)}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.play', 'Jugar')}
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onShowAccountControl(account)}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.control', 'Control de cuenta')}
                        >
                          <SettingsIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onCopyPlaceId(account)}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.copyPlaceId', 'Copiar Place ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onFollowAccount(account)}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.follow', 'Seguir usuario')}
                        >
                          <UserPlus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditAlias(account); }}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.editAlias', 'Editar alias')}
                        >
                          <Lock className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditDescription(account); }}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.editDescription', 'Editar descripción')}
                        >
                          <Lock className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteAccount(account); }}
                          className="btn btn-xs btn-ghost hover:bg-error/20 text-error"
                          aria-label={t('accounts.delete', 'Eliminar')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        {/* Aging dots */}
                        {!disableAgingAlert && account.cookieExpiresAt && (
                          <div className="ml-2 flex items-center gap-1">
                            <div className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: agingColor || undefined }}
                              title={`${t('accounts.cookieExpiresIn', 'Cookie expira en')} ${agingDays} ${t('accounts.days', 'días')}`}
                            />
                            <span className="text-xs">{agingDays}d</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export { calcAgingColor, calcAgingDays, groupAccounts };