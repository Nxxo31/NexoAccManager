import * as React from 'react';
import {
  Settings as SettingsIcon,
  Gamepad2,
} from 'lucide-react';

interface HeaderProps {
  accountsLength: number;
  hideUsernames: boolean;
  setHideUsernames: (checked: boolean) => void;
  theme: any; // Theme object from context
  setTheme: (theme: Partial<any>) => void;
  setActiveModal: (modal: 'servers' | 'settings' | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  accountsLength,
  hideUsernames,
  setHideUsernames,
  theme,
  setTheme,
  setActiveModal,
}) => {
  return (
    <header className="flex-shrink-0 flex items-center justify-between h-12 px-4 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <Gamepad2 className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">
          <span className="text-primary">Nexo</span>
          <span className="text-foreground">Acc</span>
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          {accountsLength > 0 ? `${accountsLength}/50` : '0/50'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {/* Hide Usernames checkbox */}
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={hideUsernames}
            onChange={(e) => setHideUsernames(e.target.checked)}
            className="h-3 w-3 rounded border-border"
            aria-label="Ocultar nombres de usuario"
          />
          <span>Ocultar</span>
        </label>
        {/* Theme toggle (Ajustes) */}
        <button
          onClick={() => {
            const newTheme = theme?.theme === 'dark' ? 'light' : 'dark';
            setTheme({ theme: newTheme });
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:bg-bg-surface rounded-md transition-all-150"
          aria-label="Cambiar tema"
        >
          <SettingsIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Cambiar tema</span>
        </button>
      </div>
    </header>
  );
};

Header.displayName = 'Header';