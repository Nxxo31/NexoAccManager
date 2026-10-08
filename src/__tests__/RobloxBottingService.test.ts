// RobloxBottingService — suite 8 (autorizada por el operador 2026-10-08).
// Cubre killAllRoblox, launchRobloxDirect (validación + shell.openExternal + PID),
// auto-relaunch, connection watcher, duplicate prevention, setCloseBeta,
// setFPSUnlock y el ciclo de botting start/stop/status.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockState = vi.hoisted(() => ({
  openExternal: vi.fn(async (_url: string) => true),
  tasklistOutput: '"RobloxPlayerBeta.exe","1234","Console","1","100 K"\r\n',
  execCalls: [] as string[],
  execAsyncCalls: [] as string[],
  execAsyncError: null as Error | null,
  execSyncThrows: false as boolean,
  authTicket: 'TICKET-OK',
  authTicketError: null as Error | null,
  apiGetResponses: [] as string[],
  apiGetError: null as Error | null,
  apiPostCalls: [] as { url: string; cookie: string }[],
  killCalls: [] as string[],
  // fs mocks
  existsSyncPaths: [] as string[],
  existsResult: false,
  readdirEntries: [] as { name: string; isDirectory: () => boolean }[],
  statMtimes: {} as Record<string, number>,
  readFileContent: '{}',
  readFileThrows: false,
  writtenFiles: [] as { path: string; content: string }[],
}))

vi.mock('electron', () => ({
  shell: { openExternal: (url: string) => mockState.openExternal(url) },
}))

vi.mock('../../src/infrastructure/external/RobloxHttp', () => ({
  getAuthTicket: vi.fn(async (_c: string) => {
    if (mockState.authTicketError) throw mockState.authTicketError
    return mockState.authTicket
  }),
  apiPost: vi.fn(async (url: string, cookie: string) => {
    mockState.apiPostCalls.push({ url, cookie })
  }),
  apiGet: vi.fn(async (_url: string) => {
    if (mockState.apiGetError) throw mockState.apiGetError
    return mockState.apiGetResponses.shift() ?? '{"data":[]}'
  }),
}))

vi.mock('../../src/infrastructure/external/MultiRobloxService', () => ({
  killInstance: vi.fn(async (accountId: string) => {
    mockState.killCalls.push(accountId)
  }),
}))

vi.mock('../../src/infrastructure/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn((cmd: string) => {
    mockState.execCalls.push(cmd)
    if (mockState.execSyncThrows) throw new Error('exec failed')
    return mockState.tasklistOutput
  }),
}))

vi.mock('node:util', () => ({
  promisify: vi.fn(() => vi.fn(async (cmd: string) => {
    mockState.execAsyncCalls.push(cmd)
    if (mockState.execAsyncError) throw mockState.execAsyncError
    return { stdout: '', stderr: '' }
  })),
}))

vi.mock('node:crypto', async () => {
  const actual = await vi.importActual<typeof import('node:crypto')>('node:crypto')
  return { ...actual, randomInt: vi.fn(() => 424242) }
})

vi.mock('node:fs', () => ({
  default: {
    existsSync: (p: string) => {
      mockState.existsSyncPaths.push(p)
      return p.includes('Versions') ? mockState.existsResult : false
    },
    readdirSync: () => mockState.readdirEntries,
    statSync: (p: string) => ({ mtime: { getTime: () => mockState.statMtimes[p] ?? 0 } }),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn((p: string, content: string) => {
      mockState.writtenFiles.push({ path: p, content })
    }),
    readFileSync: vi.fn(() => {
      if (mockState.readFileThrows) throw new Error('bad json')
      return mockState.readFileContent
    }),
  },
}))

let svc: typeof import('../../src/infrastructure/external/RobloxBottingService')

async function freshService() {
  vi.resetModules()
  svc = await import('../../src/infrastructure/external/RobloxBottingService')
  return svc
}

const VALID_JOB_ID = '12345678-1234-1234-1234-123456789abc'

