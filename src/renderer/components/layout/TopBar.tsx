import * as React from 'react';
import { Moon, Sun, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  theme: any;
  setTheme: (t: any) => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  theme,
  setTheme,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const isDark = theme?.theme === 'dark';

  return (
    <div className="flex h-12 items-center justify-between px-4 bg-bg-surface/50 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-2">
        {/* Theme toggle button */}
        <button
          onClick={() => {
            const newTheme = theme?.theme === 'dark' ? 'light' : 'dark';
            setTheme({ ...(theme || {}), theme: newTheme });
          }}
          className="p-2 rounded hover:bg-bg-elevated transition-colors text-muted-foreground hover:text-foreground"
          aria-label={t('theme.toggle', 'Cambiar tema')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded hover:bg-bg-elevated transition-colors text-muted-foreground hover:text-foreground"
          aria-label={t('settings', 'Configuración')}
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

TopBar.displayName = 'TopBar';