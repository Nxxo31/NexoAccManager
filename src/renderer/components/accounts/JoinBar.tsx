import * as React from 'react';
import { Shuffle, LogIn, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@renderer/store/useUIStore';

interface JoinBarProps {
  placeId: string;
  jobId: string;
  onPlaceIdChange: (v: string) => void;
  onJobIdChange: (v: string) => void;
  onJoin: () => void;
  onKillAll: () => void;
}

export const JoinBar: React.FC<JoinBarProps> = ({
  placeId,
  jobId,
  onPlaceIdChange,
  onJobIdChange,
  onJoin,
  onKillAll,
}) => {
  const { t } = useTranslation();
  const jobIdShuffle = useUIStore((s) => s.jobIdShuffle);
  const toggleJobIdShuffle = useUIStore((s) => s.toggleJobIdShuffle);

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-surface/30 flex-shrink-0">
      {/* Place ID */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {t('joinbar.placeId', 'Place ID')}
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={placeId}
          onChange={(e) => onPlaceIdChange(e.target.value)}
          placeholder="0"
          className="w-32 h-8 px-2.5 rounded-md border border-border bg-bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          aria-label={t('joinbar.placeId', 'Place ID')}
        />
      </div>

      {/* Job ID */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {t('joinbar.jobId', 'Job ID')}
        </label>
        <input
          type="text"
          value={jobId}
          onChange={(e) => onJobIdChange(e.target.value)}
          placeholder={t('joinbar.jobIdOptional', 'Opcional')}
          className="w-40 h-8 px-2.5 rounded-md border border-border bg-bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          aria-label={t('joinbar.jobId', 'Job ID')}
        />
      </div>

      {/* Shuffle toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1">
        <button
          onClick={toggleJobIdShuffle}
          className={`flex items-center gap-1 px-2 h-8 rounded-md text-xs font-medium transition-colors ${
            jobIdShuffle
              ? 'bg-accent/20 text-accent border border-accent/40'
              : 'text-muted-foreground border border-border hover:bg-bg-elevated'
          }`}
          aria-pressed={jobIdShuffle}
          aria-label={t('joinbar.shuffle', 'Barajar')}
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span>{t('joinbar.shuffle', 'Barajar')}</span>
        </button>
      </label>

      <div className="flex-1" />

      {/* Kill All */}
      <button
        onClick={onKillAll}
        className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-error border border-error/30 hover:bg-error/10 transition-colors"
        aria-label={t('joinbar.killAll', 'Cerrar todas')}
        title={t('joinbar.killAllTitle', 'Cierra todas las instancias de Roblox')}
      >
        <XCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('joinbar.killAll', 'Cerrar todas')}</span>
      </button>

      {/* Join */}
      <button
        onClick={onJoin}
        disabled={!placeId.trim()}
        className="flex items-center gap-1.5 px-4 h-8 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={t('joinbar.join', 'Unirse al servidor')}
      >
        <LogIn className="h-3.5 w-3.5" />
        <span>{t('joinbar.join', 'Unirse')}</span>
      </button>
    </div>
  );
};

JoinBar.displayName = 'JoinBar';
