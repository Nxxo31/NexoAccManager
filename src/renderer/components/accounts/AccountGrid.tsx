import * as React from 'react';
import { Play, Settings as SettingsIcon, Copy, Trash2, UserPlus, Lock, Star, ChevronDown } from 'lucide-react';
import { Account } from '@/types/Account';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useUIStore } from '@renderer/store/useUIStore';
import { useAccountStore } from '@renderer/store/useAccountStore';

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
  onToggleFavorite: (account: Account, isFavorite: boolean) => void;
  onChangeGroup: (account: Account, newGroup: string) => void;
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
  onToggleFavorite,
  onChangeGroup,
  onCopyPlaceId,
  hideUsernames,
}) => {
  const { t } = useTranslation();
  const { disableAgingAlert } = useUIStore();
  const [groupDropdownOpen, setGroupDropdownOpen] = React.useState(false);
  const [lastClickedId, setLastClickedId] = React.useState<string | null>(null);

  // Selection state from store
  const selectedIds = useAccountStore((s) => s.selectedIds);
  const setSelectedIds = useAccountStore((s) => s.setSelectedIds);
  const toggleSelection = useAccountStore((s) => s.toggleSelection);
  const selectRange = useAccountStore((s) => s.selectRange);
  const clearSelection = useAccountStore((s) => s.clearSelection);
  const selectAll = useAccountStore((s) => s.selectAll);

  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  const hasSelection = selectedIds.length > 0;

  const launchSelectedAccounts = async () => {
    const placeId = window.prompt('Place ID (dejar vacío para usar el guardado):', '');
    const jobId = window.prompt('Job ID (dejar vacío para usar el guardado):', '');

    const selectedAccounts = accounts.filter((acc) => selectedIds.includes(acc.id));
    for (const account of selectedAccounts) {
      const placeIdToUse = placeId === '' ? account.savedPlaceId : placeId;
      const jobIdToUse = jobId === '' ? account.savedJobId : jobId;
      try {
        await api?.roblox?.launch(account.id, placeIdToUse, jobIdToUse);
      } catch {
        // continue launching other accounts even if one fails
      }
    }
  };

  const killSelectedAccounts = async () => {
    if (!window.confirm('¿Cerrar las instancias de las cuentas seleccionadas?')) {
      return;
    }
    try {
      await api?.roblox?.killAll?.();
      clearSelection();
    } catch {
      // ignore
    }
  };

  const handleAccountClick = (event: React.MouseEvent, account: Account) => {
    onSelectAccount(account);

    if (event.ctrlKey) {
      toggleSelection(account.id);
      setLastClickedId(account.id);
    } else if (event.shiftKey) {
      if (lastClickedId) {
        selectRange(lastClickedId, account.id);
        setLastClickedId(account.id);
      } else {
        setSelectedIds([account.id]);
        setLastClickedId(account.id);
      }
    } else {
      setSelectedIds([account.id]);
      setLastClickedId(account.id);
    }
  };

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
      {/* Selection actions bar */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={launchSelectedAccounts}
          disabled={!hasSelection}
          className={cn(
            'btn btn-ghost hover:bg-primary/20',
            !hasSelection && 'opacity-50 cursor-not-allowed'
          )}
        >
          {t('accounts.launchSelected', 'Iniciar seleccionadas')}
        </button>
        <button
          onClick={killSelectedAccounts}
          disabled={!hasSelection}
          className={cn(
            'btn btn-ghost hover:bg-error/20 text-error',
            !hasSelection && 'opacity-50 cursor-not-allowed'
          )}
        >
          {t('accounts.killSelected', 'Cerrar seleccionadas')}
        </button>
        <button
          onClick={selectAll}
          disabled={accounts.length === 0}
          className={cn(
            'btn btn-ghost hover:bg-primary/20 ml-auto',
            accounts.length === 0 && 'opacity-50 cursor-not-allowed'
          )}
        >
          {t('accounts.selectAll', 'Seleccionar todas')}
        </button>
        <button
          onClick={clearSelection}
          disabled={!hasSelection}
          className={cn(
            'btn btn-ghost hover:bg-primary/20',
            !hasSelection && 'opacity-50 cursor-not-allowed'
          )}
        >
          {t('accounts.clearSelection', 'Limpiar selección')}
        </button>
      </div>

      {groupedAccounts.map(({ group, accounts: groupAccounts }) => (
        <div key={group || 'ungrouped'} className="space-y-2">
          {/* Group Header */}
          <div className="flex items-center gap-2 px-1">
            <div className="h-1 w-1 rounded-full bg-accent" />
            <h3 className={cn(
              'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
              group === '' && 'italic'
            )}>
              {group || t('accounts.ungrouped', 'Sin grupo')}
            </h3>
            <span className="text-xs text-muted-foreground/60">({groupAccounts.length})</span>
            <div className="flex-1 h-px bg-border ml-2" />
          </div>

          {/* Cards in this group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupAccounts.map((account) => {
              const isSelected = selectedAccount?.id === account.id;
              const isFavorite = account.isFavorite ?? false;
              const isMultiSelected = selectedIds.includes(account.id);
              const agingColor = account.cookieExpiresAt ? calcAgingColor(account.cookieExpiresAt) : null;
              const agingDays = account.cookieExpiresAt ? calcAgingDays(account.cookieExpiresAt) : null;

              return (
                <div
                  key={account.id}
                  onClick={(e) => handleAccountClick(e, account)}
                  className={cn(
                    'relative flex h-[120px] w-full flex-col items-start cursor-pointer rounded-lg border border-border bg-bg-card hover:border-primary/30 transition-colors',
                    isSelected && 'border-primary/50',
                    isMultiSelected && 'bg-primary/10 border-primary/30'
                  )}
                >
                  <div className="flex w-full p-4 space-x-4">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-full bg-bg-surface flex items-center justify-center overflow-hidden">
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
                          <p className="text-sm font-medium truncate">
                            {hideUsernames ? account.username?.replace(/(?<=.{2})./g, '*') : account.username}
                          </p>
                          {account.displayName && (
                            <p className="text-xs text-muted-foreground truncate">{account.displayName}</p>
                          )}
                        </div>
                        {/* Favorite star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(account, !isFavorite);
                          }}
                          className="p-1 rounded hover:bg-primary/20 transition-colors"
                          aria-label={isFavorite ? t('accounts.unfavorite', 'Quitar de favoritos') : t('accounts.favorite', 'Marcar como favorito')}
                        >
                          {isFavorite ? (
                            <Star className="h-4 w-4 text-warning fill-warning" />
                          ) : (
                            <Star className="h-4 w-4 text-muted-foreground hover:text-warning" />
                          )}
                        </button>
                      </div>

                      {/* Group selector */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupDropdownOpen(!groupDropdownOpen);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/20 hover:bg-primary/30 transition-colors"
                        >
                          {account.group || t('accounts.ungrouped', 'Sin grupo')}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {groupDropdownOpen && (
                          <div className="absolute left-0 mt-1 w-48 rounded-md bg-bg-card border border-border shadow-lg z-20">
                            <div className="py-1">
                              <div className="px-3 py-1.5 text-xs cursor-pointer hover:bg-primary/20 whitespace-nowrap" onClick={() => {
                                setGroupDropdownOpen(false);
                                onChangeGroup(account, '');
                              }}>
                                {t('accounts.ungrouped', 'Sin grupo')}
                              </div>
                              {Array.from(new Set(accounts.map((a) => a.group).filter(Boolean))).map((groupName) => (
                                <div key={groupName} className="px-3 py-1.5 text-xs cursor-pointer hover:bg-primary/20 whitespace-nowrap" onClick={() => {
                                  setGroupDropdownOpen(false);
                                  onChangeGroup(account, groupName);
                                }}>
                                  {groupName}
                                </div>
                              ))}
                              <div className="px-3 py-1.5 text-xs cursor-pointer border-t border-border" onClick={() => {
                                setGroupDropdownOpen(false);
                                const newGroup = prompt('Nuevo nombre de grupo:', account.group || '');
                                if (newGroup !== null) {
                                  onChangeGroup(account, newGroup.trim() || '');
                                }
                              }}>
                                {t('accounts.newGroup', 'Nuevo grupo...')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onPlayAccount(account); }}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.play', 'Jugar')}
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onShowAccountControl(account); }}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.control', 'Control de cuenta')}
                        >
                          <SettingsIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onCopyPlaceId(account); }}
                          className="btn btn-xs btn-ghost hover:bg-primary/20"
                          aria-label={t('accounts.copyPlaceId', 'Copiar Place ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onFollowAccount(account); }}
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
