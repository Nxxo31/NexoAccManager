import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@renderer/lib/utils';
import { PlayCircle, Loader2, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Badge } from '@renderer/components/ui/badge';

const accountCardVariants = cva(
  "flex w-full flex-col items-start gap-4 rounded-lg border border-border bg-card text-card-foreground shadow-sm p-4",
  {
    variants: {
      status: {
        idle: "",
        loading: "animate-pulse",
        success: "border-green-500/50",
        error: "border-red-500/50",
      },
    },
    defaultVariants: {
      status: "idle",
    },
  }
);

interface AccountCardProps {
  account: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    group: string;
    createdAt: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onJoinGame: () => void;
  joinGameStatus?: 'idle' | 'loading' | 'success' | 'error';
}

export const AccountCard = React.forwardRef<
  HTMLDivElement,
  AccountCardProps
>(({ account, isSelected, onSelect, onEdit, onDelete, onJoinGame, joinGameStatus = 'idle' }, ref) => {
  return (
    <div
      className={cn(
        accountCardVariants({ status: joinGameStatus }),
        isSelected ? 'ring-2 ring-ring' : 'hover:bg-muted/50 transition-colors'
      )}
      ref={ref}
      onClick={onSelect}
    >
      <div className="flex w-full items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {account.avatar ? (
            <img
              src={account.avatar}
              alt={`${account.displayName} avatar`}
              className="h-12 w-12 rounded-full bg-muted/50 object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center text-lg font-semibold text-muted-foreground">
              {account.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between w-full gap-2">
              <h3 className="text-base font-semibold text-foreground truncate">{account.displayName}</h3>
              <Badge variant="secondary" className="flex-shrink-0">{account.group}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              @{account.username}
            </p>
          </div>

          {/* Actions */}
          <div className="flex w-full items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-mono">
              #{account.id.slice(0, 8)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="h-7 w-7 p-1"
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="h-7 w-7 p-1 text-destructive hover:text-destructive"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Join Game Button */}
      <div className="mt-2 w-full">
        <Button
          variant={joinGameStatus === 'loading' ? 'outline' : 'default'}
          size="sm"
          onClick={(e) => { e.stopPropagation(); onJoinGame(); }}
          className="w-full"
          disabled={joinGameStatus === 'loading'}
        >
          {joinGameStatus === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uniéndose...
            </>
          ) : joinGameStatus === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Unido!
            </>
          ) : joinGameStatus === 'error' ? (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Error
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Jugar
            </>
          )}
        </Button>
      </div>
    </div>
  );
});
AccountCard.displayName = 'AccountCard';
