import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@renderer/components/layout/Sidebar';

vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: () => ({ toggleSidebar: vi.fn(), activeView: 'accounts' }),
}));

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );

describe('Sidebar', () => {
  it('renders the NexoAcc logo text', () => {
    renderSidebar();
    expect(screen.getByText(/Nexo/i)).toBeInTheDocument();
  });

  it('renders all 4 navigation items', () => {
    renderSidebar();
    expect(screen.getByText('Cuentas')).toBeInTheDocument();
    expect(screen.getByText('Servers')).toBeInTheDocument();
    expect(screen.getByText('Presencia')).toBeInTheDocument();
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
  });

  it('renders version info in footer', () => {
    renderSidebar();
    expect(screen.getByText(/v2\.\d+\.\d+/)).toBeInTheDocument();
  });
});
