import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@renderer/components/layout/Sidebar';

// Resetable mock state
const mockAccountStore = {
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

const mockUIStore = {
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

vi.mock('@renderer/hooks/useAccountActions', () => ({
  useAccountActions: () => ({}),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fallback: string) => fallback }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // restore default mock state before each test
    mockAccountStore.accounts = [
      { id: 'acc-1', username: 'user1', displayName: 'User One', group: 'main' },
      { id: 'acc-2', username: 'user2', displayName: 'User Two', group: '' },
    ];
    mockAccountStore.selectedAccount = null;
    mockUIStore.sidebarCollapsed = false;
    mockUIStore.showAccounts = true;
    mockUIStore.activeView = 'accounts';
  });

  it('renders brand name when expanded', () => {
    render(<Sidebar />);
    expect(screen.getByText('Acc')).toBeInTheDocument();
  });

  it('renders collapse/expand button', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText(/Collapse/i)).toBeInTheDocument();
  });

  it('renders navigation menu items when expanded', () => {
    render(<Sidebar />);
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Servers')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Friends')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('toggles sidebar on collapse button click', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText(/Collapse/i));
    expect(mockUIStore.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('sets active view when clicking a nav item', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('Servers'));
    expect(mockUIStore.setActiveView).toHaveBeenCalledWith('servers');
  });

  it('shows account list when not collapsed and showAccounts is true', () => {
    render(<Sidebar />);
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('User Two')).toBeInTheDocument();
  });

  it('hides account list when showAccounts is false', () => {
    mockUIStore.showAccounts = false;
    render(<Sidebar />);
    expect(screen.queryByText('User One')).not.toBeInTheDocument();
  });

  it('toggles Show accounts checkbox (calls setShowAccounts with negated value)', () => {
    render(<Sidebar />);
    const checkbox = screen.getByLabelText(/Show accounts/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(mockUIStore.setShowAccounts).toHaveBeenCalledWith(false);
  });

  it('renders "No accounts to show" when account list is empty', () => {
    mockAccountStore.accounts = [];
    render(<Sidebar />);
    expect(screen.getByText(/No accounts to show/i)).toBeInTheDocument();
  });

  it('renders account count in footer when accounts present and showAccounts true', () => {
    render(<Sidebar />);
    expect(screen.getByText(/2\/50/)).toBeInTheDocument();
  });

  it('selects an account when clicking in the account list', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('User One').closest('button')!);
    expect(mockAccountStore.setSelectedAccount).toHaveBeenCalled();
  });
});