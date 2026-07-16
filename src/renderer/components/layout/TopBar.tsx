import * as React from 'react';
import { Search, Settings as SettingsIcon, Moon, Sun, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  hideUsernames: boolean;
  setHideUsernames: (v: boolean) => void;
  theme: any;
  setTheme: (t: any) => void;
  onOpenSettings: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  hideUsernames,
  setHideUsernames,
  theme,
  setTheme,
  onOpenSettings,
  searchQuery,
  setSearchQuery,
}) => {
  const { t } = useTranslation();

  const handleThemeToggle = () => {
    const newTheme = theme?.theme === 'dark' ? 'light' : 'dark';
    setTheme({ theme: newTheme });
  };

  return (
    <header
      className="flex-shrink-0 flex h-14 items-center justify-between px-4 border-b border-border bg-background z-10"
      role="banner"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
          N
        </div>
        <span className="text-sm font-bold tracking-tight hidden sm:block">
          <span className="text-primary">Nexo</span>
          <span className="text-foreground">Acc</span>
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('topbar.search', 'Buscar cuentas...')}
            className="w-full h-9 pl-10 pr-4 rounded-md border border-border bg-bg-surface/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            aria-label={t('topbar.search', 'Buscar cuentas')}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideUsernames}
            onChange={(e) => setHideUsernames(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
            aria-label={t('topbar.hideUsernames', 'Ocultar usernames')}
          />
          <span className="hidden md:block">{t('topbar.hideUsernames', 'Ocultar')}</span>
        </label>

        <button
          onClick={handleThemeToggle}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-bg-surface rounded-md transition-colors"
          aria-label={t('topbar.toggleTheme', 'Cambiar tema')}
        >
          {theme?.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-bg-surface rounded-md transition-colors"
          aria-label={t('topbar.settings', 'Ajustes')}
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

TopBar.displayName = 'TopBar';
