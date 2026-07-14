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

  it('calls onPlayAccount when play button is clicked', () => {
    const onPlayAccount = vi.fn();
    const accounts = [mockAccount()];
    render(<AccountTable accounts={accounts} {...defaultProps} onPlayAccount={onPlayAccount} />);
    const playBtn = screen.getByTitle('Jugar');
    fireEvent.click(playBtn);
    expect(onPlayAccount).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteAccount with confirm dialog', () => {
    const onDeleteAccount = vi.fn();
    const accounts = [mockAccount()];
    window.confirm = vi.fn().mockReturnValue(true);
    render(<AccountTable accounts={accounts} {...defaultProps} onDeleteAccount={onDeleteAccount} />);
    const deleteBtn = screen.getByTitle('Eliminar');
    fireEvent.click(deleteBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(onDeleteAccount).toHaveBeenCalledWith('test-id-1');
  });
});
