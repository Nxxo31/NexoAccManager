import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '@/types/Account';

interface AccountListProps {
  accounts: Account[];
  onRefresh: () => void;
  onRemove: (id: string) => void;
  onOpenAccountDetail: (account: Account) => void;
  onJoinGame: (account: Account) => void;
}

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onJoin: (account: Account) => void;
}

export default function AccountList({ accounts, onRefresh, onRemove, onOpenAccountDetail, onJoinGame }: AccountListProps) {
  const { t } = useTranslation();

  const handleEdit = (account: Account) => {
    onOpenAccountDetail(account);
  };

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-secondary">
        <div className="text-5xl mb-4">🎮</div>
        <h2 className="text-xl font-bold">{t('accountList.emptyTitle')}</h2>
        <p className="text-sm">{t('accountList.emptyDescription')}</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
        >
          {t('accountList.refreshButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('accountList.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-secondary/20 text-secondary hover:bg-secondary/30 rounded hover:text-white transition-colors"
          >
            {t('accountList.refreshButton')}
          </button>
          <button
            onClick={() => {
              // Abrir modal para agregar cuenta
              // Esto se maneja desde App.tsx
            }}
            className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            + {t('accountList.addAccount')}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={handleEdit}
            onDelete={() => onRemove(account.id)}
            onJoin={() => onJoinGame(account)}
          />
        ))}
      </div>
    </div>
  );
}

function AccountCard({ account, onEdit, onDelete, onJoin }: AccountCardProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative bg-card rounded-xl p-4 hover:bg-card/90 transition-colors border border-border/50 hover:border-border`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar con iniciales o thumbnail */}
        <div className="w-12 h-12 flex-shrink-0 bg-primary/20 rounded-xl flex items-center justify-center">
          {account.avatarUrl ? (
            <img 
              src={account.avatarUrl} 
              alt={account.username} 
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="text-primary font-bold text-xl">
              {(account.displayName || account.username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-white truncate max-w-xs">
              {account.displayName || account.username}
            </h3>
            <span className="text-xs text-secondary/70 bg-secondary/20 px-2 py-0.5 rounded">
              #{account.robloxUserId}
            </span>
          </div>

          {account.description && (
            <p className="mt-1 line-clamp-2 text-sm text-secondary/80">
              {account.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-secondary/60">
              {t('accountList.group')}:
            </span>
            <span className="text-xs font-medium bg-secondary/20 px-2 py-0.5 rounded">
              {account.group || 'Default'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(account)}
          className="p-2 bg-secondary/20 text-secondary/80 hover:bg-secondary/30 hover:text-white rounded hover:text-white transition-colors"
          title={t('accountList.edit')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4-1 1-4 9.5-9.5z" />
          </svg>
        </button>

        <button
          onClick={() => onDelete(account.id)}
          className="p-2 bg-error/20 text-error/60 hover:bg-error/30 hover:text-error rounded hover:text-error transition-colors"
          title={t('accountList.delete')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 12m14 0V5a2 2 0 00-2-2h-5.586l1 1-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2zm-9.318-3.375a1.562 1.562 0 00-2.209 2.209l1.354 1.354a1.562 1.562 0 002.209 2.21l3.434-3.434a1.562 1.562 0 00-2.209-2.209l-1.354-1.354zM9 12a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </button>

        <button
          onClick={() => onJoin(account)}
          className="p-2 bg-primary/20 text-primary/80 hover:bg-primary/30 hover:text-white rounded hover:text-white transition-colors"
          title={t('accountList.joinGame')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622" />
          </svg>
        </button>
      </div>
    </div>
  );
}