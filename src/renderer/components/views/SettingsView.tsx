import * as React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountActions } from '@renderer/hooks/useAccountActions';

interface SettingsViewProps {
  onOpenModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenModal }) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.settings.title', 'Ajustes')}</h2>
      </div>
      <p className="text-muted-foreground mb-4">{t('views.settings.description', 'Configuración avanzada de la aplicación')}</p>
      <button onClick={onOpenModal}
        className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary-dark transition-colors">
        {t('views.settings.openPanel', 'Abrir panel de ajustes')}
      </button>
    </div>
  );
};

SettingsView.displayName = 'SettingsView';
