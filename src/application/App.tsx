// Application: App shell — Master-Detail layout with Sidebar, TopBar, ContentArea

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from './store/uiStore';
import { useAccounts } from './hooks/useAccounts';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { ContentArea } from './layout/ContentArea';
import { NotificationBar } from './components/NotificationBar';
import { applyTheme, type ThemeId } from '../infrastructure/external/ThemeService';
import './i18n';

export function App(): JSX.Element {
  const activeView = useUIStore((s) => s.activeView);
  const { loadAccounts, accounts } = useAccounts();
  const [theme, setTheme] = useState<ThemeId>('dark');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif', background: 'var(--bg)' }}>
      <Sidebar accountCount={accounts.length} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <TopBar theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        <NotificationBar />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ flex: 1, overflow: 'hidden' }}
          >
            <ContentArea activeView={activeView} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
