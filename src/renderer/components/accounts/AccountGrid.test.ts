import { describe, it, expect } from 'vitest';
import { calcAgingColor, calcAgingDays, groupAccounts } from './AccountGrid';

// Type is internal — we use simple mock objects casting as any
function mockAccount(overrides: Partial<any> = {}) {
  return {
    id: 'acc-1',
    username: 'user1',
    displayName: 'User1',
    group: '',
    createdAt: new Date(),
    lastUsed: new Date(),
    ...overrides,
  } as any;
}

describe('AccountGrid — groupAccounts', () => {
  it('groups accounts by group field preserving order', () => {
    const accounts = [
      mockAccount({ id: '1', group: 'A' }),
      mockAccount({ id: '2', group: 'A' }),
      mockAccount({ id: '3', group: 'B' }),
      mockAccount({ id: '4', group: '' }),
      mockAccount({ id: '5', group: 'B' }),
    ];
    const groups = groupAccounts(accounts);
    expect(groups).toHaveLength(3);
    expect(groups[0].group).toBe('A');
    expect(groups[0].accounts).toHaveLength(2);
    expect(groups[1].group).toBe('B');
    expect(groups[1].accounts).toHaveLength(2);
    expect(groups[2].group).toBe('');
    expect(groups[2].accounts).toHaveLength(1);
  });

  it('places empty group at end', () => {
    const accounts = [
      mockAccount({ id: '1', group: '' }),
      mockAccount({ id: '2', group: 'A' }),
      mockAccount({ id: '3', group: 'A' }),
    ];
    const groups = groupAccounts(accounts);
    expect(groups[0].group).toBe('A');
    expect(groups[1].group).toBe('');
  });

  it('handles all-ungrouped accounts', () => {
    const accounts = [
      mockAccount({ id: '1', group: '' }),
      mockAccount({ id: '2', group: '' }),
    ];
    const groups = groupAccounts(accounts);
    expect(groups).toHaveLength(1);
    expect(groups[0].group).toBe('');
    expect(groups[0].accounts).toHaveLength(2);
  });

  it('handles empty accounts array', () => {
    const groups = groupAccounts([]);
    expect(groups).toHaveLength(0);
  });
});

describe('AccountGrid — calcAgingColor', () => {
  it('returns red for expired cookies', () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(calcAgingColor(past)).toBe('bg-error');
  });

  it('returns red for cookies expiring in <7 days', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expect(calcAgingColor(soon)).toBe('bg-error');
  });

  it('returns warning for cookies expiring in 7-20 days', () => {
    const medium = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    expect(calcAgingColor(medium)).toBe('bg-warning');
  });

  it('returns success for cookies expiring in >20 days', () => {
    const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(calcAgingColor(far)).toBe('bg-success');
  });
});

describe('AccountGrid — calcAgingDays', () => {
  it('returns 0 for expired cookies', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(calcAgingDays(past)).toBe(0);
  });

  it('returns correct days for future expiration', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const days = calcAgingDays(future);
    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(10);
  });
});