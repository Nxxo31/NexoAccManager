import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsView } from './SettingsView';

// Mock Zustand store
vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: () => ({
    savePasswords: false,
    setSavePasswords: vi.fn(),
    disableAgingAlert: false,
    setDisableAgingAlert: vi.fn(),
    autoRelaunch: false,
    setAutoRelaunch: vi.fn(),
    connectionWatcher: false,
    setConnectionWatcher: vi.fn(),
    preventDuplicateInstances: false,
    setPreventDuplicateInstances: vi.fn(),
  }),
}));

// Mock window.api
beforeEach(() => {
  (window as any).api = {
    settings: {
      set: vi.fn().mockResolvedValue({ success: true }),
      setConnectionWatcher: vi.fn().mockResolvedValue({ success: true }),
      setPreventDuplicateInstances: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

describe('SettingsView', () => {
  it('renders all toggle sections', () => {
    render(<SettingsView onOpenModal={() => {}} />);
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
    expect(screen.getByText('Avanzado')).toBeInTheDocument();
    expect(screen.getByText('Gestión de instancias')).toBeInTheDocument();
  });

  it('renders savePasswords toggle', () => {
    render(<SettingsView onOpenModal={() => {}} />);
    expect(screen.getByText('Guardar contraseñas')).toBeInTheDocument();
  });

  it('renders disableAgingAlert toggle', () => {
    render(<SettingsView onOpenModal={() => {}} />);
    expect(screen.getByText('Desactivar alerta de antigüedad')).toBeInTheDocument();
  });

  it('renders autoRelaunch toggle', () => {
    render(<SettingsView onOpenModal={() => {}} />);
    expect(screen.getByText('Auto-relanzar cuentas')).toBeInTheDocument();
  });

  it('renders connectionWatcher toggle', () => {
    render(<SettingsView onOpenModal={() => {}} />);
    expect(screen.getByText('Monitor de conexión')).toBeInTheDocument();
  });

  it('renders preventDuplicateInstances toggle', () => {
    render(<SettingsView onOpenModal={() => {}} />);
    expect(screen.getByText('Prevenir instancias duplicadas')).toBeInTheDocument();
  });

  it('renders open panel button', () => {
    render(<SettingsView onOpenModal={() => {}} />);
    expect(screen.getByText('Abrir panel de ajustes')).toBeInTheDocument();
  });
});