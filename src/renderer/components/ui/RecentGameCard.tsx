import * as React from 'react';
import { Image, Info, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface RecentGameCardProps {
  game: any;
  t: ReturnType<typeof useTranslation>;
}

export const RecentGameCard: React.FC<RecentGameCardProps> = ({ game, t }) => {
  const timeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
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
          <time className="text-xs text-muted-foreground">{timeAgo(new Date(game.lastPlayed))}</time>
        </div>
        {game.placeName && game.placeName !== game.name && (
          <p className="text-xs text-muted-foreground truncate">{game.placeName}</p>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        <Info className="h-3 w-3 me-1" /> {game.placeId}
      </div>
    </div>
  );
};

RecentGameCard.displayName = 'RecentGameCard';
