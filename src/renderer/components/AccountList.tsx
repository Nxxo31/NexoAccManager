import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '@/types/Account';

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
  const { t } = useTranslation();
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
      <div className="bg-dark rounded-lg p-6 w-96 border border">
        <h3 className="text-lg font-semibold mb-2">
          {t('accountList.launchModal.title', { name: account.displayName || account.username })}
        </h3>
        <p className="text-sm text-secondary mb-4">
          {t('accountList.launchModal.description')}
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-secondary mb-1">
              {t('accountList.launchModal.labelPlaceId')}
            </label>
            <input
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder={t('accountList.launchModal.placeholderPlaceId')}
              className="w-full bg-dark border border rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">
              {t('accountList.launchModal.labelJobId')}
            </label>
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder={t('accountList.launchModal.placeholderJobId')}
              className="w-full bg-dark border border rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-dark/50 text-secondary rounded text-sm hover:bg-dark/60 transition-colors"
          >
            {t('accountList.launchModal.cancelButton')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!placeId.trim() || loading}
            className="flex-1 py-2 bg-primary text-primary rounded text-sm hover:bg-[color:var(--primary)_0.9] transition-all disabled:opacity-50"
          >
            {loading ? t('accountList.launchModal.launchingButton') : t('accountList.launchModal.launchButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountList({ accounts, onRefresh, onRemove, onOpenAccountPanel }: AccountListProps) {
  const { t } = useTranslation();
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
    if (!window.confirm(t('accountList.confirmDelete'))) return;
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
      <div className="flex flex-col items-center justify-center h-64 text-secondary">
        <div className="text-4xl mb-3">🎮</div>
        <p className="text-lg font-medium">{t('accountList.noAccountsTitle')}</p>
        <p className="text-sm">{t('accountList.noAccountsDescription')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {accounts.length} {accounts.length === 1 ? t('accountList.accountsCount') : t('accountList.accountsCountPlural', { count: accounts.length })}
        </h2>
        <button
          onClick={onRefresh}
          className="text-sm text-secondary hover:text-primary transition-colors"
        >
          {t('accountList.refreshButton')}
        </button>
      </div>

      {Object.entries(grouped).map(([group, groupAccounts]) => (
        <div key={group} className="mb-6">
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
            {group}
          </h3>

          <div className="space-y-2">
            {groupAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-dark rounded-lg p-4 flex items-center justify-between hover:bg-[#363d47] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                    {account.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">
                      {account.displayName || account.username}
                    </div>
                    <div className="text-xs text-secondary">@{account.username}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAccount(account)}
                    className="px-3 py-1.5 bg-success text-primary text-sm rounded-md hover:bg-[color:var(--primary)_0.9] transition-all"
                  >
                    {t('accountList.playButton')}
                  </button>
                  <button
                    onClick={() => onOpenAccountPanel(account)}
                    className="px-3 py-1.5 bg-accent/20 text-accent-light text-sm rounded-md hover:bg-accent/30 transition-all"
                    title={t('accountList.controlPanelTitle')}
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
                    className="px-3 py-1.5 bg-error/20 text-error text-sm rounded-md hover:bg-error/30 transition-all"
                  >
                    {t('accountList.deleteButton')}
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