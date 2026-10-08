// MultiRobloxService — suite 7 (autorizada por el operador 2026-10-08).
// Cubre validación de jobId/placeId (defensa contra shell injection), launchMulti
// vía shell.openExternal + captura de PID, killInstance por PID, y getRunningInstances.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockState = vi.hoisted(() => ({
  openExternal: vi.fn(async (_url: string) => true),
  tasklistOutput: '"RobloxPlayerBeta.exe","1234","Console","1","100 K"\r\n',
  execCalls: [] as string[],
  execAsyncCalls: [] as string[],
  execAsyncError: null as Error | null,
  authTicket: 'TICKET-OK',
  authTicketError: null as Error | null,
}))

vi.mock('electron', () => ({
  shell: { openExternal: (url: string) => mockState.openExternal(url) },
}))

vi.mock('../../src/infrastructure/external/RobloxHttp', () => ({
  getAuthTicket: vi.fn(async (_cookie: string) => {
    if (mockState.authTicketError) throw mockState.authTicketError
    return mockState.authTicket
  }),
}))

vi.mock('../../src/infrastructure/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn((cmd: string) => {
    mockState.execCalls.push(cmd)
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

// MultiRobloxService keeps module-level state (runningInstances map). Use
// vi.resetModules() + dynamic import per test so every test starts from a clean
// registry — the production module has no reset hook.
let launchMulti: typeof import('../../src/infrastructure/external/MultiRobloxService').launchMulti
let killInstance: typeof import('../../src/infrastructure/external/MultiRobloxService').killInstance
let getRunningInstances: typeof import('../../src/infrastructure/external/MultiRobloxService').getRunningInstances

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../src/infrastructure/external/MultiRobloxService')
  launchMulti = mod.launchMulti
  killInstance = mod.killInstance
  getRunningInstances = mod.getRunningInstances
})

// UUID v4 con 36 chars hex+hyphens — el único formato que pasa isValidJobId.
const VALID_JOB_ID = '12345678-1234-1234-1234-123456789abc'

beforeEach(() => {
  mockState.execCalls.length = 0
  mockState.execAsyncCalls.length = 0
  mockState.execAsyncError = null
  mockState.authTicketError = null
  mockState.authTicket = 'TICKET-OK'
  mockState.tasklistOutput = '"RobloxPlayerBeta.exe","1234","Console","1","100 K"\r\n'
  mockState.openExternal.mockClear()
  mockState.openExternal.mockResolvedValue(true)
})

describe('MultiRobloxService — launchMulti validation (fail-closed)', () => {
  it('rejects a jobId with shell metacharacters and returns 0', async () => {
    const pid = await launchMulti('acc-1', '123', 'job; rm -rf /', 'cookie')
    expect(pid).toBe(0)
    expect(mockState.openExternal).not.toHaveBeenCalled()
  })

  it('rejects a non-hex jobId of correct length', async () => {
    const pid = await launchMulti('acc-1', '123', 'z'.repeat(36), 'cookie')
    expect(pid).toBe(0)
    expect(mockState.openExternal).not.toHaveBeenCalled()
  })

  it('rejects a placeId with shell metacharacters', async () => {
    const pid = await launchMulti('acc-1', '123; whoami', '', 'cookie')
    expect(pid).toBe(0)
    expect(mockState.openExternal).not.toHaveBeenCalled()
  })

  it('rejects a non-numeric placeId', async () => {
    const pid = await launchMulti('acc-1', 'abc', '', 'cookie')
    expect(pid).toBe(0)
  })

  it('rejects a placeId longer than 20 digits', async () => {
    const pid = await launchMulti('acc-1', '1'.repeat(21), '', 'cookie')
    expect(pid).toBe(0)
  })

  it('rejects an empty cookie', async () => {
    const pid = await launchMulti('acc-1', '123', '', '   ')
    expect(pid).toBe(0)
    expect(mockState.openExternal).not.toHaveBeenCalled()
  })

  it('returns 0 when getAuthTicket throws', async () => {
    mockState.authTicketError = new Error('auth rejected')
    const pid = await launchMulti('acc-1', '123', '', 'cookie')
    expect(pid).toBe(0)
    expect(mockState.openExternal).not.toHaveBeenCalled()
  })

  it('returns 0 when shell.openExternal rejects (no PID captured)', async () => {
    mockState.openExternal.mockRejectedValue(new Error('no handler'))
    const pid = await launchMulti('acc-1', '123', '', 'cookie')
    expect(pid).toBe(0)
  })
})

