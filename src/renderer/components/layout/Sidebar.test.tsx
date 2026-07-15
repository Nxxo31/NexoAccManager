import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@renderer/components/layout/Sidebar';

vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: () => ({ toggleSidebar: vi.fn(), activeView: 'accounts' }),
}));

const renderSidebar = () =>
  render(<Sidebar isCollapsed={false} onToggleCollapse={vi.fn()} />);

describe('Sidebar', () => {
  it('renders the NexoAcc logo text', () => {
    renderSidebar();
    expect(screen.getByText(/Nexo/i)).toBeInTheDocument();
    expect(screen.getByText(/Acc/i)).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderSidebar();
    expect(screen.getByText('Cuentas')).toBeInTheDocument();
    expect(screen.getByText('Servers')).toBeInTheDocument();
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
  });

  it('renders tools section', () => {
    renderSidebar();
    expect(screen.getByText('Añadir cuenta')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
    expect(screen.getByText('Automatización')).toBeInTheDocument();
  });

  it('renders navigation and tools headings', () => {
    renderSidebar();
    expect(screen.getByText('Navegación')).toBeInTheDocument();
    expect(screen.getByText('Herramientas')).toBeInTheDocument();
  });
});
