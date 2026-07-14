import { Button } from '@renderer/components/ui/button';
import { cn } from '@renderer/lib/utils';
import { PlusCircle, Trash2, EyeOff, AppWindow, Palette, Gamepad2, Shuffle } from 'lucide-react';
import { useUIStore } from '@renderer/store/useUIStore';

interface ActionBarProps {
  onAddAccount: () => void;
  onRemoveAccount: () => void;
  onLaunchApp: () => void;
  onEditTheme: () => void;
  onAccountControl: () => void;
  hideUsernames: boolean;
  onToggleHideUsernames: (value: boolean) => void;
  hasSelectedAccount: boolean;
}

export default function ActionBar({
  onAddAccount,
  onRemoveAccount,
  onLaunchApp,
  onEditTheme,
  onAccountControl,
  hideUsernames,
  onToggleHideUsernames,
  hasSelectedAccount,
}: ActionBarProps) {
  const jobIdShuffle = useUIStore((s) => s.jobIdShuffle);
  const toggleJobIdShuffle = useUIStore((s) => s.toggleJobIdShuffle);

  return (
    <div className="flex-shrink-0 border-t border-border/50 glass-bar px-4 py-3 flex flex-row items-center gap-3">
      <Button
        variant="default"
        onClick={onAddAccount}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
      >
        <PlusCircle className="h-4 w-4" />
        Agregar Cuenta
      </Button>

      <Button
        variant="outline"
        onClick={onRemoveAccount}
        disabled={!hasSelectedAccount}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
      >
        <Trash2 className="h-4 w-4 opacity-50" />
        Eliminar
      </Button>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={hideUsernames}
          onChange={(e) => onToggleHideUsernames(e.target.checked)}
          className="h-4 w-4 rounded border-border/60 bg-background"
        />
        Ocultar Usernames
      </label>

      <Button
        variant="outline"
        onClick={onLaunchApp}
        disabled={!hasSelectedAccount}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
      >
        <AppWindow className="h-4 w-4 opacity-50" />
        Abrir App
      </Button>

      <Button
        variant="ghost"
        onClick={onEditTheme}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
      >
        <Palette className="h-4 w-4" />
        Editar Tema
      </Button>

      <Button
        variant="ghost"
        onClick={onAccountControl}
        disabled={!hasSelectedAccount}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
      >
        <Gamepad2 className="h-4 w-4 opacity-50" />
        Control de Cuenta
      </Button>

      <Button
        variant="ghost"
        onClick={toggleJobIdShuffle}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
          jobIdShuffle && 'text-primary'
        )}
        title={jobIdShuffle ? 'JobId Shuffle activado — se unirá a un servidor aleatorio' : 'Activar JobId Shuffle'}
      >
        <Shuffle className={cn('h-4 w-4', jobIdShuffle ? 'text-primary' : 'opacity-50')} />
        Shuffle
      </Button>
    </div>
  );
}