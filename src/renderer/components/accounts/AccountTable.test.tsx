import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountTable from '@renderer/components/accounts/AccountTable';
import type { Account } from '@/types/Account';

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
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('@second')).toBeInTheDocument();
  });

  it('masks usernames when hideUsernames is true', () => {
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} hideUsernames={true} />);
    expect(screen.queryByText('@testuser')).not.toBeInTheDocument();
    expect(screen.getByText('••••••')).toBeInTheDocument();
  });

  it('shows "Sin descripción" when description is empty', () => {
    const accounts = [mockAccount({ description: undefined })];
    render(<AccountTable accounts={accounts} {...defaultProps} />);
    expect(screen.getByText('Sin descripción')).toBeInTheDocument();
  });

  it('calls onSelectAccount when row is clicked', () => {
    const onSelectAccount = vi.fn();
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} onSelectAccount={onSelectAccount} />);
    fireEvent.click(screen.getByText('@testuser'));
    expect(onSelectAccount).toHaveBeenCalledTimes(1);
  });

  it('calls onPlayAccount when row is double-clicked', () => {
    const onPlayAccount = vi.fn();
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} onPlayAccount={onPlayAccount} />);
    const row = screen.getByText('@testuser').closest('tr');
    if (row) fireEvent.doubleClick(row);
    expect(onPlayAccount).toHaveBeenCalledTimes(1);
  });

  it('calls onEditAlias when alias is clicked', () => {
    const onEditAlias = vi.fn();
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} onEditAlias={onEditAlias} />);
    fireEvent.click(screen.getByText('TestUser'));
    expect(onEditAlias).toHaveBeenCalledTimes(1);
  });

  it('calls onEditDesc when description is clicked', () => {
    const onEditDesc = vi.fn();
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} onEditDesc={onEditDesc} />);
    fireEvent.click(screen.getByText('Test description'));
    expect(onEditDesc).toHaveBeenCalledTimes(1);
  });
});
