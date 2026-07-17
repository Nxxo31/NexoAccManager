import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinBar } from './JoinBar';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

// Mock Zustand store
vi.mock('@renderer/store/useUIStore', () => ({
  useUIStore: (selector: (s: any) => any) => selector({ jobIdShuffle: false, toggleJobIdShuffle: vi.fn() }),
}));

describe('JoinBar', () => {
  const onPlaceIdChange = vi.fn();
  const onJobIdChange = vi.fn();
  const onJoin = vi.fn();

  beforeEach(() => {
    onPlaceIdChange.mockClear();
    onJobIdChange.mockClear();
    onJoin.mockClear();
  });

  it('renders Place ID and Job ID inputs', () => {
    render(<JoinBar placeId="" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    expect(screen.getByLabelText('Place ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Job ID')).toBeInTheDocument();
  });

  it('Join button is disabled when Place ID is empty', () => {
    render(<JoinBar placeId="" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    const joinButton = screen.getByLabelText('Unirse al servidor') as HTMLButtonElement;
    expect(joinButton.disabled).toBe(true);
  });

  it('Join button is enabled when Place ID is provided', () => {
    render(<JoinBar placeId="12345" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    const joinButton = screen.getByLabelText('Unirse al servidor') as HTMLButtonElement;
    expect(joinButton.disabled).toBe(false);
  });

  it('calls onJoin when Join button is clicked', () => {
    render(<JoinBar placeId="12345" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    fireEvent.click(screen.getByLabelText('Unirse al servidor'));
    expect(onJoin).toHaveBeenCalled();
  });

  it('calls onPlaceIdChange when Place ID input changes', () => {
    render(<JoinBar placeId="" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    const input = screen.getByLabelText('Place ID');
    fireEvent.change(input, { target: { value: '999' } });
    expect(onPlaceIdChange).toHaveBeenCalledWith('999');
  });

  it('calls onJobIdChange when Job ID input changes', () => {
    render(<JoinBar placeId="12345" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    const input = screen.getByLabelText('Job ID');
    fireEvent.change(input, { target: { value: 'job-abc' } });
    expect(onJobIdChange).toHaveBeenCalledWith('job-abc');
  });

  it('shows VIP link input when Crown button is clicked', () => {
    render(<JoinBar placeId="12345" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    const crownButton = screen.getByLabelText('Servidor VIP');
    fireEvent.click(crownButton);
    // VIP input should appear
    expect(screen.getByLabelText('Link VIP')).toBeInTheDocument();
  });

  it('parses VIP link and fills Place ID + Job ID', () => {
    render(<JoinBar placeId="" jobId="" onPlaceIdChange={onPlaceIdChange} onJobIdChange={onJobIdChange} onJoin={onJoin} />);
    const crownButton = screen.getByLabelText('Servidor VIP');
    fireEvent.click(crownButton);
    const vipInput = screen.getByLabelText('Link VIP');
    const vipUrl = 'https://roblox.com/share?code=ABC123&placeId=98765';
    fireEvent.change(vipInput, { target: { value: vipUrl } });
    expect(onPlaceIdChange).toHaveBeenCalledWith('98765');
    expect(onJobIdChange).toHaveBeenCalledWith('ABC123');
  });
});
