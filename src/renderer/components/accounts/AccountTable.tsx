import * as React from 'react';
import { Account } from '@/types/Account';
import { cn } from '@renderer/lib/utils';
import AccountRow from './AccountRow';

interface AccountTableProps {
  accounts: Account[];
  selectedAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onPlayAccount: (account: Account) => void;
  onFollowAccount: (userId: number) => void;
  hideUsernames: boolean;
}

const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  onDeleteAccount,
  onPlayAccount,
  onFollowAccount,
  hideUsernames,
}) => {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-10 w-10 text-muted-foreground/20 mb-3">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-foreground/50">No hay cuentas</h3>
        <p className="text-xs text-muted-foreground/40 mt-1">
          Agrega tu primera cuenta para empezar
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="nexo-table" role="table" aria-label="Tabla de cuentas">
        <thead>
          <tr>
            <th className="w-[33%]" scope="col">Usuario</th>
            <th className="w-[33%]" scope="col">Alias</th>
            <th className="w-[34%]" scope="col">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const isSelected = selectedAccount?.id === account.id;
            return (
              <AccountRow
                key={account.id}
                index={account.id} // Using id as index for simplicity; in a real app you might want to use a separate index
                account={account}
                selectedAccountId={selectedAccount?.id ?? null}
                onSelectAccount={onSelectAccount}
                onDeleteAccount={onDeleteAccount}
                onPlayAccount={onPlayAccount}
                onFollowAccount={onFollowAccount}
                hideUsernames={hideUsernames}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AccountTable;