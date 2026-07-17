import * as React from 'react';
import {
  Settings as SettingsIcon,
  KeyRound,
  Zap,
  Wifi,
  CopyCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@renderer/store/useUIStore';

interface SettingsViewProps {
  onOpenModal: () => void;
  onKillAll?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenModal, onKillAll }) => {
  const { t } = useTranslation();
  const {
    savePasswords, setSavePasswords,
    disableAgingAlert, setDisableAgingAlert,
    autoRelaunch, setAutoRelaunch,
    connectionWatcher, setConnectionWatcher,
    preventDuplicateInstances, setPreventDuplicateInstances,
    bottingMode, setBottingMode,
    bottingInterval, setBottingInterval,
  } = useUIStore();

  const api = React.useMemo(() => (typeof window !== 'undefined' ? (window as any).api : null), []);

  const handleToggleSavePasswords = React.useCallback(async (value: boolean) => {
    setSavePasswords(value);
    try {
      if (api?.settings?.set) await api.settings.set('savePasswords', value);
    } catch (e) { console.error('Error persisting savePasswords:', e); }
  }, [setSavePasswords, api]);

  const handleToggleDisableAgingAlert = React.useCallback(async (value: boolean) => {
    setDisableAgingAlert(value);
    try {
      if (api?.settings?.set) await api.settings.set('disableAgingAlert', value);
    } catch (e) { console.error('Error persisting disableAgingAlert:', e); }
  }, [setDisableAgingAlert, api]);

  const handleToggleAutoRelaunch = React.useCallback(async (value: boolean) => {
    setAutoRelaunch(value);
    try {
      if (api?.settings?.set) await api.settings.set('autoRelaunch', value);
    } catch (e) { console.error('Error persisting autoRelaunch:', e); }
  }, [setAutoRelaunch, api]);

  const handleToggleConnectionWatcher = React.useCallback(async (value: boolean) => {
    setConnectionWatcher(value);
    try {
      if (api?.settings?.set) await api.settings.set('connectionWatcher', value);
    } catch (e) { console.error('Error persisting connectionWatcher:', e); }
  }, [setConnectionWatcher, api]);

  const handleTogglePreventDuplicate = React.useCallback(async (value: boolean) => {
    setPreventDuplicateInstances(value);
    try {
      if (api?.settings?.set) await api.settings.set('preventDuplicateInstances', value);
    } catch (e) { console.error('Error persisting preventDuplicateInstances:', e); }
  }, [setPreventDuplicateInstances, api]);

  const handleToggleBottingMode = React.useCallback(async (value: boolean) => {
    setBottingMode(value);
    try {
      if (api?.settings?.set) await api.settings.set('bottingMode', value);
    } catch (e) { console.error('Error persisting bottingMode:', e); }
  }, [setBottingMode, api]);

  const handleToggleBottingInterval = React.useCallback(async (value: number) => {
    setBottingInterval(value);
    try {
      if (api?.settings?.set) await api.settings.set('bottingInterval', value);
    } catch (e) { console.error('Error persisting bottingInterval:', e); }
  }, [setBottingInterval, api]);

  const Toggle: React.FC<{
    icon: React.ReactNode;
    label: string;
    desc: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    ariaKey: string;
  }> = ({ icon, label, desc, value, onToggle, ariaKey }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-card border border-border">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onToggle(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-border'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`}
        />
      </button>
      <span className="sr-only">{ariaKey}</span>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.settings.title', 'Ajustes')}</h2>
      </div>
      <p className="text-muted-foreground">{t('views.settings.description', 'Configuracion avanzada de la aplicacion')}</p>

      {/* Security Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('views.settings.security', 'Seguridad')}
        </h3>
        <Toggle
          icon={<KeyRound className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.savePasswords', 'Guardar contrasenas')}
          desc={t('views.settings.savePasswordsDesc', 'Cifra y guarda contrasenas localmente')}
          value={savePasswords}
          onToggle={handleToggleSavePasswords}
          ariaKey="toggle-save-passwords"
        />
      </div>

      {/* Advanced Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('views.settings.advanced', 'Avanzado')}
        </h3>
        <Toggle
          icon={<KeyRound className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.disableAgingAlert', 'Desactivar alerta de antiguedad')}
          desc={t('views.settings.disableAgingAlertDesc', 'Desactivar las alertas de cuenta expirante')}
          value={disableAgingAlert}
          onToggle={handleToggleDisableAgingAlert}
          ariaKey="toggle-disable-aging"
        />
      </div>

      {/* Instance Management */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('views.settings.instanceManagement', 'Gestion de instancias')}
        </h3>
        <Toggle
          icon={<Zap className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.autoRelaunch', 'Auto-relanzar cuentas')}
          desc={t('views.settings.autoRelaunchDesc', 'Relanzar automaticamente cuentas desconectadas')}
          value={autoRelaunch}
          onToggle={handleToggleAutoRelaunch}
          ariaKey="toggle-auto-relaunch"
        />
        <Toggle
          icon={<Wifi className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.connectionWatcher', 'Monitor de conexion')}
          desc={t('views.settings.connectionWatcherDesc', 'Monitorear conexiones Roblox en tiempo real')}
          value={connectionWatcher}
          onToggle={handleToggleConnectionWatcher}
          ariaKey="toggle-connection-watcher"
        />
        <Toggle
          icon={<CopyCheck className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.preventDuplicateInstances', 'Prevenir instancias duplicadas')}
          desc={t('views.settings.preventDuplicateInstancesDesc', 'Evitar lanzar la misma cuenta dos veces')}
          value={preventDuplicateInstances}
          onToggle={handleTogglePreventDuplicate}
          ariaKey="toggle-prevent-duplicate"
        />
        <Toggle
          icon={<AlertTriangle className="h-5 w-5 text-error" />}
          label={t('views.settings.bottingMode', 'Modo de botting')}
          desc={t('views.settings.bottingModeDesc', 'Rejoins automaticos con timers - USAR BAJO PROPIO RIESGO (puede resultar en bans)')}
          value={bottingMode}
          onToggle={handleToggleBottingMode}
          ariaKey="toggle-botting-mode"
        />
        {/* Botting interval — numeric input, not a toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-card border border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t('views.settings.bottingInterval', 'Intervalo de botting')}</p>
              <p className="text-xs text-muted-foreground">{t('views.settings.bottingIntervalDesc', 'Minutos entre rejoins automaticos')}</p>
            </div>
          </div>
          <input
            type="number"
            min={1}
            max={120}
            value={bottingInterval}
            onChange={(e) => handleToggleBottingInterval(Math.max(1, parseInt(e.target.value, 10) || 5))}
            className="w-16 px-2 py-1 text-sm rounded bg-bg-surface border border-border text-center focus:outline-none focus:border-primary"
            aria-label={t('views.settings.bottingInterval', 'Intervalo de botting')}
          />
        </div>
      </div>

      {/* Kill All Instances — moved from JoinBar */}
      {onKillAll && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('views.settings.dangerZone', 'Zona peligrosa')}
          </h3>
          <button
            onClick={onKillAll}
            className="flex items-center gap-2 w-full p-3 rounded-lg border border-error/40 bg-error/10 hover:bg-error/20 transition-colors"
            aria-label={t('views.settings.killAll', 'Cerrar todas las instancias')}
          >
            <AlertTriangle className="h-5 w-5 text-error" />
            <div className="text-left">
              <p className="text-sm font-medium text-error">{t('views.settings.killAll', 'Cerrar todas las instancias')}</p>
              <p className="text-xs text-muted-foreground">{t('views.settings.killAllDesc', 'Cierra todos los procesos de Roblox activos')}</p>
            </div>
          </button>
        </div>
      )}

      {/* Open Settings Panel */}
      <button
        onClick={onOpenModal}
        className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary-dark transition-colors"
      >
        {t('views.settings.openPanel', 'Abrir panel de ajustes')}
      </button>
    </div>
  );
};

SettingsView.displayName = 'SettingsView';
