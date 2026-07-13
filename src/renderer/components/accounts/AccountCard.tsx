import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@renderer/lib/utils';
import { PlayCircle, Loader2, CheckCircle, XCircle, MapPin, Server } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Badge } from '@renderer/components/ui/badge';

const accountCardVariants = cva(
  "flex w-full flex-col items-start gap-4 rounded-lg border border-border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      status: {
        idle: "",
        loading: "animate-pulse",
        success: "border-green-500 bg-green-50",
        error: "border-red-500 bg-red-50",
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
  const handleJoinGame = () => {
    onJoinGame();
  };

  return (
    <div
      className={cn(
        accountCardVariants({ status: joinGameStatus }),
        isSelected ? 'ring-2 ring-ring bg-muted' : 'hover:bg-muted/50 transition-colors'
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
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
              {account.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-foreground">{account.displayName}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>#{account.id.slice(0, 8)}</span>
                <Badge variant="secondary">{account.group}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              @{account.username}
            </p>
          </div>

          {/* Stats */}
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>United States</span>
              </div>
              <div className="flex items-center gap-1">
                <Server className="h-4 w-4" />
                <span>124 ms</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="p-1 rounded hover:bg-muted"
              >
                <PlayCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={onDelete}
                className="p-1 rounded hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Join Game Button */}
      <div className="mt-4 w-full">
        <Button
                    variant={joinGameStatus === 'loading' ? 'outline' : 'default'}
                    size="sm"
                    onClick={handleJoinGame}
                    className="w-full"
                    disabled={joinGameStatus === 'loading'}
        >
          {joinGameStatus === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : joinGameStatus === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Joined!
            </>
          ) : joinGameStatus === 'error' ? (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Error
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Join Game
            </>
          )}
        </Button>
      </div>
    </div>
  );
});
AccountCard.displayName = 'AccountCard';