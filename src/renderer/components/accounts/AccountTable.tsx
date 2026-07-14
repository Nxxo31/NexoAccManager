import * as React from 'react';
import { Account } from '@/types/Account';
import { cn } from '@renderer/lib/utils';
import { PlusCircle, Play, Pencil, Trash2 } from 'lucide-react';

interface AccountTableProps {
  accounts: Account[];
  selectedAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onPlayAccount: (account: Account) => void;
  hideUsernames: boolean;
  onAddAccount?: () => void;
  onEditAlias?: (account: Account) => void;
  onEditDesc?: (account: Account) => void;
  onFollow?: (accountId: string, userId: number) => Promise<void>;
}

const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  onDeleteAccount,
  onPlayAccount,
  hideUsernames,
  onAddAccount,
  onEditAlias,
  onEditDesc,
}) => {
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta cuenta?')) {
      onDeleteAccount(id);
    }
  };

  const getAvatar = (account: Account) => {
    if (account.avatarUrl) {
      return (
        <img
          src={account.avatarUrl}
          alt={`${account.username} avatar`}
          className="h-6 w-6 rounded-full object-cover flex-shrink-0"
        />
      );
    }
    const initials = (account.displayName || account.username).toUpperCase().charAt(0);
    return (
      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {initials}
      </div>
    );
  };

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PlusCircle className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <h3 className="text-sm font-medium text-foreground/50">No hay cuentas</h3>
        <p className="text-xs text-muted-foreground/40 mt-1">
          Agrega tu primera cuenta para empezar
        </p>
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Agregar Cuenta
          </button>
        )}
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
              <tr
                key={account.id}
                className={cn(isSelected && 'selected')}
                onClick={() => onSelectAccount(account)}
                onDoubleClick={() => onPlayAccount(account)}
                role="row"
                title="Doble click para jugar"
              >
                {/* Usuario */}
                <td role="cell">
                  <div className="flex items-center gap-2">
                    {getAvatar(account)}
                    <span className="text-xs font-medium text-foreground truncate">
                      {hideUsernames ? '••••••' : `@${account.username}`}
                    </span>
                    {account.group && account.group !== 'Default' && (
                      <span className="inline-flex items-center px-1 py-0.5 text-[9px] rounded bg-primary/15 text-primary font-medium flex-shrink-0">
                        {account.group}
                      </span>
                    )}
                  </div>
                </td>

                {/* Alias */}
                <td role="cell">
                  {onEditAlias ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditAlias(account); }}
                      className="text-xs text-foreground/80 hover:text-primary transition-colors truncate block max-w-[200px] text-left"
                      title="Click para editar alias"
                    >
                      {account.displayName || account.username}
                    </button>
                  ) : (
                    <span className="text-xs text-foreground/80 truncate block max-w-[200px]">
                      {account.displayName || account.username}
                    </span>
                  )}
                </td>

                {/* Descripción */}
                <td role="cell">
                  {onEditDesc && account.description ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditDesc(account); }}
                      className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors truncate block max-w-[250px] text-left"
                      title="Click para editar"
                    >
                      {account.description}
                    </button>
                  ) : account.description ? (
                    <span className="text-xs text-muted-foreground/70 truncate block max-w-[250px]">
                      {account.description}
                    </span>
                  ) : onEditDesc ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditDesc(account); }}
                      className="text-xs text-muted-foreground/30 hover:text-muted-foreground transition-colors italic"
                    >
                     Sin descripción
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground/30 italic">Sin descripción</span>
                  )}
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
