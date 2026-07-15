import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@renderer/components/layout/Sidebar';
import { cn } from '@renderer/lib/utils';
import { useUIStore } from '@renderer/store/useUIStore';

const AppShell: React.FC = () => {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-background">
      <div className={cn('flex-shrink-0', sidebarCollapsed ? 'w-16' : 'w-64')}>
        <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={useUIStore.getState().toggleSidebar} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AppShell;