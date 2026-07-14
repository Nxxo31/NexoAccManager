import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountDetailsPanel from '@/renderer/components/accounts/AccountDetailsPanel';
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
  onSaveAlias: vi.fn().mockResolvedValue(undefined),
  onSaveDescription: vi.fn().mockResolvedValue(undefined),
  onFollowUser: vi.fn().mockResolvedValue(undefined),
  onLaunchGame: vi.fn().mockResolvedValue(undefined),
};

describe('AccountDetailsPanel', () => {
  it('shows empty state when no account selected', () => {
    render(<AccountDetailsPanel account={null} {...defaultProps} />);
    expect(screen.getByText('Selecciona una cuenta')).toBeInTheDocument();
  });

  it('shows account header when account is provided', () => {
    render(<AccountDetailsPanel account={mockAccount()} {...defaultProps} />);
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('shows Place ID and Job ID inputs', () => {
    render(<AccountDetailsPanel account={mockAccount()} {...defaultProps} />);
    expect(screen.getByPlaceholderText('ej: 5315046213')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Job ID del servidor (opcional)')).toBeInTheDocument();
  });

  it('shows Alias input with current displayName', () => {
    render(<AccountDetailsPanel account={mockAccount()} {...defaultProps} />);
    const aliasInput = screen.getByPlaceholderText('Alias de la cuenta') as HTMLInputElement;
    expect(aliasInput.value).toBe('TestUser');
  });

  it('shows Description textarea with current description', () => {
    render(<AccountDetailsPanel account={mockAccount()} {...defaultProps} />);
    const descTextarea = screen.getByPlaceholderText('Notas sobre esta cuenta...') as HTMLTextAreaElement;
    expect(descTextarea.value).toBe('Test description');
  });

  it('shows Follow button', () => {
    render(<AccountDetailsPanel account={mockAccount()} {...defaultProps} />);
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('shows metadata (Creada, Último uso, ID)', () => {
    render(<AccountDetailsPanel account={mockAccount()} {...defaultProps} />);
    expect(screen.getByText('Creada:')).toBeInTheDocument();
    expect(screen.getByText('Último uso:')).toBeInTheDocument();
    expect(screen.getByText('ID:')).toBeInTheDocument();
  });
});