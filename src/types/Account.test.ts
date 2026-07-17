import { describe, it, expect, vi } from 'vitest';
import type { Account, RecentGame, FavoriteGame } from './Account';

describe('Account type — autoRelaunch field', () => {
  it('Account can have autoRelaunch as optional boolean', () => {
    const acc: Account = {
      id: 'test-1',
      robloxUserId: 12345,
      username: 'testuser',
      group: '',
      lastUsed: new Date(),
      createdAt: new Date(),
    };
    expect(acc.autoRelaunch).toBeUndefined();
  });

  it('Account with autoRelaunch true', () => {
    const acc: Account = {
      id: 'test-2',
      robloxUserId: 67890,
      username: 'testuser2',
      group: 'A',
      lastUsed: new Date(),
      createdAt: new Date(),
      autoRelaunch: true,
    };
    expect(acc.autoRelaunch).toBe(true);
  });

  it('Account with autoRelaunch false', () => {
    const acc: Account = {
      id: 'test-3',
      robloxUserId: 11111,
      username: 'testuser3',
      group: '',
      lastUsed: new Date(),
      createdAt: new Date(),
      autoRelaunch: false,
    };
    expect(acc.autoRelaunch).toBe(false);
  });
});

describe('Account type — recentGames and favoriteGames', () => {
  it('Account with recentGames array', () => {
    const recent: RecentGame = {
      id: 'r-1',
      gameId: 123,
      name: 'Game One',
      lastPlayed: new Date(),
      placeId: '456',
      placeName: 'Place One',
      universeId: 789,
    };
    const acc: Account = {
      id: 'test-4',
      robloxUserId: 22222,
      username: 'testuser4',
      group: '',
      lastUsed: new Date(),
      createdAt: new Date(),
      recentGames: [recent],
    };
    expect(acc.recentGames).toHaveLength(1);
    expect(acc.recentGames![0].name).toBe('Game One');
  });

  it('Account with favoriteGames array', () => {
    const fav: FavoriteGame = {
      id: 'f-1',
      gameId: 456,
      name: 'Game Two',
      addedAt: new Date(),
    };
    const acc: Account = {
      id: 'test-5',
      robloxUserId: 33333,
      username: 'testuser5',
      group: '',
      lastUsed: new Date(),
      createdAt: new Date(),
      favoriteGames: [fav],
    };
    expect(acc.favoriteGames).toHaveLength(1);
    expect(acc.favoriteGames![0].name).toBe('Game Two');
  });
});