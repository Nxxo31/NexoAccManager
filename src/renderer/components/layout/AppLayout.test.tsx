import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from './AppLayout';

const mockUIStore: any = {
  sidebarCollapsed: false,
  toggleSidebar: vi.fn(),
  showAccounts: true,
  toggleShowAccounts: vi.fn(),
  setShowAccounts: vi.fn(),
  activeView: 'accounts',
  setActiveView: vi.fn(),
};

vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: (selector: any) => selector(mockUIStore),
}));

const mockAccountStore: any = {
  accounts: [
    { id: 'acc-1', username: 'user1', displayName: 'User One', group: 'main' },
    { id: 'acc-2', username: 'user2', displayName: 'User Two', group: '' },
  ],
  selectedAccount: null,
  setSelectedAccount: vi.fn(),
};

vi.mock('@renderer/store/useAccountStore', () => ({
  useAccountStore: (selector: any) => selector(mockAccountStore),
}));

vi.mock('@renderer/hooks/useAccountActions', () => ({
  useAccountActions: () => ({}),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fallback: string) => fallback }),
}));

// Mock NotificationBar and SelectionBar to keep test focused on layout structure
vi.mock('./NotificationBar', () => ({
  NotificationBar: () => <div data-testid="notification-bar" />,
}));

vi.mock('./SelectionBar', () => ({
  SelectionBar: () => <div data-testid="selection-bar" />,
}));

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar, topbar, and content area', () => {
    render(
      <AppLayout theme={{}} setTheme={vi.fn()} onOpenSettings={vi.fn()}>
        <div data-testid="child-content">Test Content</div>
      </AppLayout>
    );

    // Sidebar is rendered (contains nav items from mock)
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    // TopBar is rendered (contains theme toggle area)
    expect(screen.getByTestId('notification-bar')).toBeInTheDocument();
    // Content area has children
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children in the content area based on activeView', () => {
    mockUIStore.activeView = 'accounts';

    render(
      <AppLayout theme={{}} setTheme={vi.fn()} onOpenSettings={vi.fn()}>
        <div data-testid="view-accounts">AccountsView Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('view-accounts')).toBeInTheDocument();
    expect(screen.getByText('AccountsView Content')).toBeInTheDocument();
  });
});