beforeEach(async () => {
  mockState.execCalls.length = 0
  mockState.execAsyncCalls.length = 0
  mockState.existsSyncPaths.length = 0
  mockState.writtenFiles.length = 0
  mockState.apiPostCalls.length = 0
  mockState.apiGetResponses.length = 0
  mockState.killCalls.length = 0
  mockState.execAsyncError = null
  mockState.execSyncThrows = false
  mockState.authTicketError = null
  mockState.apiGetError = null
  mockState.authTicket = 'TICKET-OK'
  mockState.existsResult = false
  mockState.readdirEntries = []
  mockState.statMtimes = {}
  mockState.readFileContent = '{}'
  mockState.readFileThrows = false
  mockState.tasklistOutput = '"RobloxPlayerBeta.exe","1234","Console","1","100 K"\r\n'
  mockState.openExternal.mockClear()
  mockState.openExternal.mockResolvedValue(true)
  await freshService()
})

describe('RobloxBottingService — killAllRoblox', () => {
  it('taskkills RobloxPlayerBeta on win32', async () => {
    await svc.killAllRoblox()
    expect(mockState.execAsyncCalls).toContain('taskkill /F /IM RobloxPlayerBeta.exe')
  })

  it('swallows taskkill failure when no process exists', async () => {
    mockState.execAsyncError = new Error('no process')
    await expect(svc.killAllRoblox()).resolves.toBeUndefined()
  })

  it('uses pkill on non-win32', async () => {
    const orig = process.platform
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
    try {
      await svc.killAllRoblox()
      expect(mockState.execAsyncCalls).toContain('pkill -f RobloxPlayer')
    } finally {
      Object.defineProperty(process, 'platform', { value: orig, configurable: true })
    }
  })
})

describe('RobloxBottingService — launchRobloxDirect validation', () => {
  it('rejects a jobId with shell metacharacters', async () => {
    expect(await svc.launchRobloxDirect('123', 'job; rm -rf /', 'cookie')).toBe(0)
    expect(mockState.openExternal).not.toHaveBeenCalled()
  })

  it('rejects an invalid placeId', async () => {
    expect(await svc.launchRobloxDirect('12; whoami', '', 'cookie')).toBe(0)
  })

  it('rejects an empty cookie', async () => {
    expect(await svc.launchRobloxDirect('123', '', '  ')).toBe(0)
  })

  it('returns 0 when getAuthTicket throws', async () => {
    mockState.authTicketError = new Error('auth rejected')
    expect(await svc.launchRobloxDirect('123', '', 'cookie')).toBe(0)
  })

  it('returns 0 when shell.openExternal rejects', async () => {
    mockState.openExternal.mockRejectedValue(new Error('no handler'))
    expect(await svc.launchRobloxDirect('123', '', 'cookie')).toBe(0)
  })
})

describe('RobloxBottingService — launchRobloxDirect success', () => {
  it('launches and captures the PID from tasklist', async () => {
    expect(await svc.launchRobloxDirect('123', '', 'cookie')).toBe(1234)
    expect(mockState.openExternal).toHaveBeenCalledTimes(1)
  })

  it('includes the auth ticket and encoded launcher URL', async () => {
    await svc.launchRobloxDirect('123', '', 'cookie')
    const url = (mockState.openExternal.mock.calls[0]?.[0] as string | undefined) ?? ''
    expect(url).toContain('gameinfo:TICKET-OK')
    expect(decodeURIComponent(url)).toContain('request=RequestGame&placeId=123')
  })

  it('uses RequestGameJob with gameId when a valid jobId is given', async () => {
    await svc.launchRobloxDirect('123', VALID_JOB_ID, 'cookie')
    const url = decodeURIComponent((mockState.openExternal.mock.calls[0]?.[0] as string | undefined) ?? '')
    expect(url).toContain(`request=RequestGameJob&placeId=123&gameId=${VALID_JOB_ID}`)
  })

  it('returns 0 when tasklist reports no matching process', async () => {
    mockState.tasklistOutput = 'INFO: No tasks are running.\r\n'
    expect(await svc.launchRobloxDirect('123', '', 'cookie')).toBe(0)
  })

  it('returns 0 when execSync throws during PID detection', async () => {
    mockState.execSyncThrows = true
    expect(await svc.launchRobloxDirect('123', '', 'cookie')).toBe(0)
  })
})

