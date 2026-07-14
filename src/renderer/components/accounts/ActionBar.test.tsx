import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActionBar from '@renderer/components/accounts/ActionBar';

const defaultProps = {
  onAddAccount: vi.fn(),
  onRemoveAccount: vi.fn(),
  onLaunchApp: vi.fn(),
  onEditTheme: vi.fn(),
  onAccountControl: vi.fn(),
  hideUsernames: false,
  onToggleHideUsernames: vi.fn(),
  hasSelectedAccount: false,
};

describe('ActionBar', () => {
  it('renders all buttons', () => {
    render(<ActionBar {...defaultProps} />);
    expect(screen.getByText('Agregar Cuenta')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.getByText('Abrir App')).toBeInTheDocument();
    expect(screen.getByText('Editar Tema')).toBeInTheDocument();
    expect(screen.getByText('Control de Cuenta')).toBeInTheDocument();
  });

  it('renders Ocultar Usernames checkbox', () => {
    render(<ActionBar {...defaultProps} />);
    expect(screen.getByText('Ocultar Usernames')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('disables Remove and Launch App when no account selected', () => {
    render(<ActionBar {...defaultProps} hasSelectedAccount={false} />);
    expect(screen.getByText('Eliminar')).toBeDisabled();
    expect(screen.getByText('Abrir App')).toBeDisabled();
  });

  it('enables Remove and Launch App when account is selected', () => {
    render(<ActionBar {...defaultProps} hasSelectedAccount={true} />);
    expect(screen.getByText('Eliminar')).not.toBeDisabled();
    expect(screen.getByText('Abrir App')).not.toBeDisabled();
  });

  it('Agregar Cuenta is always enabled', () => {
    render(<ActionBar {...defaultProps} hasSelectedAccount={false} />);
    expect(screen.getByText('Agregar Cuenta')).not.toBeDisabled();
  });
});
