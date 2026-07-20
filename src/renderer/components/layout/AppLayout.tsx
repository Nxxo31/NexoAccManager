import * as React from 'react';
import Sidebar from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationBar } from './NotificationBar';
import { SelectionBar } from './SelectionBar';

interface AppLayoutProps {
  children: React.ReactNode;
  theme: any;
  setTheme: (t: any) => void;
  onOpenSettings: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  theme,
  setTheme,
  onOpenSettings,
}) => {
  return (
    <>
      <NotificationBar />
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            theme={theme}
            setTheme={setTheme}
            onOpenSettings={onOpenSettings}
          />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
      {/* Popout flotante de cuentas seleccionadas — interconecta las vistas */}
      <SelectionBar />
    </>
  );
};

AppLayout.displayName = 'AppLayout';