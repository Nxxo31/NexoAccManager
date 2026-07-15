import * as React from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Reorder } from 'framer-motion';
import { 
  Gamepad2, 
  Trash2, 
  UserPlus,
  MoreHorizontal,
  Settings2,
} from 'lucide-react';
import { Account } from '@/types/Account';
import { buttonTap } from '@renderer/animations/variants';

interface AccountRowProps {
  account: Account;
  index: string;
  selectedAccountId: string | null;
  onSelectAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onPlayAccount: (account: Account) => void;
  onFollowAccount: (userId: number) => void;
  onShowAccountControl?: (account: Account) => void;
  hideUsernames: boolean;
}

const AccountRow: React.FC<AccountRowProps> = ({
  account,
  index,
  selectedAccountId,
  onSelectAccount,
  onDeleteAccount,
  onPlayAccount,
  onFollowAccount,
  onShowAccountControl,
  hideUsernames,
}) => {
  const isSelected = selectedAccountId === account.id;
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = React.useState(false);

  const handleSelect = () => {
    onSelectAccount(account);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayAccount(account);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta cuenta?')) {
      onDeleteAccount(account.id);
    }
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (account.robloxUserId) {
      onFollowAccount(account.robloxUserId);
    }
  };

  const displayName = hideUsernames ? '••••••' : account.username;
  const displayAlias = hideUsernames ? '••••' : (account.displayName || '');

  return (
    <Reorder.Item
      value={account}
      key={account.id}
      dragListener={false}
    >
      <motion.div
        onClick={handleSelect}
        onDoubleClick={handlePlay}
        className={`flex items-center space-x-3 transition-all duration-150 min-h-[56px] ${isSelected ? 'bg-primary/10 border-l-4 border-primary' : 'bg-transparent'} hover:bg-bg-surface/5`}
        role="row"
        aria-selected={isSelected}
        tabIndex={0}
      >
        {/* Drag handle */}
        <motion.div
          onPointerDown={(e) => {
            e.stopPropagation();
            dragControls.start(e);
          }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          className={`drag-handle flex-shrink-0 p-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          aria-hidden="true"
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </motion.div>

        {/* Avatar and status dot */}
        <div className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xs font-mono text-primary" aria-hidden="true">
            {account.username ? account.username[0].toUpperCase() : '?'}
          </div>
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#6B6B6B' }} aria-hidden="true"></div>
        </div>

        {/* Account info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs">{displayName}</span>
            {displayAlias && (
              <span className="ml-1 text-xs text-muted-foreground">@{displayAlias}</span>
            )}
          </div>
          {account.description && (
            <p className="text-xs text-muted-foreground">{account.description}</p>
          )}
        </div>

        {/* Action buttons (shown on hover or selected) */}
        <div className="flex-1 justify-end">
          {isSelected ? (
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={buttonTap.whileHover}
                whileTap={buttonTap.whileTap}
                onClick={handleDelete}
                className="p-1 rounded hover:bg-bg-surface/50 text-muted-foreground hover:text-error"
                title="Eliminar"
                aria-label={`Eliminar cuenta ${account.username}`}
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={buttonTap.whileHover}
                whileTap={buttonTap.whileTap}
                onClick={handlePlay}
                className="p-1 rounded hover:bg-bg-surface/50 text-muted-foreground hover:text-primary"
                title="Jugar"
                aria-label={`Jugar con cuenta ${account.username}`}
              >
                <Gamepad2 className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={buttonTap.whileHover}
                whileTap={buttonTap.whileTap}
                onClick={handleFollow}
                className="p-1 rounded hover:bg-bg-surface/50 text-muted-foreground hover:text-accent"
                title="Seguir"
                aria-label={`Seguir usuario ${account.username}`}
              >
                <UserPlus className="h-4 w-4" />
              </motion.button>
              {onShowAccountControl && (
                <motion.button
                  whileHover={buttonTap.whileHover}
                  whileTap={buttonTap.whileTap}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onShowAccountControl(account); }}
                  className="p-1 rounded hover:bg-bg-surface/50 text-muted-foreground hover:text-primary"
                  title="Control de cuenta"
                  aria-label={`Control de cuenta ${account.username}`}
                >
                  <Settings2 className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

AccountRow.displayName = 'AccountRow';

export default AccountRow;
