import * as React from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  Users,
  Settings,
  Server,
  Gamepad2,
  Plus,
  Shield,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  return (
    <aside className={`flex-shrink-0 w-[280px] border-r border-border transition-all duration-200 ${isCollapsed ? 'w-[72px]' : ''}`}>
      <div className="flex items-center justify-between h-12 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <LayoutDashboard className="h-3.5 w-3.5 text-white" />
          </div>
          <span className={cn('text-sm font-bold tracking-tight', { 'hidden': isCollapsed })}>
            <span className="text-primary">Nexo</span>
            <span className="text-foreground">Acc</span>
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-bg-surface"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 flex-col overflow-y-auto pb-4">
        <div className="px-4 pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Navegación</h3>
          <div className="mt-2 space-y-1">
            {/* Nav items */}
            <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-bg-surface hover:text-foreground transition-colors">
              <Users className="h-4 w-4" />
              <span className={cn('hidden', { 'inline-block': !isCollapsed })}>Cuentas</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-bg-surface hover:text-foreground transition-colors">
              <Server className="h-4 w-4" />
              <span className={cn('hidden', { 'inline-block': !isCollapsed })}>Servers</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-bg-surface hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
              <span className={cn('hidden', { 'inline-block': !isCollapsed })}>Ajustes</span>
            </button>
          </div>
        </div>
        <div className="px-4 pt-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Herramientas</h3>
          <div className="mt-2 space-y-1">
            <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-bg-surface hover:text-foreground transition-colors">
              <Plus className="h-4 w-4" />
              <span className={cn('hidden', { 'inline-block': !isCollapsed })}>Añadir cuenta</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-bg-surface hover:text-foreground transition-colors">
              <Shield className="h-4 w-4" />
              <span className={cn('hidden', { 'inline-block': !isCollapsed })}>Seguridad</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-bg-surface hover:text-foreground transition-colors">
              <Bot className="h-4 w-4" />
              <span className={cn('hidden', { 'inline-block': !isCollapsed })}>Automatización</span>
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
};

Sidebar.displayName = 'Sidebar';