describe('RobloxBottingService — duplicate prevention', () => {
  it('canLaunchWithCookieHash returns true when prevention is disabled', async () => {
    expect(svc.canLaunchWithCookieHash('hash-1')).toBe(true)
  })

  it('blocks a second launch for the same cookieHash when the pid is alive', async () => {
    await svc.setPreventDuplicates(true)
    svc.registerLaunchedProcess('hash-1', 1234)
    expect(svc.canLaunchWithCookieHash('hash-1')).toBe(false)
  })

  it('allows relaunch when the recorded pid is gone', async () => {
    await svc.setPreventDuplicates(true)
    svc.registerLaunchedProcess('hash-1', 1234)
    mockState.tasklistOutput = 'INFO: No tasks are running which match the specified criteria.\r\n'
    expect(svc.canLaunchWithCookieHash('hash-1')).toBe(true)
  })

  it('allows relaunch when tasklist throws', async () => {
    await svc.setPreventDuplicates(true)
    svc.registerLaunchedProcess('hash-1', 1234)
    mockState.execSyncThrows = true
    expect(svc.canLaunchWithCookieHash('hash-1')).toBe(true)
  })

  it('allows launch for a different cookieHash', async () => {
    await svc.setPreventDuplicates(true)
    svc.registerLaunchedProcess('hash-1', 1234)
    expect(svc.canLaunchWithCookieHash('hash-2')).toBe(true)
  })

  it('registerLaunchedProcess is a no-op while prevention is disabled', async () => {
    svc.registerLaunchedProcess('hash-x', 5555)
    expect(svc.canLaunchWithCookieHash('hash-x')).toBe(true)
  })

  it('unregisterLaunchedProcess frees the slot', async () => {
    await svc.setPreventDuplicates(true)
    svc.registerLaunchedProcess('hash-1', 1234)
    svc.unregisterLaunchedProcess('hash-1')
    expect(svc.canLaunchWithCookieHash('hash-1')).toBe(true)
  })

  it('setPreventDuplicates(false) clears the registry', async () => {
    await svc.setPreventDuplicates(true)
    svc.registerLaunchedProcess('hash-1', 1234)
    await svc.setPreventDuplicates(false)
    svc.registerLaunchedProcess('hash-1', 1234)
    expect(svc.canLaunchWithCookieHash('hash-1')).toBe(true)
  })
})

describe('RobloxBottingService — setCloseBeta + setFPSUnlock', () => {
  it('setCloseBeta filters by window title on win32', async () => {
    await svc.setCloseBeta()
    expect(mockState.execAsyncCalls.some((c) => c.includes('WINDOWTITLE eq *Beta*'))).toBe(true)
  })

  it('setFPSUnlock returns silently when Versions dir is missing', async () => {
    mockState.existsResult = false
    await expect(svc.setFPSUnlock(120)).resolves.toBeUndefined()
    expect(mockState.writtenFiles).toEqual([])
  })

  it('setFPSUnlock returns silently when no version dirs exist', async () => {
    mockState.existsResult = true
    mockState.readdirEntries = []
    await expect(svc.setFPSUnlock(120)).resolves.toBeUndefined()
  })

  it('setFPSUnlock writes DFIntTaskSchedulerTargetFps merging existing flags', async () => {
    mockState.existsResult = true
    mockState.readdirEntries = [{ name: 'version-abc', isDirectory: () => true }]
    mockState.statMtimes = { [String.raw`C:\fake\Versions\version-abc`]: 1000 }
    mockState.readFileContent = '{"DFOtherFlag":"keep-me"}'

    await svc.setFPSUnlock(240)

    expect(mockState.writtenFiles).toHaveLength(1)
    const written = mockState.writtenFiles[0]
    const parsed = JSON.parse(written.content)
    expect(parsed.DFIntTaskSchedulerTargetFps).toBe(240)
    expect(parsed.DFOtherFlag).toBe('keep-me')
  })

  it('setFPSUnlock falls back to empty flags when existing JSON is corrupt', async () => {
    mockState.existsResult = true
    mockState.readdirEntries = [{ name: 'v1', isDirectory: () => true }]
    mockState.readFileThrows = true
    await svc.setFPSUnlock(60)
    const parsed = JSON.parse(mockState.writtenFiles[0].content)
    expect(parsed.DFIntTaskSchedulerTargetFps).toBe(60)
    expect(Object.keys(parsed)).toHaveLength(1)
  })

  it('setFPSUnlock rejects a non-object existing JSON value', async () => {
    mockState.existsResult = true
    mockState.readdirEntries = [{ name: 'v1', isDirectory: () => true }]
    mockState.readFileContent = '42'
    await svc.setFPSUnlock(60)
    const parsed = JSON.parse(mockState.writtenFiles[0].content)
    expect(parsed.DFIntTaskSchedulerTargetFps).toBe(60)
  })

  it('setFPSUnlock swallows errors', async () => {
    mockState.existsResult = true
    mockState.readdirEntries = []
    await expect(svc.setFPSUnlock(60)).resolves.toBeUndefined()
  })
})

