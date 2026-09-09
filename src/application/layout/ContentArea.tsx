// Application Layout: ContentArea — swaps views based on activeView
// B-2: Non-default views are lazy-loaded with React.lazy to split the
// renderer bundle. AccountsView stays eager (it's the default/landing view).
// Each lazy view is wrapped in <Suspense> with a Mantine <LoadingOverlay>.
// This reduces initial JS payload — SettingsView (12 accordion sections) and
// GamesView/ServersView/FriendsView only load when first navigated to.

import { lazy, Suspense } from 'react';
import type { PageKey } from '../../config/constants';
import type { Account } from '../../domain/entities/Account';
import { AccountsView } from '../views/AccountsView';
import { LoadingOverlay } from '@mantine/core';

export interface ViewContext {
  searchQuery: string;
  accounts: Account[];
}

// B-2: code-split non-default views — they load on first navigation
const ServersView = lazy(() => import('../views/ServersView').then((m) => ({ default: m.ServersView })));
const GamesView = lazy(() => import('../views/GamesView').then((m) => ({ default: m.GamesView })));
const FriendsView = lazy(() => import('../views/FriendsView').then((m) => ({ default: m.FriendsView })));
const SettingsView = lazy(() => import('../views/SettingsView').then((m) => ({ default: m.SettingsView })));

function ViewFallback(): JSX.Element {
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 200 }}>
      <LoadingOverlay visible overlayProps={{ radius: 'sm', blur: 0 }} />
    </div>
  );
}

export function ContentArea({ activeView, context }: { activeView: PageKey; context: ViewContext }): JSX.Element {
  switch (activeView) {
    case 'accounts':
      return <AccountsView searchQuery={context.searchQuery} />;
    case 'servers':
      return <Suspense fallback={<ViewFallback />}><ServersView /></Suspense>;
    case 'games':
      return <Suspense fallback={<ViewFallback />}><GamesView /></Suspense>;
    case 'friends':
      return <Suspense fallback={<ViewFallback />}><FriendsView /></Suspense>;
    case 'settings':
      return <Suspense fallback={<ViewFallback />}><SettingsView /></Suspense>;
    default:
      return <AccountsView searchQuery={context.searchQuery} />;
  }
}
