import * as React from 'react';
import Sidebar from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationBar } from './NotificationBar';
import { SelectionBar } from './SelectionBar';
import { AnimatePresence, motion } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
  theme: any;
  setTheme: (t: any) => void;
  onOpenSettings: () => void;
  activeView: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  theme,
  setTheme,
  onOpenSettings,
  activeView,
}) => {
  return (
    <>
      <NotificationBar />
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <AnimatePresence mode="wait">
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar
              theme={theme}
              setTheme={setTheme}
              onOpenSettings={onOpenSettings}
            />
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </AnimatePresence>
      </div>
      {/* Popout flotante de cuentas seleccionadas — interconecta las vistas */}
      <SelectionBar />
    </>
  );
};

AppLayout.displayName = 'AppLayout';