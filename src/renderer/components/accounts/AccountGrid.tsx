import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Account } from '@/types/Account';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { AccountCard } from './AccountCard';
import { Button } from '@renderer/components/ui/button';
import { PlusCircle, RefreshCw } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] as const },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9,
    transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] as const },
  },
};

interface AccountGridProps {
  accounts: Account[];
  onAddAccount: () => void;
  onRefresh: () => void;
  onDeleteAccount: (id: string) => void;
  onSelectAccount: (account: Account) => void;
}

const AccountGrid: React.FC<AccountGridProps> = ({
  accounts,
  onAddAccount,
  onRefresh,
  onDeleteAccount,
  onSelectAccount,
}) => {
  const selectedAccount = useAccountStore((s) => s.selectedAccount);

  const handleDelete = (id: string) => {
    if (window.confirm('¿Eliminar esta cuenta?')) {
      onDeleteAccount(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Cuentas ({accounts.length})</h2>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={onAddAccount}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Cuenta
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4 opacity-20">
            <PlusCircle className="h-12 w-12" />
          </div>
          <h3 className="font-semibold text-foreground/80">No hay cuentas</h3>
          <p className="text-sm text-foreground/60 mt-2">
            Agrega tu primera cuenta de Roblox para empezar
          </p>
          <Button variant="default" size="sm" onClick={onAddAccount} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Cuenta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="wait">
            {accounts.map((account: Account) => (
              <motion.div key={account.id} initial="hidden" animate="visible" exit="exit" variants={itemVariants} className="group">
                <AccountCard
                  account={{
                    id: account.id,
                    username: account.username,
                    displayName: account.displayName || account.username,
                    avatar: account.avatarUrl ?? null,
                    group: account.group || 'Default',
                    createdAt: account.createdAt.toISOString(),
                  }}
                  isSelected={account.id === selectedAccount?.id}
                  onSelect={() => onSelectAccount(account)}
                  onEdit={() => onSelectAccount(account)}
                  onDelete={() => handleDelete(account.id)}
                  onJoinGame={() => {
                    // Launch Roblox with this account
                    const placeId = window.prompt('Ingresa el Place ID del juego:');
                    if (placeId) {
                      (window as any).api?.roblox?.launch?.(account.id, placeId).then((result: any) => {
                        if (result?.success === false) {
                          window.alert(result.error || 'Error al lanzar Roblox');
                        }
                      });
                    }
                  }}
                  joinGameStatus="idle"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AccountGrid;
