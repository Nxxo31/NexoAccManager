import * as React from 'react';
import { Settings as SettingsIcon, KeyRound, Zap, Wifi, CopyCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@renderer/store/useUIStore';

interface SettingsViewProps {
  onOpenModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenModal }) => {
  const { t } = useTranslation();
  const {
    savePasswords, setSavePasswords,
    disableAgingAlert, setDisableAgingAlert,
    autoRelaunch, setAutoRelaunch,
    connectionWatcher, setConnectionWatcher,
    preventDuplicateInstances, setPreventDuplicateInstances,
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
      if (api?.settings?.setConnectionWatcher) await api.settings.setConnectionWatcher(value);
    } catch (e) { console.error('Error persisting connectionWatcher:', e); }
  }, [setConnectionWatcher, api]);

  const handleTogglePreventDuplicate = React.useCallback(async (value: boolean) => {
    setPreventDuplicateInstances(value);
    try {
      if (api?.settings?.setPreventDuplicateInstances) await api.settings.setPreventDuplicateInstances(value);
    } catch (e) { console.error('Error persisting preventDuplicateInstances:', e); }
  }, [setPreventDuplicateInstances, api]);

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
      <p className="text-muted-foreground">{t('views.settings.description', 'Configuración avanzada de la aplicación')}</p>

      {/* Security Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('views.settings.security', 'Seguridad')}
        </h3>
        <Toggle
          icon={<KeyRound className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.savePasswords', 'Guardar contraseñas')}
          desc={t('views.settings.savePasswordsDesc', 'Cifra y guarda contraseñas localmente para copiarlas después')}
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
          label={t('views.settings.disableAgingAlert', 'Desactivar alerta de antigüedad')}
          desc={t('views.settings.disableAgingAlertDesc', 'Desactivar las alertas de cuenta expirante')}
          value={disableAgingAlert}
          onToggle={handleToggleDisableAgingAlert}
          ariaKey="toggle-disable-aging"
        />
      </div>

      {/* Instance Management */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('views.settings.instanceManagement', 'Gestión de instancias')}
        </h3>
        <Toggle
          icon={<Zap className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.autoRelaunch', 'Auto-relanzar cuentas')}
          desc={t('views.settings.autoRelaunchDesc', 'Relanzar automáticamente cuentas que se desconecten')}
          value={autoRelaunch}
          onToggle={handleToggleAutoRelaunch}
          ariaKey="toggle-auto-relaunch"
        />
        <Toggle
          icon={<Wifi className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.connectionWatcher', 'Monitor de conexión')}
          desc={t('views.settings.connectionWatcherDesc', 'Monitorear conexiones activas de Roblox en tiempo real')}
          value={connectionWatcher}
          onToggle={handleToggleConnectionWatcher}
          ariaKey="toggle-connection-watcher"
        />
        <Toggle
          icon={<CopyCheck className="h-5 w-5 text-muted-foreground" />}
          label={t('views.settings.preventDuplicateInstances', 'Prevenir instancias duplicadas')}
          desc={t('views.settings.preventDuplicateInstancesDesc', 'Evitar lanzar la misma cuenta dos veces simultáneamente')}
          value={preventDuplicateInstances}
          onToggle={handleTogglePreventDuplicate}
          ariaKey="toggle-prevent-duplicate"
        />
      </div>

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