import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Account } from '@/types/Account';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { AccountCard } from './AccountCard';
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

const AccountGrid: React.FC = () => {
  const accounts = useAccountStore((s) => s.accounts);
  const selectedAccount = useAccountStore((s) => s.selectedAccount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Accounts</h2>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => console.log('Open add account modal')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Account
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => console.log('Refresh accounts')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.5 8H21m0-4a2 2 0 100 4 2 2 0 000-4zm0 0v3m0 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground/80">No accounts yet</h3>
          <p className="text-sm text-foreground/60 mt-2">Add your first Roblox account to get started</p>
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
                  onSelect={() => console.log('Select account:', account.id)}
                  onEdit={() => console.log('Edit account:', account.id)}
                  onDelete={() => console.log('Delete account:', account.id)}
                  onJoinGame={() => console.log('Join game with account:', account.id)}
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