describe('MultiRobloxService — launchMulti success paths', () => {
  it('accepts an empty jobId (RequestGame without gameId)', async () => {
    const pid = await launchMulti('acc-1', '123', '', 'cookie')
    expect(pid).toBe(1234)
    const url = (mockState.openExternal.mock.calls[0]?.[0] as string | undefined) ?? ''
    expect(url).toContain('request%3DRequestGame%26placeId%3D123')
    expect(url).not.toContain('gameId')
  })

  it('accepts a valid jobId and encodes gameId in the launcher URL', async () => {
    const pid = await launchMulti('acc-1', '123', VALID_JOB_ID, 'cookie')
    expect(pid).toBe(1234)
    const url = (mockState.openExternal.mock.calls[0]?.[0] as string | undefined) ?? ''
    expect(decodeURIComponent(url)).toContain(`request=RequestGameJob&placeId=123&gameId=${VALID_JOB_ID}`)
  })

  it('includes the auth ticket in the roblox-player:// URI', async () => {
    await launchMulti('acc-1', '123', '', 'cookie')
    const url = (mockState.openExternal.mock.calls[0]?.[0] as string | undefined) ?? ''
    expect(url.startsWith('roblox-player://1+launchmode:play+gameinfo:TICKET-OK')).toBe(true)
  })

  it('returns 0 and registers nothing when tasklist yields no Roblox process', async () => {
    mockState.tasklistOutput = 'INFO: No tasks are running which match the specified criteria.\r\n'
    const pid = await launchMulti('acc-1', '123', '', 'cookie')
    expect(pid).toBe(0)
    expect(getRunningInstances()).toEqual([])
  })

  it('returns 0 when execSync throws (PID detection failure)', async () => {
    const cp = await import('node:child_process')
    vi.mocked(cp.execSync).mockImplementationOnce(() => { throw new Error('tasklist failed') })
    const pid = await launchMulti('acc-1', '123', '', 'cookie')
    expect(pid).toBe(0)
  })

  it('does not call shell.openExternal on non-win32 platforms', async () => {
    const orig = process.platform
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
    try {
      const pid = await launchMulti('acc-1', '123', '', 'cookie')
      expect(mockState.openExternal).not.toHaveBeenCalled()
      // execSync tasklist still runs but openExternal is skipped
      expect(pid).toBe(1234)
    } finally {
      Object.defineProperty(process, 'platform', { value: orig, configurable: true })
    }
  })
})

describe('MultiRobloxService — killInstance + getRunningInstances', () => {
  it('getRunningInstances is empty before any launch', () => {
    expect(getRunningInstances()).toEqual([])
  })

  it('killInstance is a no-op when the accountId was never launched', async () => {
    await killInstance('never-launched')
    expect(mockState.execAsyncCalls).toEqual([])
  })

  it('killInstance taskkills by PID and clears the registry entry', async () => {
    await launchMulti('acc-kill', '123', '', 'cookie')
    expect(getRunningInstances()).toEqual([{ accountId: 'acc-kill', pid: 1234 }])

    await killInstance('acc-kill')

    expect(mockState.execAsyncCalls).toContain('taskkill /F /PID 1234')
    expect(getRunningInstances()).toEqual([])
  })

  it('killInstance uses kill -9 on non-win32 and still clears the entry', async () => {
    const orig = process.platform
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
    try {
      await launchMulti('acc-unix', '123', '', 'cookie')
      await killInstance('acc-unix')
      expect(mockState.execAsyncCalls).toContain('kill -9 1234')
      expect(getRunningInstances()).toEqual([])
    } finally {
      Object.defineProperty(process, 'platform', { value: orig, configurable: true })
    }
  })

  it('killInstance swallows taskkill failure but still clears the entry', async () => {
    await launchMulti('acc-dead', '123', '', 'cookie')
    mockState.execAsyncError = new Error('no such process')
    await expect(killInstance('acc-dead')).resolves.toBeUndefined()
    expect(getRunningInstances()).toEqual([])
  })

  it('tracks multiple concurrent instances independently', async () => {
    await launchMulti('acc-a', '123', '', 'cookie')
    await launchMulti('acc-b', '123', '', 'cookie')

    expect(getRunningInstances()).toEqual([
      { accountId: 'acc-a', pid: 1234 },
      { accountId: 'acc-b', pid: 1234 },
    ])

    await killInstance('acc-a')
    expect(getRunningInstances()).toEqual([{ accountId: 'acc-b', pid: 1234 }])
  })
})

afterEach(() => {
  vi.clearAllMocks()
})
