import * as React from 'react';
import { NavLink } from 'react-router-dom';
import * as lucide from 'lucide-react';
import { useUIStore } from '@renderer/store/useUIStore';
import { cn } from '@renderer/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { toggleSidebar } = useUIStore();

  const navItems = [
    { name: 'accounts', icon: lucide.Users, route: '/accounts', label: 'Cuentas' },
    { name: 'servers', icon: lucide.Server, route: '/servers', label: 'Servers' },
    { name: 'presence', icon: lucide.Activity, route: '/presence', label: 'Presencia' },
    { name: 'settings', icon: lucide.Settings, route: '/settings', label: 'Ajustes' },
  ];

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-shrink-0 flex-col border-r border-border/50 bg-background/80 backdrop-blur-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20">
            <lucide.Gamepad2 className="h-4 w-4 text-white" />
          </div>
          <div className="text-lg font-bold tracking-tight">
            <span className="text-primary">Nexo</span>
            <span className="text-foreground">Acc</span>
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.route}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border-l-2 border-transparent'
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-border/30 pt-3">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground/60">
          <lucide.Shield className="h-3.5 w-3.5" />
          <span>v2.1.0 · 100% Local</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
