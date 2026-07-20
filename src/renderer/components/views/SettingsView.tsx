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

// Preset accent colors. User can also pick arbitrary hex via native color input.
const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: 'Nexo Purple', value: '#6347FF' },
  { name: 'Roblox Red', value: '#DE350D' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Pink', value: '#EC4899' },
];

const AccentColorPicker: React.FC<{ api: any; t: any }> = ({ api, t }) => {
  const [accent, setAccent] = React.useState<string>(() => {
    if (typeof window === 'undefined') return '#6347FF';
    return (window as any).__nxAccentColor || '#6347FF';
  });

  const applyAccent = React.useCallback(async (hex: string) => {
    setAccent(hex);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent', hex);
      document.documentElement.style.setProperty('--primary', hex);
      // Derived shades (naive but good enough without a full color lib)
      document.documentElement.style.setProperty('--primary-dark', shade(hex, -20));
      document.documentElement.style.setProperty('--primary-light', shade(hex, 20));
      (window as any).__nxAccentColor = hex;
    }
    try {
      if (api?.settings?.set) await api.settings.set('accentColor', hex);
      if (api?.theme?.set) await api.theme.set({ accent: hex });
    } catch (e) {
      console.error('Error persisting accent color:', e);
    }
  }, [api]);

  React.useEffect(() => {
    // Load persisted accent on mount
    (async () => {
      try {
        if (api?.settings?.get) {
          const r = await api.settings.get('accentColor');
          if (r?.success && r.data) applyAccent(r.data);
          else if (typeof r === 'string') applyAccent(r);
        }
      } catch { /* ignore */ }
    })();
  }, [api, applyAccent]);

  return (
    <div className="p-3 rounded-lg bg-bg-card border border-border space-y-3">
      <div>
        <p className="text-sm font-medium">{t('views.settings.accentColor', 'Color de acento')}</p>
        <p className="text-xs text-muted-foreground">{t('views.settings.accentColorDesc', 'Personaliza el color primario de la interfaz')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => applyAccent(preset.value)}
            aria-label={preset.name}
            title={preset.name}
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${accent.toLowerCase() === preset.value.toLowerCase() ? 'border-foreground' : 'border-transparent'}`}
            style={{ backgroundColor: preset.value }}
          />
        ))}
        <label
          className="relative w-7 h-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
          aria-label={t('views.settings.customColor', 'Color personalizado')}
          title={t('views.settings.customColor', 'Color personalizado')}
        >
          <input
            type="color"
            value={accent}
            onChange={(e) => applyAccent(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">+</span>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t('views.settings.current', 'Actual')}:</span>
        <code className="text-xs px-1.5 py-0.5 rounded bg-bg-surface border border-border">{accent}</code>
        <button
          onClick={() => applyAccent('#6347FF')}
          className="text-xs text-primary hover:underline ml-auto"
          aria-label={t('views.settings.reset', 'Restablecer')}
        >
          {t('views.settings.reset', 'Restablecer')}
        </button>
      </div>
    </div>
  );
};

// Mix hex with white (positive) or black (negative) by `amt` percent.
function shade(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  const f = amt / 100;
  if (f >= 0) {
    r = Math.round(r + (255 - r) * f);
    g = Math.round(g + (255 - g) * f);
    b = Math.round(b + (255 - b) * f);
  } else {
    r = Math.round(r * (1 + f));
    g = Math.round(g * (1 + f));
    b = Math.round(b * (1 + f));
  }
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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

      {/* Appearance — custom accent color */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('views.settings.appearance', 'Apariencia')}
        </h3>
        <AccentColorPicker api={api} t={t} />
      </div>

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
