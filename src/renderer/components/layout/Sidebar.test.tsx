import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@renderer/components/layout/Sidebar';

// Mock useAccountStore
const mockAccountStore = {
  accounts: [
    { id: 'acc-1', username: 'user1', displayName: 'User One', group: 'main' },
    { id: 'acc-2', username: 'user2', displayName: 'User Two', group: '' },
  ],
  selectedAccount: null,
  setSelectedAccount: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
};
vi.mock('@renderer/store/useAccountStore', () => ({
  useAccountStore: (selector: any) => selector(mockAccountStore),
}));

// Mock useUIStore
const mockUIStore = {
  sidebarCollapsed: false,
  toggleSidebar: vi.fn(),
  showAccounts: true,
  toggleShowAccounts: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
};
vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: (selector: any) => selector(mockUIStore),
}));

// Mock useAccountActions
vi.mock('@renderer/hooks/useAccountActions', () => ({
  useAccountActions: () => ({ handleLoginBrowser: vi.fn() }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback: string) => fallback }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand name when expanded', () => {
    render(<Sidebar />);
    // Brand splits text across spans; check for "Acc" which only appears in brand
    expect(screen.getByText('Acc')).toBeInTheDocument();
  });

  it('renders search input when expanded', () => {
    render(<Sidebar />);
    expect(screen.getByPlaceholderText(/Search accounts/i)).toBeInTheDocument();
  });

  it('renders login button when expanded', () => {
    render(<Sidebar />);
    const loginBtn = screen.getByLabelText(/Login/i);
    expect(loginBtn).toBeInTheDocument();
  });

  it('renders accounts list when not collapsed and showAccounts is true', () => {
    render(<Sidebar />);
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('User Two')).toBeInTheDocument();
  });

  it('shows group badge for accounts with group', () => {
    render(<Sidebar />);
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('shows "No group" badge for accounts without group', () => {
    render(<Sidebar />);
    expect(screen.getByText('No group')).toBeInTheDocument();
  });

  it('shows "No accounts to show" when account list is empty', () => {
    mockAccountStore.accounts = [];
    render(<Sidebar />);
    expect(screen.getByText('No accounts to show')).toBeInTheDocument();
    mockAccountStore.accounts = [
      { id: 'acc-1', username: 'user1', displayName: 'User One', group: 'main' },
      { id: 'acc-2', username: 'user2', displayName: 'User Two', group: '' },
    ];
  });

  it('renders account count in footer', () => {
    render(<Sidebar />);
    expect(screen.getByText(/2\/50/)).toBeInTheDocument();
  });

  it('toggles sidebar on collapse button click', () => {
    render(<Sidebar />);
    const toggleBtn = screen.getByLabelText(/Collapse/i);
    fireEvent.click(toggleBtn);
    expect(mockUIStore.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('calls setSearchQuery when typing in search', () => {
    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText(/Search accounts/i);
    fireEvent.change(searchInput, { target: { value: 'user1' } });
    expect(mockUIStore.setSearchQuery).toHaveBeenCalledWith('user1');
  });

  it('shows "Show accounts" toggle when expanded', () => {
    render(<Sidebar />);
    expect(screen.getByText('Show accounts')).toBeInTheDocument();
  });
});
