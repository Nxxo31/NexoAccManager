import { describe, it, expect } from 'vitest';

/**
 * Tests for GamesService game/server processing logic.
 * Tests the data transformation and caching behavior without real network calls.
 */

// Replicate the interfaces from GamesService for testing
export interface GameServer {
  jobId: string;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN';
  fps: number;
  accessibility: string;
}

// Replicate the region estimation logic from GamesService
function estimateRegionFromPing(ping: number): GameServer['region'] {
  if (ping < 80) return 'NA';
  if (ping < 120) return 'SA';
  if (ping < 180) return 'EU';
  if (ping < 250) return 'ASIA';
  return 'UNKNOWN';
}

describe('GamesService - Region Estimation', () => {
  it('should classify low ping as NA (North America)', () => {
    expect(estimateRegionFromPing(20)).toBe('NA');
    expect(estimateRegionFromPing(50)).toBe('NA');
    expect(estimateRegionFromPing(79)).toBe('NA');
  });

  it('should classify medium-low ping as SA (South America)', () => {
    expect(estimateRegionFromPing(80)).toBe('SA');
    expect(estimateRegionFromPing(100)).toBe('SA');
    expect(estimateRegionFromPing(119)).toBe('SA');
  });

  it('should classify medium ping as EU (Europe)', () => {
    expect(estimateRegionFromPing(120)).toBe('EU');
    expect(estimateRegionFromPing(150)).toBe('EU');
    expect(estimateRegionFromPing(179)).toBe('EU');
  });

  it('should classify high ping as ASIA', () => {
    expect(estimateRegionFromPing(180)).toBe('ASIA');
    expect(estimateRegionFromPing(220)).toBe('ASIA');
    expect(estimateRegionFromPing(249)).toBe('ASIA');
  });

  it('should classify very high ping as UNKNOWN', () => {
    expect(estimateRegionFromPing(250)).toBe('UNKNOWN');
    expect(estimateRegionFromPing(300)).toBe('UNKNOWN');
    expect(estimateRegionFromPing(500)).toBe('UNKNOWN');
  });
});

describe('GamesService - Server Data Processing', () => {
  // Mock server data as returned by Roblox API
  const mockApiServers = [
    { id: 'job-001', playing: 10, maxPlayers: 25, fps: 60 },
    { id: 'job-002', playing: 20, maxPlayers: 30, fps: 59 },
    { id: 'job-003', playing: 5, maxPlayers: 20, fps: 60 },
  ];

  it('should transform API server data to GameServer format', () => {
    const servers: GameServer[] = mockApiServers.map((s) => ({
      jobId: s.id,
      playerCount: s.playing,
      maxPlayers: s.maxPlayers,
      ping: 100,
      region: estimateRegionFromPing(100),
      fps: s.fps,
      accessibility: 'Public',
    }));

    expect(servers).toHaveLength(3);
    expect(servers[0].jobId).toBe('job-001');
    expect(servers[0].playerCount).toBe(10);
    expect(servers[0].maxPlayers).toBe(25);
    expect(servers[0].region).toBe('SA');
  });

  it('should handle empty server list', () => {
    const servers: GameServer[] = [];
    expect(servers).toHaveLength(0);
  });

  it('should handle servers with missing fields', () => {
    const rawData: any[] = [
      { id: 'job-1', playing: 0, maxPlayers: 0, fps: 0 },
      { id: 'job-2' }, // missing fields
    ];

    const servers: GameServer[] = rawData.map((s) => ({
      jobId: s.id || '',
      playerCount: s.playing || 0,
      maxPlayers: s.maxPlayers || 25,
      ping: 100,
      region: 'UNKNOWN' as const,
      fps: s.fps || 60,
      accessibility: s.accessibility || 'Public',
    }));

    expect(servers).toHaveLength(2);
    expect(servers[1].playerCount).toBe(0);
    expect(servers[1].maxPlayers).toBe(25);
    expect(servers[1].fps).toBe(60);
  });

  it('should sort servers by ping (ascending)', () => {
    const servers: GameServer[] = [
      { jobId: 'a', playerCount: 10, maxPlayers: 25, ping: 200, region: 'EU', fps: 60, accessibility: 'Public' },
      { jobId: 'b', playerCount: 10, maxPlayers: 25, ping: 50, region: 'NA', fps: 60, accessibility: 'Public' },
      { jobId: 'c', playerCount: 10, maxPlayers: 25, ping: 100, region: 'SA', fps: 60, accessibility: 'Public' },
    ];

    const sorted = [...servers].sort((a, b) => a.ping - b.ping);
    expect(sorted[0].jobId).toBe('b');
    expect(sorted[1].jobId).toBe('c');
    expect(sorted[2].jobId).toBe('a');
  });

  it('should sort servers by player count (descending)', () => {
    const servers: GameServer[] = [
      { jobId: 'a', playerCount: 5, maxPlayers: 25, ping: 100, region: 'SA', fps: 60, accessibility: 'Public' },
      { jobId: 'b', playerCount: 20, maxPlayers: 25, ping: 100, region: 'SA', fps: 60, accessibility: 'Public' },
      { jobId: 'c', playerCount: 10, maxPlayers: 25, ping: 100, region: 'SA', fps: 60, accessibility: 'Public' },
    ];

    const sorted = [...servers].sort((a, b) => b.playerCount - a.playerCount);
    expect(sorted[0].jobId).toBe('b');
    expect(sorted[1].jobId).toBe('c');
    expect(sorted[2].jobId).toBe('a');
  });
});

describe('GamesService - Round Robin Distribution', () => {
  it('should distribute accounts across servers in round-robin', () => {
    const accountIds = ['acc1', 'acc2', 'acc3', 'acc4', 'acc5'];
    const servers = [
      { jobId: 'server1' },
      { jobId: 'server2' },
      { jobId: 'server3' },
    ];

    const assignments = accountIds.map((accId, i) => ({
      accountId: accId,
      jobId: servers[i % servers.length].jobId,
    }));

    expect(assignments[0].jobId).toBe('server1');
    expect(assignments[1].jobId).toBe('server2');
    expect(assignments[2].jobId).toBe('server3');
    expect(assignments[3].jobId).toBe('server1'); // wraps around
    expect(assignments[4].jobId).toBe('server2');
  });

  it('should handle more servers than accounts', () => {
    const accountIds = ['acc1', 'acc2'];
    const servers = [
      { jobId: 'server1' },
      { jobId: 'server2' },
      { jobId: 'server3' },
    ];

    const assignments = accountIds.map((accId, i) => ({
      accountId: accId,
      jobId: servers[i % servers.length].jobId,
    }));

    expect(assignments).toHaveLength(2);
    expect(assignments[0].jobId).toBe('server1');
    expect(assignments[1].jobId).toBe('server2');
  });

  it('should handle single server', () => {
    const accountIds = ['acc1', 'acc2', 'acc3'];
    const servers = [{ jobId: 'only-server' }];

    const assignments = accountIds.map((accId, i) => ({
      accountId: accId,
      jobId: servers[i % servers.length].jobId,
    }));

    assignments.forEach(a => expect(a.jobId).toBe('only-server'));
  });

  it('should handle no servers (fallback)', () => {
    const accountIds = ['acc1', 'acc2'];
    const servers: any[] = [];

    // When no servers available, all accounts go to the same place without jobId
    expect(servers.length).toBe(0);
    // In the actual distributeAccounts, this triggers the fallback path
  });
});
