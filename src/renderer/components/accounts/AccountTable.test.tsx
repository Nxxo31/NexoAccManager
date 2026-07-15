import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountTable from '@renderer/components/accounts/AccountTable';
import type { Account } from '@/types/Account';

// Mock framer-motion Reorder to avoid complex motion rendering in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    Reorder: {
      Item: ({ children }: any) => <div data-testid="reorder-item">{children}</div>,
    },
  };
});

const mockAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'test-id-1',
  robloxUserId: 12345,
  username: 'testuser',
  displayName: 'TestUser',
  group: 'Default',
  description: 'Test description',
  lastUsed: new Date(),
  createdAt: new Date(),
  ...overrides,
});

const defaultProps = {
  selectedAccount: null,
  onSelectAccount: vi.fn(),
  onDeleteAccount: vi.fn(),
  onPlayAccount: vi.fn(),
  onFollowAccount: vi.fn(),
  hideUsernames: false,
};

describe('AccountTable', () => {
  it('shows empty state when no accounts', () => {
    render(<AccountTable accounts={[]} {...defaultProps} />);
    expect(screen.getByText('No hay cuentas')).toBeInTheDocument();
    expect(screen.getByText(/Agrega tu primera cuenta/i)).toBeInTheDocument();
  });

  it('renders account rows when accounts provided', () => {
    const accounts = [mockAccount(), mockAccount({ id: 'test-id-2', username: 'second', displayName: 'Second' })];
    render(<AccountTable accounts={accounts} {...defaultProps} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('masks usernames when hideUsernames is true', () => {
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} hideUsernames={true} />);
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    expect(screen.getByText('••••••')).toBeInTheDocument();
  });

  it('shows description when present', () => {
    const accounts = [mockAccount({ description: 'Mi cuenta principal' })];
    render(<AccountTable accounts={accounts} {...defaultProps} />);
    expect(screen.getByText('Mi cuenta principal')).toBeInTheDocument();
  });

  it('omits description paragraph when not present', () => {
    const accounts = [mockAccount({ description: undefined })];
    render(<AccountTable accounts={accounts} {...defaultProps} />);
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('calls onSelectAccount when row is clicked', () => {
    const onSelectAccount = vi.fn();
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} onSelectAccount={onSelectAccount} />);
    fireEvent.click(screen.getByText('testuser'));
    expect(onSelectAccount).toHaveBeenCalledTimes(1);
  });

  it('calls onPlayAccount when row is double-clicked', () => {
    const onPlayAccount = vi.fn();
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} onPlayAccount={onPlayAccount} />);
    fireEvent.doubleClick(screen.getByText('testuser'));
    expect(onPlayAccount).toHaveBeenCalledTimes(1);
  });

  it('renders table with correct column headers', () => {
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} />);
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('Alias')).toBeInTheDocument();
    expect(screen.getByText('Descripción')).toBeInTheDocument();
  });

  it('has accessible table label', () => {
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} />);
    expect(screen.getByRole('table', { name: 'Tabla de cuentas' })).toBeInTheDocument();
  });
});
