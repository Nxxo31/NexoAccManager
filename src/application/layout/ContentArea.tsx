// Application Layout: ContentArea — swaps views based on activeView

import type { PageKey } from '../../config/constants';
import { AccountsView } from '../views/AccountsView';
import { ServersView } from '../views/ServersView';
import { GamesView } from '../views/GamesView';
import { FriendsView } from '../views/FriendsView';
import { SettingsView } from '../views/SettingsView';

export function ContentArea({ activeView }: { activeView: PageKey }): JSX.Element {
  switch (activeView) {
    case 'accounts': return <AccountsView />;
    case 'servers': return <ServersView />;
    case 'games': return <GamesView />;
    case 'friends': return <FriendsView />;
    case 'settings': return <SettingsView />;
    default: return <AccountsView />;
  }
}
