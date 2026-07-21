import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountsView from './AccountsView';

// Resetable mock state
const mockAccountStore: any = {
  accounts: [],
  selectedAccount: null,
  setSelectedAccount: vi.fn(),
  setAccountField: vi.fn(),
  setAccounts: vi.fn(),
};

const mockUIStore: any = {
  searchQuery: '',
  setSearchQuery: vi.fn(),
  hideUsernames: false,
  jobIdShuffle: false,
};

vi.mock('@renderer/store/useAccountStore', () => ({
  useAccountStore: Object.assign(
    (selector: any) => selector(mockAccountStore),
    { getState: () => mockAccountStore }
  ),
}));

vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: Object.assign(
    (selector?: any) => (selector ? selector(mockUIStore) : mockUIStore),
    { getState: () => mockUIStore }
  ),
}));

vi.mock('@renderer/hooks/useAccountActions', () => ({
  useAccountActions: () => ({
    handleLoginBrowser: vi.fn(),
    handleLaunchApp: vi.fn(),
    handleDeleteAccount: vi.fn(),
    handleJoinServer: vi.fn(),
    handleCopyPlaceId: vi.fn(),
    followUser: vi.fn(),
  }),
}));

vi.mock('@renderer/components/accounts/AccountGrid', () => ({
  AccountGrid: () => <div data-testid="account-grid-mock" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fallback: string) => fallback }),
}));

const mockAccount = (overrides: Partial<any> = {}) => ({
  id: '1',
  username: 'user1',
  displayName: 'User One',
  robloxUserId: 1,
  group: '',
  lastUsed: new Date(0),
  createdAt: new Date(0),
  ...overrides,
});

describe('AccountsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountStore.accounts = [];
    mockAccountStore.selectedAccount = null;
    mockUIStore.searchQuery = '';
  });

  it('shows empty state hero when accounts is empty', () => {
    mockAccountStore.accounts = [];
    render(<AccountsView />);
    expect(screen.getByText(/no hay cuentas agregadas/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /iniciar sesión/i }).length).toBeGreaterThan(0);
  });

  it('renders toolbar with search and login button when accounts exist', () => {
    mockAccountStore.accounts = [
      mockAccount(),
      mockAccount({ id: '2', username: 'user2', displayName: 'User Two' }),
    ];
    render(<AccountsView />);
    expect(screen.getByPlaceholderText(/buscar cuentas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('filters accounts by search query', () => {
    mockAccountStore.accounts = [
      mockAccount(),
      mockAccount({ id: '2', username: 'user2', displayName: 'User Two' }),
    ];
    mockUIStore.searchQuery = 'user2';
    render(<AccountsView />);
    // AccountsView filters internally based on searchQuery from store
    // User Two should be visible, User One should not
    expect(screen.getByText('User Two')).toBeInTheDocument();
  });

  it('shows JoinBar with Place ID, Job ID, account select and Unirse button', () => {
    mockAccountStore.accounts = [
      mockAccount(),
      mockAccount({ id: '2', username: 'user2', displayName: 'User Two' }),
    ];
    render(<AccountsView />);
    expect(screen.getByLabelText(/seleccionar cuenta/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/place id/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/job id \(opcional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unirse/i })).toBeInTheDocument();
  });
});
