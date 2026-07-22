// Application Component: AccountCard — individual account display

import { Star, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Account } from '../../../domain/entities/Account';
import { cn } from '../../../lib/utils';
import { Badge } from '../ui/badge';

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onClick: () => void;
  onRemove: () => void;
  onToggleFavorite: () => void;
  agingDays: number;
}

export function AccountCard({ account, selected, onClick, onRemove, onToggleFavorite, agingDays }: AccountCardProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false);
  const agingColor = agingDays > 30 ? 'text-[#ff4757]' : agingDays > 7 ? 'text-[#ffa502]' : 'text-[#2ed573]';

  return (
    <div onClick={onClick} className={cn(
      'relative flex items-center gap-3 p-3 bg-[#1a1a2e] border rounded-md cursor-pointer transition-colors duration-150 group',
      selected ? 'border-[#3b82f6] bg-[#1a1a2e]/80' : 'border-[#2a2a4e] hover:border-[#3a3a5e]',
    )}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-md bg-[#2a2a4e] flex items-center justify-center text-sm font-bold text-[#aaa] flex-shrink-0">
        {account.username.charAt(0).toUpperCase()}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#eee] truncate">{account.username}</span>
          {account.isFavorite && <Star size={12} className="text-[#ffa502] fill-[#ffa502] flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#666]">{account.group}</span>
          <span className={cn('text-xs', agingColor)}>●</span>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="p-1 text-[#666] hover:text-[#ffa502] transition-colors">
          <Star size={14} className={cn(account.isFavorite && 'fill-[#ffa502] text-[#ffa502]')} />
        </button>
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1 text-[#666] hover:text-[#eee] transition-colors">
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-7 z-10 bg-[#1a1a2e] border border-[#2a2a4e] rounded shadow-lg py-1 min-w-[120px]">
              <button onClick={(e) => { e.stopPropagation(); onRemove(); setShowMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#ff4757] hover:bg-[#2a2a4e] w-full">
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
