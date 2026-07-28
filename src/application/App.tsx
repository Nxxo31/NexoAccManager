// Application: App shell — Master-Detail layout

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useUIStore } from './store/uiStore';
import { useAccountStore } from './store/accountStore';
import { useAccounts } from './hooks/useAccounts';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { ContentArea, type ViewContext } from './layout/ContentArea';
import { AddAccountModal } from './components/AddAccountModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useMantineColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { setLang, type LangId } from '../config/i18n';
import './i18n';

export function App(): JSX.Element {
 const activeView = useUIStore((state) => state.activeView);
 const accounts = useAccountStore((state) => state.accounts);
 const select = useAccountStore((state) => state.select);
 const { loadAccounts, loginBrowser } = useAccounts();
 const { colorScheme } = useMantineColorScheme();
 
 const isDark = colorScheme === 'dark' || (colorScheme === 'auto' && useMediaQuery('(prefers-color-scheme: dark)'));
 const reducedMotion = useReducedMotion();
 const [searchQuery, setSearchQuery] = useState('');
 const [showAddModal, setShowAddModal] = useState(false);

 // Mantine v7 no expone theme.colors.white/black (Tailwind legacy).
 // Usar el scheme del theme directamente via white/dark hex strings.
 const bgColor = isDark ? '#0d0f12' : '#ffffff';
 const textColor = isDark ? '#ffffff' : '#0d0f12';

 useEffect(() => { loadAccounts(); }, [loadAccounts]);

 // Load persisted language on mount (only in Electron where preload is available)
 useEffect(() => {
   if (window?.api?.settings) {
     window.api.settings.get('lang').then((r) => {
       if (r.success && r.data) {
         const stored = String(r.data) as LangId;
         if (['es', 'en', 'pt'].includes(stored)) {
           setLang(stored);
         }
       }
     }).catch(() => { /* IPC not ready — default lang remains */ });
   }
 }, []);

 // U-003: Reset selectedId when view changes away from accounts
 useEffect(() => {
 if (activeView !== 'accounts') {
 select(null);
 }
 }, [activeView, select]);

 const context: ViewContext = { searchQuery, accounts };

 return (
 <ErrorBoundary>
 <div className="flex h-screen w-screen overflow-hidden font-sans"
 style={{ background: bgColor, color: textColor }}>
 <Sidebar accountCount={accounts.length} />
 <div className="flex flex-col flex-1 min-w-0">
 <TopBar
 onAddAccount={() => setShowAddModal(true)}
 searchQuery={searchQuery}
 onSearch={setSearchQuery}
 activeView={activeView}
 />
 <AnimatePresence mode="wait">
 <motion.div
 key={activeView}
 initial={reducedMotion ? undefined : { opacity: 0, x: 10 }}
 animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
 exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
 transition={reducedMotion ? undefined : { duration: 0.15, ease: 'easeInOut' }}
 className="flex-1 overflow-hidden"
 >
 <ContentArea activeView={activeView} context={context} />
 </motion.div>
 </AnimatePresence>
 </div>
 <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} onLoginBrowser={loginBrowser} />
 </div>
 </ErrorBoundary>
 );
}
