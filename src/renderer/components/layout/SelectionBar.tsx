import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Square, Users, ChevronDown, ChevronUp, Layers, Trash2, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';
import { Account } from '@/types/Account';

/**
 * SelectionBar — popout flotante persistente (bottom-right) que muestra el set
 * de cuentas seleccionadas y ofrece acciones bulk: Launch All, Kill All, Clear,
 * y "Llevar a Servers/Games/Friends" para operarlas en las demás vistas.
 *
 * Vive solo cuando hay ≥1 cuenta en `selectedIds`. No se auto-dismiss.
 */
export const SelectionBar: React.FC = () => {
  const { t } = useTranslation();
  const selectedIds = useAccountStore((s) => s.selectedIds);
  const accounts = useAccountStore((s) => s.accounts);
  const clearSelection = useAccountStore((s) => s.clearSelection);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setSelectedPlaceId = useUIStore((s) => s.setSelectedPlaceId);
  const addNotification = useUIStore((s) => s.addNotification);

  const [expanded, setExpanded] = React.useState(false);

  const api = React.useMemo(
    () => (typeof window !== 'undefined' ? (window as any).api : null),
    []
  );

  const selectedAccounts: Account[] = React.useMemo(
    () => accounts.filter((a) => selectedIds.includes(a.id)),
    [accounts, selectedIds]
  );

  // Operaciones bulk ---------------------------------------------------------

  const launchAll = React.useCallback(async () => {
    if (selectedAccounts.length === 0) return;
    const placeId = window.prompt(
      t('selectionBar.promptPlace', 'Place ID (vacío = usar saved de cada cuenta):'),
      ''
    );
    if (placeId === null) return; // cancel
    const jobId = window.prompt(
      t('selectionBar.promptJob', 'Job ID (vacío = usar saved de cada cuenta):'),
      ''
    );
    if (jobId === null) return;

    const id = addNotification({
      type: 'loading',
      title: t('selectionBar.launching', 'Lanzando cuentas…'),
      message: `${selectedAccounts.length} ${t('common.accounts', 'cuentas')}`,
      durationMs: 0,
    });

    let okCount = 0;
    let errCount = 0;
    for (const acc of selectedAccounts) {
      const pId = placeId === '' ? acc.savedPlaceId : placeId;
      const jId = jobId === '' ? acc.savedJobId : jobId;
      try {
        const res = await api?.roblox?.launch?.(acc.id, pId, jId);
        if (res?.success !== false) okCount++;
        else errCount++;
      } catch {
        errCount++;
      }
    }

    useUIStore.getState().dismissNotification(id);
    addNotification({
      type: errCount === 0 ? 'success' : errCount === selectedAccounts.length ? 'error' : 'warning',
      title: t('selectionBar.launchDone', 'Lanzamiento completado'),
      message: `${okCount} ok, ${errCount} error`,
      durationMs: 5000,
    });
  }, [selectedAccounts, api, addNotification, t]);

  const killAll = React.useCallback(async () => {
    if (selectedAccounts.length === 0) return;
    if (!window.confirm(
      t('selectionBar.killConfirm', '¿Cerrar las instancias de Roblox de las cuentas seleccionadas?')
    )) return;
    try {
      const res = await api?.roblox?.killAll?.();
      const ok = res?.success !== false;
      addNotification({
        type: ok ? 'success' : 'error',
        title: ok
          ? t('selectionBar.killDone', 'Instancias cerradas')
          : t('selectionBar.killFailed', 'Error cerrando instancias'),
        durationMs: 4000,
      });
      if (ok) clearSelection();
    } catch {
      addNotification({
        type: 'error',
        title: t('selectionBar.killFailed', 'Error cerrando instancias'),
        durationMs: 4000,
      });
    }
  }, [selectedAccounts, api, addNotification, clearSelection, t]);

  const sendToServers = React.useCallback(() => {
    if (selectedAccounts.length === 0) return;
    // Para ir a Servers necesitamos un placeId. Si todas las cuentas comparten
    // el mismo savedPlaceId lo usamos; si no, pedimos uno.
    const uniquePlaceIds = new Set(
      selectedAccounts.map((a) => a.savedPlaceId).filter(Boolean)
    );
    let placeId: string | null = null;
    if (uniquePlaceIds.size === 1) {
      placeId = [...uniquePlaceIds][0] || null;
    } else {
      const input = window.prompt(
        t('selectionBar.promptPlaceForServers', 'Place ID para listar servers:'),
        ''
      );
      if (input === null) return;
      placeId = input.trim() || null;
    }
    if (placeId) setSelectedPlaceId(placeId);
    setActiveView('servers');
  }, [selectedAccounts, setActiveView, setSelectedPlaceId, t]);

  const sendToGames = React.useCallback(() => {
    if (selectedAccounts.length === 0) return;
    setActiveView('games');
  }, [selectedAccounts, setActiveView]);

  const sendToFriends = React.useCallback(() => {
    if (selectedAccounts.length === 0) return;
    setActiveView('friends');
  }, [selectedAccounts, setActiveView]);

  if (selectedAccounts.length === 0) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-bg-card/95 backdrop-blur-sm shadow-2xl pointer-events-auto"
      role="region"
      aria-label={t('selectionBar.title', 'Cuentas seleccionadas')}
    >
      {/* Header (siempre visible) */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary">
          <Layers className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {selectedAccounts.length} {t('selectionBar.selected', 'cuentas seleccionadas')}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {selectedAccounts.slice(0, 3).map((a) => a.displayName || a.username).join(', ')}
            {selectedAccounts.length > 3 && ` +${selectedAccounts.length - 3}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); clearSelection(); }}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-bg-surface transition-colors"
            aria-label={t('selectionBar.clear', 'Limpiar selección')}
            title={t('selectionBar.clear', 'Limpiar selección')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Chips de cuentas */}
            <div className="px-3 pb-2 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {selectedAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-full bg-bg-surface border border-border text-xs"
                    title={acc.username}
                  >
                    <div className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (acc.username?.charAt(0) || '?').toUpperCase()
                      )}
                    </div>
                    <span className="truncate max-w-[100px]">
                      {acc.displayName || acc.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones bulk */}
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
              <button
                onClick={launchAll}
                className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
              >
                <Play className="h-4 w-4" />
                {t('selectionBar.launchAll', 'Lanzar todas')}
              </button>
              <button
                onClick={killAll}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-error/40 text-error text-sm hover:bg-error/10 transition-colors"
              >
                <Square className="h-3.5 w-3.5" />
                {t('selectionBar.killAll', 'Cerrar todas')}
              </button>
              <button
                onClick={() => {
                  if (!window.confirm(t('selectionBar.removeConfirm', '¿Quitar estas cuentas de NexoAccManager?')))
                    return;
                  selectedAccounts.forEach((acc) => api?.account?.remove?.(acc.id));
                  clearSelection();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-muted-foreground text-sm hover:bg-bg-surface transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('selectionBar.remove', 'Eliminar')}
              </button>
            </div>

            {/* Navegación a otras vistas con la selección */}
            <div className="px-3 pb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                {t('selectionBar.sendTo', 'Llevar a:')}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={sendToServers}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors"
                  title={t('selectionBar.servers', 'Servers')}
                >
                  <Users className="h-3 w-3" />
                  {t('sidebar.nav.servers', 'Servers')}
                </button>
                <button
                  onClick={sendToGames}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors"
                  title={t('selectionBar.games', 'Games')}
                >
                  <Layers className="h-3 w-3" />
                  {t('sidebar.nav.games', 'Games')}
                </button>
                <button
                  onClick={sendToFriends}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors"
                  title={t('selectionBar.friends', 'Friends')}
                >
                  <Users className="h-3 w-3" />
                  {t('sidebar.nav.friends', 'Friends')}
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-3 pb-2 flex items-start gap-1.5 text-[10px] text-muted-foreground/80 border-t border-border pt-2 mx-3">
              <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>
                {t('selectionBar.disclaimer', 'La selección persiste al cambiar de vista. Operaciones en lote usan los Place/Job IDs guardados de cada cuenta salvo que especifiques uno.')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

SelectionBar.displayName = 'SelectionBar';
