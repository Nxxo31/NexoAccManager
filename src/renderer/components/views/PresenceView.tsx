import * as React from 'react';
import { Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';

export const PresenceView: React.FC = () => {
  const { t } = useTranslation();
  const accounts = useAccountStore((s) => s.accounts);

  const presenceLabel = (acc: any): string => {
    const p = acc?.presence;
    if (!p) return t('presence.offline', 'Desconectado');
    switch (p.userPresenceType) {
      case 0: return t('presence.offline', 'Desconectado');
      case 1: return t('presence.online', 'En línea');
      case 2: return t('presence.inGame', 'En juego');
      case 3: return t('presence.inStudio', 'En Studio');
      case 4: return t('presence.hidden', 'Oculto');
      default: return t('presence.offline', 'Desconectado');
    }
  };

  const presenceColor = (acc: any): string => {
    const p = acc?.presence?.userPresenceType;
    switch (p) {
      case 1: return '#2ED573';
      case 2: return '#6347FF';
      case 3: return '#FFA502';
      case 4: return '#4A4D52';
      default: return '#8A8F98';
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.presence.title', 'Presencia')}</h2>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        {t('views.presence.description', 'Estado en tiempo real de tus cuentas')}
      </p>
      {accounts.length === 0 ? (
        <p className="text-muted-foreground">{t('accounts.empty', 'No hay cuentas')}</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {accounts.map((acc: any) => (
            <div
              key={acc.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card hover:bg-bg-surface/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                {acc.avatarUrl ? (
                  <img src={acc.avatarUrl} alt={acc.username} className="w-full h-full object-cover" />
                ) : (
                  acc.username?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{acc.username}</p>
                <p className="text-xs text-muted-foreground truncate">{presenceLabel(acc)}</p>
                {acc?.presence?.lastLocation && (
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {acc.presence.lastLocation}
                  </p>
                )}
              </div>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: presenceColor(acc) }}
                aria-label={presenceLabel(acc)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

PresenceView.displayName = 'PresenceView';
