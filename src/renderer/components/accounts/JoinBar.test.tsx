import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinBar } from './JoinBar';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'joinbar.placeId': 'Place ID',
        'joinbar.jobId': 'Job ID',
        'joinbar.jobIdOptional': 'Opcional',
        'joinbar.shuffle': 'Barajar',
        'joinbar.join': 'Unirse',
        'joinbar.killAll': 'Cerrar todas',
        'joinbar.vipServer': 'Servidor VIP',
        'joinbar.vipServerTitle': 'Pegar link de servidor VIP',
        'joinbar.vipPlaceholder': 'Pegar link VIP',
        'joinbar.vipLink': 'Link VIP',
        'joinbar.clear': 'Limpiar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useUIStore — return a static snapshot per selector call
vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: (selector: (s: any) => any) => selector({ jobIdShuffle: false, toggleJobIdShuffle: vi.fn() }),
}));

describe('JoinBar', () => {
  const onPlaceIdChange = vi.fn();
  const onJobIdChange = vi.fn();
  const onJoin = vi.fn();
  const onKillAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all input fields and buttons', () => {
    render(<JoinBar 
      placeId="12345" 
      jobId="67890" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} 
      onKillAll={onKillAll} 
    />);

    expect(screen.getByLabelText('Place ID')).toHaveValue('12345');
    expect(screen.getByLabelText('Job ID')).toHaveValue('67890');
    expect(screen.getByLabelText('Barajar')).toBeInTheDocument();
    expect(screen.getByLabelText('Cerrar todas')).toBeInTheDocument();
    expect(screen.getByLabelText('Unirse')).toBeInTheDocument();
  });

  it('calls onPlaceIdChange when Place ID input changes', () => {
    render(<JoinBar 
      placeId="" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    const placeIdInput = screen.getByLabelText('Place ID') as HTMLInputElement;
    fireEvent.input(placeIdInput, { target: { value: '54321' } });
    expect(onPlaceIdChange).toHaveBeenCalledWith('54321');
  });

  it('calls onJobIdChange when Job ID input changes', () => {
    render(<JoinBar 
      placeId="" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    const jobIdInput = screen.getByLabelText('Job ID') as HTMLInputElement;
    fireEvent.input(jobIdInput, { target: { value: '12345' } });
    expect(onJobIdChange).toHaveBeenCalledWith('12345');
  });

  it('calls onJoin when Join button is clicked', () => {
    render(<JoinBar 
      placeId="12345" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    fireEvent.click(screen.getByLabelText('Unirse'));
    expect(onJoin).toHaveBeenCalled();
  });

  it('disables Join button when Place ID is empty', () => {
    render(<JoinBar 
      placeId="" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    const joinButton = screen.getByLabelText('Unirse') as HTMLButtonElement;
    expect(joinButton.disabled).toBe(true);
  });

  it('enables Join button when Place ID is not empty', () => {
    render(<JoinBar 
      placeId="12345" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    const joinButton = screen.getByLabelText('Unirse') as HTMLButtonElement;
    expect(joinButton.disabled).toBe(false);
  });

  it('calls onKillAll when Kill All button is clicked', () => {
    render(<JoinBar 
      placeId="12345" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    fireEvent.click(screen.getByLabelText('Cerrar todas'));
    expect(onKillAll).toHaveBeenCalled();
  });

  it('shows VIP link input when Crown button is clicked', () => {
    render(<JoinBar 
      placeId="12345" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    const crownButton = screen.getByLabelText('Servidor VIP');
    fireEvent.click(crownButton);
    expect(screen.getByLabelText('Link VIP')).toBeInTheDocument();
  });

  it('renders shuffle and VIP buttons with aria-pressed', () => {
    render(<JoinBar 
      placeId="12345" jobId="" 
      onPlaceIdChange={onPlaceIdChange} 
      onJobIdChange={onJobIdChange} 
      onJoin={onJoin} onKillAll={onKillAll} 
    />);
    const shuffleButton = screen.getByLabelText('Barajar');
    expect(shuffleButton).toHaveAttribute('aria-pressed');
    const crownButton = screen.getByLabelText('Servidor VIP');
    expect(crownButton).toHaveAttribute('aria-pressed');
  });
});