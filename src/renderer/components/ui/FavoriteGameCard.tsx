import * as React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FavoriteGameCardProps {
  game: any;
  t: ReturnType<typeof useTranslation>;
}

export const FavoriteGameCard: React.FC<FavoriteGameCardProps> = ({ game, t }) => {
  const timeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
        {game.icon ? (
          <img src={game.icon} alt={game.name} className="w-10 h-10 object-cover" />
        ) : (
          <div className="text-xs font-medium">
            {game.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between w-full">
          <h4 className="text-sm font-medium truncate">{game.name}</h4>
          <time className="text-xs text-muted-foreground">{timeAgo(new Date(game.addedAt))}</time>
        </div>
      </div>
    </div>
  );
};

FavoriteGameCard.displayName = 'FavoriteGameCard';
