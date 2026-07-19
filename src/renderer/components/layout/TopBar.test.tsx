import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '@renderer/components/layout/TopBar';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback: string) => fallback }),
}));

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    const setTheme = vi.fn();
    render(<TopBar theme={{ theme: 'dark' }} setTheme={setTheme} onOpenSettings={() => {}} />);
    expect(screen.getByLabelText(/Cambiar tema/i)).toBeInTheDocument();
  });

  it('renders settings button', () => {
    const onOpenSettings = vi.fn();
    render(<TopBar theme={{ theme: 'dark' }} setTheme={() => {}} onOpenSettings={onOpenSettings} />);
    expect(screen.getByLabelText(/Configuración/i)).toBeInTheDocument();
  });

  it('calls onOpenSettings when settings button clicked', () => {
    const onOpenSettings = vi.fn();
    render(<TopBar theme={{ theme: 'dark' }} setTheme={() => {}} onOpenSettings={onOpenSettings} />);
    fireEvent.click(screen.getByLabelText(/Configuración/i));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('does NOT render search bar (removed in UI rework)', () => {
    render(<TopBar theme={{ theme: 'dark' }} setTheme={() => {}} onOpenSettings={() => {}} />);
    expect(screen.queryByPlaceholderText(/Buscar cuentas/i)).not.toBeInTheDocument();
  });

  it('does NOT render an Add account button (moved to Sidebar)', () => {
    render(<TopBar theme={{ theme: 'dark' }} setTheme={() => {}} onOpenSettings={() => {}} />);
    expect(screen.queryByText(/Agregar/i)).not.toBeInTheDocument();
  });

  it('calls setTheme with light when current theme is dark (toggle)', () => {
    const setTheme = vi.fn();
    render(<TopBar theme={{ theme: 'dark' }} setTheme={setTheme} onOpenSettings={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Cambiar tema/i));
    expect(setTheme).toHaveBeenCalledTimes(1);
    const arg = setTheme.mock.calls[0][0];
    expect(arg.theme).toBe('light');
  });

  it('calls setTheme with dark when current theme is light (toggle)', () => {
    const setTheme = vi.fn();
    render(<TopBar theme={{ theme: 'light' }} setTheme={setTheme} onOpenSettings={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Cambiar tema/i));
    expect(setTheme).toHaveBeenCalledTimes(1);
    const arg = setTheme.mock.calls[0][0];
    expect(arg.theme).toBe('dark');
  });
});
