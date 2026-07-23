// Application Layout: ContentArea — swaps views based on activeView

import type { PageKey } from '../../config/constants';
import type { Account } from '../../domain/entities/Account';
import { AccountsView } from '../views/AccountsView';
import { ServersView } from '../views/ServersView';
import { GamesView } from '../views/GamesView';
import { FriendsView } from '../views/FriendsView';
import { SettingsView } from '../views/SettingsView';
import { useUIStore } from '../store/uiStore';

export interface ViewContext {
  searchQuery: string;
  accounts: Account[];
}

export function ContentArea({ activeView, context }: { activeView: PageKey; context: ViewContext }): JSX.Element {
  switch (activeView) {
    case 'accounts': return <AccountsView searchQuery={context.searchQuery} />;
    case 'servers': return <ServersView />;
    case 'games': return <GamesView />;
    case 'friends': return <FriendsView />;
    case 'settings': return <SettingsView />;
    default: return <AccountsView searchQuery={context.searchQuery} />;
  }
}
