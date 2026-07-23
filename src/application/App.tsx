// Application: App shell — Master-Detail layout

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from './store/uiStore';
import { useAccountStore } from './store/accountStore';
import { useAccounts } from './hooks/useAccounts';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { ContentArea, type ViewContext } from './layout/ContentArea';
import { NotificationBar } from './components/NotificationBar';
import { AddAccountModal } from './components/AddAccountModal';
import './i18n';

type Theme = 'dark' | 'light';

export function App(): JSX.Element {
  const activeView = useUIStore((s) => s.activeView);
  const accounts = useAccountStore((s) => s.accounts);
  const { loadAccounts, loginBrowser } = useAccounts();
  const [theme, setTheme] = useState<Theme>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const context: ViewContext = { searchQuery, accounts };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <Sidebar accountCount={accounts.length} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onAddAccount={() => setShowAddModal(true)}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
        <NotificationBar />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="flex-1 overflow-hidden"
          >
            <ContentArea activeView={activeView} context={context} />
          </motion.div>
        </AnimatePresence>
      </div>
      <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} onLoginBrowser={loginBrowser} />
    </div>
  );
}
