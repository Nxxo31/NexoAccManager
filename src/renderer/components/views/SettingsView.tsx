import * as React from 'react';
import { Settings as SettingsIcon, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@renderer/store/useUIStore';

interface SettingsViewProps {
  onOpenModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenModal }) => {
  const { t } = useTranslation();
  const { savePasswords, setSavePasswords, disableAgingAlert, setDisableAgingAlert } = useUIStore();

  const handleToggleSavePasswords = React.useCallback(async (value: boolean) => {
    setSavePasswords(value);
    // Persist to settings via IPC
    try {
      const api = (window as any).api;
      if (api?.settings?.set) {
        await api.settings.set('savePasswords', value);
      }
    } catch (e) {
      console.error('Error persisting savePasswords:', e);
    }
  }, [setSavePasswords]);

  const handleToggleDisableAgingAlert = React.useCallback(async (value: boolean) => {
    setDisableAgingAlert(value);
    // Persist to settings via IPC
    try {
      const api = (window as any).api;
      if (api?.settings?.set) {
        await api.settings.set('disableAgingAlert', value);
      }
    } catch (e) {
      console.error('Error persisting disableAgingAlert:', e);
    }
  }, [setDisableAgingAlert]);

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

        {/* Save Passwords Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-card border border-border">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {t('views.settings.savePasswords', 'Guardar contraseñas')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('views.settings.savePasswordsDesc', 'Cifra y guarda contraseñas localmente para copiarlas después')}
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={savePasswords}
            aria-label={t('views.settings.savePasswords', 'Guardar contraseñas')}
            onClick={() => handleToggleSavePasswords(!savePasswords)}
            className={`relative w-11 h-6 rounded-full transition-colors ${savePasswords ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${savePasswords ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('views.settings.advanced', 'Avanzado')}
        </h3>

        {/* Disable Aging Alert Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-card border border-border">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {t('views.settings.disableAgingAlert', 'Desactivar alerta de antigüedad')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('views.settings.disableAgingAlertDesc', 'Desactivar las alertas de cuenta expirante')}
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={disableAgingAlert}
            aria-label={t('views.settings.disableAgingAlert', 'Desactivar alerta de antigüedad')}
            onClick={() => handleToggleDisableAgingAlert(!disableAgingAlert)}
            className={`relative w-11 h-6 rounded-full transition-colors ${disableAgingAlert ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${disableAgingAlert ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>
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