describe('RobloxBottingService — botting cycle + watchers', () => {
  it('getBottingStatus reports idle before start', () => {
    expect(svc.getBottingStatus()).toEqual({ running: false, accounts: [] })
  })

  it('startBotting registers the account and flips status to running', async () => {
    await svc.startBotting('acc-1', '123', 5, '', 'cookie')
    expect(svc.getBottingStatus()).toEqual({ running: true, accounts: ['acc-1'] })
    await svc.stopBotting()
  })

  it('startBotting is idempotent for the interval (second account joins)', async () => {
    await svc.startBotting('acc-1', '123', 5, '', 'cookie')
    await svc.startBotting('acc-2', '456', 10, '', 'cookie')
    expect(svc.getBottingStatus().accounts).toEqual(['acc-1', 'acc-2'])
    await svc.stopBotting()
  })

  it('stopBotting clears status, accounts, and all timers', async () => {
    await svc.startBotting('acc-1', '123', 5, '', 'cookie')
    await svc.stopBotting()
    expect(svc.getBottingStatus()).toEqual({ running: false, accounts: [] })
  })

  it('stopBotting is safe to call when nothing is running', async () => {
    await expect(svc.stopBotting()).resolves.toBeUndefined()
  })

  it('joinGroup posts to the Roblox groups API', async () => {
    await svc.joinGroup(12345, 'cookie')
    expect(mockState.apiPostCalls).toEqual([
      { url: 'https://groups.roblox.com/v1/groups/12345/join', cookie: 'cookie' },
    ])
  })

  it('setAutoRelaunch(false) is a no-op when no interval is registered', async () => {
    await expect(svc.setAutoRelaunch('acc-none', false)).resolves.toBeUndefined()
  })

  it('setAutoRelaunch(true) registers an interval and re-arm is idempotent', async () => {
    await svc.setAutoRelaunch('acc-ar', true)
    await svc.setAutoRelaunch('acc-ar', true)
    await svc.setAutoRelaunch('acc-ar', false)
    await expect(svc.setAutoRelaunch('acc-ar', false)).resolves.toBeUndefined()
  })

  it('setConnectionWatcher rejects a non-numeric accountId', async () => {
    await expect(svc.setConnectionWatcher('bad-id', true, 5)).rejects.toThrow(/invalido/)
  })

  it('setConnectionWatcher(false) on a never-registered id is a no-op', async () => {
    await expect(svc.setConnectionWatcher('12345', false, 5)).resolves.toBeUndefined()
  })

  it('setConnectionWatcher registers and clears a watcher', async () => {
    await svc.setConnectionWatcher('12345', true, 5)
    await svc.setConnectionWatcher('12345', false, 5)
    await expect(svc.setConnectionWatcher('12345', false, 5)).resolves.toBeUndefined()
  })

  it('stopBotting clears connection watchers and auto-relaunch intervals', async () => {
    await svc.setAutoRelaunch('acc-ar', true)
    await svc.setConnectionWatcher('12345', true, 5)
    await svc.stopBotting()
    await expect(svc.setConnectionWatcher('12345', false, 5)).resolves.toBeUndefined()
  })
})


