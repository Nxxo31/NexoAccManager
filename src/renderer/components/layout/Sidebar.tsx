import * as React from 'react';
import { NavLink } from 'react-router-dom';
import * as lucide from 'lucide-react';
import { useUIStore } from '@renderer/store/useUIStore';
import { cn } from '@renderer/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { activeView, toggleSidebar } = useUIStore();
  
  const navItems = [
    { name: 'accounts', icon: lucide.Users, route: '/accounts', label: 'Cuentas' },
    { name: 'servers', icon: lucide.Server, route: '/servers', label: 'Servers' },
    { name: 'presence', icon: lucide.Activity, route: '/presence', label: 'Presence' },
    { name: 'settings', icon: lucide.Settings, route: '/settings', label: 'Settings' },
  ];

  return (
    <aside className={cn('flex h-full w-64 flex-shrink-0 flex-col border-r', 'bg-background/50 backdrop-blur-sm', className)}>
      <div className="flex h-16 items-center justify-between px-4">
        <div className="text-xl font-semibold text-primary">NexoAcc</div>
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded hover:bg-accent/20"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <nav className="mt-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.route}
            className={({ isActive }) => 
              cn(
                'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent/50'
              )
            }
            end
          >
            <span className="flex items-center gap-3">
              {React.createElement(item.icon, { className: 'h-4 w-4' })}
              <span>{item.label}</span>
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;