import * as React from 'react';
import { Server, Search, User, Layers, Share2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';

export const ServerView: React.FC = () => {
  const { t } = useTranslation();
  const [playerSearch, setPlayerSearch] = React.useState('');
  const [searchResult, setSearchResult] = React.useState<string | null>(null);
  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  // Interconexión: leer selección múltiple + placeId (si viene de GamesView/SelectionBar)
  const selectedIds = useAccountStore((s) => s.selectedIds);
  const selectedPlaceId = useUIStore((s) => s.selectedPlaceId);
  const addNotification = useUIStore((s) => s.addNotification);

  const hasMultiSelection = selectedIds.length >= 2;

  const [distributePlaceId, setDistributePlaceId] = React.useState<string>('');
  const [distributing, setDistributing] = React.useState(false);

  // Si viene un selectedPlaceId de la SelectionBar/GamesView, pre-rellenar
  React.useEffect(() => {
    if (selectedPlaceId) setDistributePlaceId(selectedPlaceId);
  }, [selectedPlaceId]);

  const handleDistribute = React.useCallback(async () => {
    const placeId = distributePlaceId.trim();
    if (!placeId || !/^\d{1,20}$/.test(placeId)) {
      addNotification({
        type: 'warning',
        title: t('views.servers.placeIdRequired', 'Place ID requerido'),
        message: t('views.servers.placeIdRequiredDesc', 'Introduce un Place ID numérico válido'),
      });
      return;
    }
    if (selectedIds.length < 2) {
      addNotification({
        type: 'info',
        title: t('views.servers.selectAccountsFirst', 'Selecciona cuentas'),
        message: t('views.servers.selectAccountsFirstDesc', 'Marca al menos 2 cuentas en el Sidebar'),
      });
      return;
    }
    setDistributing(true);
    const id = addNotification({
      type: 'loading',
      title: t('views.servers.distributing', 'Distribuyendo cuentas…'),
      message: `${selectedIds.length} ${t('common.accounts', 'cuentas')}`,
      durationMs: 0,
    });
    try {
      const res = await api?.roblox?.distributeAccounts?.(placeId, selectedIds);
      useUIStore.getState().dismissNotification(id);
      if (res?.success !== false) {
        const data = res?.data || {};
        const okCount = Object.values(data).filter((v: any) => v === true).length;
        const failCount = Object.keys(data).length - okCount;
        addNotification({
          type: okCount > 0 ? 'success' : 'error',
          title: t('views.servers.distributed', 'Distribución completada'),
          message: `${okCount} ok · ${failCount} fallaron`,
          durationMs: 5000,
        });
      } else {
        addNotification({
          type: 'error',
          title: t('views.servers.distributeFailed', 'Error distribuyendo'),
          message: res?.error || '',
          durationMs: 5000,
        });
      }
    } catch (e) {
      useUIStore.getState().dismissNotification(id);
      addNotification({
        type: 'error',
        title: t('views.servers.distributeFailed', 'Error distribuyendo'),
        message: (e as Error).message,
        durationMs: 5000,
      });
    } finally {
      setDistributing(false);
    }
  }, [distributePlaceId, selectedIds, api, addNotification, t]);

  // 4.5 — Player Finder: search by username
  const handlePlayerSearch = React.useCallback(async () => {
    if (!playerSearch.trim() || !api) return;
    try {
      const result = await api.roblox?.searchUser?.(playerSearch.trim());
      if (result?.success && result.data) {
        setSearchResult(`${result.data.name} (ID: ${result.data.id})`);
      } else {
        setSearchResult('Usuario no encontrado');
      }
    } catch {
      setSearchResult('Error en la búsqueda');
    }
  }, [playerSearch, api]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Server className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.servers.title', 'Servidores')}</h2>
      </div>

      {/* Banner multi-selección + Distribuir entre servers */}
      {hasMultiSelection && (
        <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Layers className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground">
              <p className="font-medium text-primary">
                {t('views.servers.multiMode', 'Distribución multi-cuenta')}
              </p>
              <p className="text-muted-foreground">
                {t(
                  'views.servers.multiModeDesc',
                  '{{count}} cuentas seleccionadas. Repártelas entre distintos servidores del mismo juego.',
                  { count: selectedIds.length }
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={distributePlaceId}
              onChange={(e) => setDistributePlaceId(e.target.value)}
              placeholder={t('views.servers.placeIdPlaceholder', 'Place ID (numérico)')}
              className="flex-1 h-9 px-3 rounded-md border border-border bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label={t('views.servers.placeIdPlaceholder', 'Place ID')}
            />
            <button
              onClick={handleDistribute}
              disabled={distributing || !/^\d{1,20}$/.test(distributePlaceId.trim())}
              className="flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              aria-label={t('views.servers.distribute', 'Distribuir')}
            >
              <Share2 className="h-3.5 w-3.5" />
              {t('views.servers.distribute', 'Distribuir')}
            </button>
          </div>
          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground/80">
            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <span>
              {t(
                'views.servers.distributeWarn',
                'El backend usa la cookie del primer accountId para enumerar servers y luego reparte jobIds entre las demás cuentas. Asegúrate de que todas las cuentas tienen cookies válidas.'
              )}
            </span>
          </div>
        </div>
      )}

      {/* Player Finder (4.5) */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-card border border-border">
        <User className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePlayerSearch(); }}
          placeholder={t('views.servers.playerFinder', 'Buscar jugador por username...')}
          className="flex-1 h-8 px-2.5 rounded-md border border-border bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={t('views.servers.playerFinder', 'Buscar jugador')}
        />
        <button
          onClick={handlePlayerSearch}
          disabled={!playerSearch.trim()}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
          aria-label={t('views.servers.search', 'Buscar')}
        >
          <Search className="h-3.5 w-3.5" />
          {t('views.servers.search', 'Buscar')}
        </button>
        {searchResult && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{searchResult}</span>
        )}
      </div>

    </div>
  );
};

ServerView.displayName = 'ServerView';