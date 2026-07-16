import * as React from 'react';
import Sidebar from './Sidebar';
import { TopBar } from './TopBar';

interface AppLayoutProps {
  children: React.ReactNode;
  hideUsernames: boolean;
  setHideUsernames: (v: boolean) => void;
  theme: any;
  setTheme: (t: any) => void;
  onOpenSettings: () => void;
  onAddAccount: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  hideUsernames,
  setHideUsernames,
  theme,
  setTheme,
  onOpenSettings,
  onAddAccount,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          hideUsernames={hideUsernames}
          setHideUsernames={setHideUsernames}
          theme={theme}
          setTheme={setTheme}
          onOpenSettings={onOpenSettings}
          onAddAccount={onAddAccount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

AppLayout.displayName = 'AppLayout';
