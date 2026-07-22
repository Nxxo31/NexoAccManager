// Application: App shell — Master-Detail layout with Sidebar, TopBar, ContentArea

import { useEffect } from 'react';
import { useUIStore } from './store/uiStore';
import { useAccounts } from './hooks/useAccounts';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { ContentArea } from './layout/ContentArea';
import { NotificationBar } from './components/NotificationBar';

export function App(): JSX.Element {
  const activeView = useUIStore((s) => s.activeView);
  const { loadAccounts, accounts } = useAccounts();

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar accountCount={accounts.length} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <TopBar />
        <NotificationBar />
        <ContentArea activeView={activeView} />
      </div>
    </div>
  );
}
