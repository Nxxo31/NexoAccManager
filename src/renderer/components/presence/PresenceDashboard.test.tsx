import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PresenceDashboard from '@renderer/components/presence/PresenceDashboard';

// Mock useAccountStore
vi.mock('@renderer/store/useAccountStore', () => ({
  useAccountStore: (selector: any) =>
    selector({
      accounts: [{ id: 'acc-1', username: 'user1', displayName: 'User1' }],
      selectedAccount: null,
    }),
}));

// Mock window.api
beforeEach(() => {
  (window as any).api = {
    presence: {
      getPresence: vi.fn().mockResolvedValue({ success: true, data: [] }),
      startPolling: vi.fn().mockResolvedValue({ success: true }),
      stopPolling: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

describe('PresenceDashboard', () => {
  it('renders header with title', () => {
    render(<PresenceDashboard />);
    expect(screen.getByText('Presencia')).toBeInTheDocument();
  });

  it('renders empty state initially', () => {
    render(<PresenceDashboard />);
    expect(screen.getByText('Sin datos de presencia')).toBeInTheDocument();
  });

  it('renders Actualizar button', () => {
    render(<PresenceDashboard />);
    expect(screen.getByText('Actualizar')).toBeInTheDocument();
  });

  it('renders Iniciar Polling button', () => {
    render(<PresenceDashboard />);
    expect(screen.getByText('Iniciar Polling')).toBeInTheDocument();
  });
});
