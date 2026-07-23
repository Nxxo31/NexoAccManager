// Application: App shell — Master-Detail layout

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from './store/uiStore';
import { useAccountStore } from './store/accountStore';
import { useAccounts } from './hooks/useAccounts';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { ContentArea, type ViewContext } from './layout/ContentArea';
import { AddAccountModal } from './components/AddAccountModal';
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import './i18n';

export function App(): JSX.Element {
  const activeView = useUIStore((state) => state.activeView);
  const accounts = useAccountStore((state) => state.accounts);
  const { loadAccounts, loginBrowser } = useAccounts();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark' || (colorScheme === 'auto' && useMediaQuery('(prefers-color-scheme: dark)'));
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const bgColor = isDark ? theme.colors.black[0] : theme.colors.white[0];
  const textColor = isDark ? theme.colors.white[0] : theme.colors.black[0];

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const context: ViewContext = { searchQuery, accounts };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans"
      style={{ background: bgColor, color: textColor }}>
      <Sidebar accountCount={accounts.length} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          onAddAccount={() => setShowAddModal(true)}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
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