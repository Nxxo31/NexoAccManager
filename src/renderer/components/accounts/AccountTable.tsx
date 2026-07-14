import * as React from 'react';
import { Account } from '@/types/Account';
import { cn } from '@renderer/lib/utils';
import { Play, Pencil, Trash2, PlusCircle } from 'lucide-react';

interface AccountTableProps {
  accounts: Account[];
  selectedAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onPlayAccount: (account: Account) => void;
  hideUsernames: boolean;
  onAddAccount?: () => void;
}

const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  onDeleteAccount,
  onPlayAccount,
  hideUsernames,
  onAddAccount,
}) => {
  const handleDelete = (id: string) => {
    if (window.confirm('¿Eliminar esta cuenta?')) {
      onDeleteAccount(id);
    }
  };

  const getStatusColor = (lastUsed: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(lastUsed).getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return 'bg-success';
    if (diffDays < 30) return 'bg-warning';
    return 'bg-error';
  };

  const getAvatar = (account: Account) => {
    if (account.avatarUrl) {
      return (
        <img
          src={account.avatarUrl}
          alt={`${account.username} avatar`}
          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
        />
      );
    }
    const initials = (account.displayName || account.username).toUpperCase().charAt(0);
    return (
      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {initials}
      </div>
    );
  };

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PlusCircle className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h3 className="font-semibold text-foreground/60">No hay cuentas</h3>
        <p className="text-sm text-muted-foreground/50 mt-1.5">
          Agrega tu primera cuenta de Roblox para empezar
        </p>
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Agregar Cuenta
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table
        className="nexo-table"
        role="table"
        aria-label="Tabla de cuentas de Roblox"
      >
        <thead>
          <tr>
            <th className="w-[35%]" scope="col">
              Usuario
            </th>
            <th className="w-[25%]" scope="col">
              Alias
            </th>
            <th className="w-[30%]" scope="col">
              Descripción
            </th>
            <th className="w-[10%] text-right" scope="col">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const isSelected = selectedAccount?.id === account.id;
            return (
              <tr
                key={account.id}
                className={cn(isSelected && 'selected')}
                onClick={() => onSelectAccount(account)}
                role="row"
              >
                {/* Usuario */}
                <td role="cell">
                  <div className="flex items-center gap-2.5">
                    {getAvatar(account)}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {hideUsernames ? '••••••' : `@${account.username}`}
                      </span>
                      {account.displayName && account.displayName !== account.username && (
                        <span className="text-xs text-muted-foreground truncate">
                          {account.displayName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Alias */}
                <td role="cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-foreground/80">
                      {account.displayName || account.username}
                    </span>
                    {account.group && account.group !== 'Default' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded bg-primary/15 text-primary font-medium w-fit">
                        {account.group}
                      </span>
                    )}
                  </div>
                </td>

                {/* Descripción */}
                <td role="cell">
                  {account.description ? (
                    <span className="text-sm text-muted-foreground/80 truncate block max-w-[200px]">
                      {account.description}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/30 italic">
                      Sin descripción
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td role="cell">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayAccount(account); }}
                      className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Jugar"
                      aria-label="Jugar con esta cuenta"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectAccount(account); }}
                      className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                      title="Editar"
                      aria-label="Editar esta cuenta"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }}
                      className="p-1.5 rounded hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                      title="Eliminar"
                      aria-label="Eliminar esta cuenta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AccountTable;