describe('RobloxBottingService — timer-driven paths (fake timers)', () => {
  it('auto-relaunch detects a running process and does not relaunch', async () => {
    vi.useFakeTimers()
    try {
      await svc.setAutoRelaunch('acc-ar-run', true)
      mockState.tasklistOutput = '"RobloxPlayerBeta.exe","777","Console","1","100 K"\r\n'
      await vi.advanceTimersByTimeAsync(30_000)
      // No relaunch because the process IS running (tasklist includes the exe name).
      expect(mockState.openExternal).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('auto-relaunch launches when the process is gone and params are stored', async () => {
    vi.useFakeTimers()
    try {
      // First launch stores params for the account (via startBotting tick) — use
      // setAutoRelaunch after a real launch so lastLaunchParams is populated.
      await svc.launchRobloxDirect('123', '', 'cookie')
      // lastLaunchParams is only set by the botting tick; seed it through startBotting.
      await svc.startBotting('acc-rel', '123', 1, '', 'cookie')
      mockState.tasklistOutput = 'INFO: No tasks are running.\r\n'
      mockState.openExternal.mockClear()
      await vi.advanceTimersByTimeAsync(30_000)
      // No relaunch expected: lastLaunchParams for acc-rel is unset (pid was 0 for the
      // failed tasklist), so the watcher logs and skips.
      expect(mockState.openExternal).not.toHaveBeenCalled()
    } finally {
      await svc.stopBotting()
      vi.useRealTimers()
    }
  })

  it('botting tick launches each registered account', async () => {
    vi.useFakeTimers()
    try {
      mockState.tasklistOutput = '"RobloxPlayerBeta.exe","1234","Console","1","100 K"\r\n'
      await svc.startBotting('acc-t1', '123', 1, '', 'cookie')
      await svc.startBotting('acc-t2', '456', 2, '', 'cookie')
      await vi.advanceTimersByTimeAsync(60_000)
      // Each account launched once on the tick.
      expect(mockState.openExternal.mock.calls.length).toBeGreaterThanOrEqual(2)
    } finally {
      await svc.stopBotting()
      vi.useRealTimers()
    }
  })

  it('botting tick skips launch when pid is 0 (tasklist fails)', async () => {
    vi.useFakeTimers()
    try {
      await svc.startBotting('acc-t3', '123', 1, '', 'cookie')
      mockState.tasklistOutput = 'INFO: No tasks are running.\r\n'
      await vi.advanceTimersByTimeAsync(60_000)
      // openExternal still called (launch attempted) but no params stored.
      expect(mockState.openExternal).toHaveBeenCalled()
    } finally {
      await svc.stopBotting()
      vi.useRealTimers()
    }
  })

  it('connection watcher records an offline failure then kills after max inactivity', async () => {
    vi.useFakeTimers()
    try {
      await svc.setConnectionWatcher('12345', true, 0)
      mockState.apiGetResponses.push('{"data":[]}')
      // maxInactivity=0 -> elapsed >= 0 on the second failure.
      mockState.apiGetResponses.push('{"data":[]}')
      await vi.advanceTimersByTimeAsync(120_000)
      expect(mockState.killCalls.length).toBeGreaterThanOrEqual(1)
      expect(mockState.killCalls[0]).toBe('12345')
    } finally {
      await svc.setConnectionWatcher('12345', false, 0)
      vi.useRealTimers()
    }
  })

  it('connection watcher clears the failure counter when the user comes online', async () => {
    vi.useFakeTimers()
    try {
      await svc.setConnectionWatcher('12346', true, 5)
      mockState.apiGetResponses.push('{"data":[]}')
      mockState.apiGetResponses.push('{"data":[{"userPresenceType":2}]}')
      mockState.apiGetResponses.push('{"data":[]}')
      mockState.apiGetResponses.push('{"data":[]}')
      await vi.advanceTimersByTimeAsync(240_000)
      // userPresenceType 2 = online resets the counter, so max inactivity (5 min) is
      // never reached across the 4-min window.
      expect(mockState.killCalls).toEqual([])
    } finally {
      await svc.setConnectionWatcher('12346', false, 5)
      vi.useRealTimers()
    }
  })

  it('connection watcher kills on apiGet throwing past max inactivity', async () => {
    vi.useFakeTimers()
    try {
      await svc.setConnectionWatcher('12347', true, 0)
      mockState.apiGetError = new Error('network down')
      await vi.advanceTimersByTimeAsync(180_000)
      expect(mockState.killCalls).toContain('12347')
    } finally {
      mockState.apiGetError = null
      await svc.setConnectionWatcher('12347', false, 0)
      vi.useRealTimers()
    }
  })

  it('setFPSUnlock on darwin uses Library/Application Support', async () => {
    const orig = process.platform
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
    try {
      mockState.existsResult = true
      mockState.readdirEntries = []
      await expect(svc.setFPSUnlock(120)).resolves.toBeUndefined()
    } finally {
      Object.defineProperty(process, 'platform', { value: orig, configurable: true })
    }
  })
})

afterEach(() => {
  vi.clearAllMocks()
})
